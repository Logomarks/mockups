/**
 * @module @logomarks/mockups/render/warp
 *
 * A flat drawing laid onto a surface seen in perspective. SVG only has
 * affine transforms, so the drawing is cut into a grid of triangles, each
 * carried by the affine map that fits its three corners exactly: a
 * piecewise-linear projective warp. The grid is as fine as it needs to be
 * for no point to stray more than a fraction of a pixel (a surface seen
 * straight on is one piece). Each piece is its triangle, grown by half a
 * pixel, filled with its cell of the drawing as a pattern carried by the
 * piece's map: one fill per piece, so nothing under it can bleed through
 * its anti-aliased edge (clipping a layered drawing would, in librsvg) and
 * no seams show; and each tile is only its cell, so the drawing is
 * rendered about twice over in all, however many pieces there are.
 */

import { el } from './svg.js';
import { affine, grow, polyPath } from '../util/shape.js';
import { n } from '../util/num.js';

/**
 * How finely to cut a surface: the fewest cells across for the warp to stay within tolerance.
 *
 * @param {(x: number, y: number) => [number, number]} map The drawing's points to pixels.
 * @param {number} w The drawing's width.
 * @param {number} h Its height.
 * @param {number} tolerance The largest error allowed, in pixels.
 * @param {number} max The most cells along the longer side.
 * @returns {[number, number]} Cells across and down.
 */
export function cells(map, w, h, tolerance, max) {
	const L = Math.max(w, h);
	for (let N = 1; N <= max; N++) {
		const nx = Math.max(1, Math.round((N * w) / L));
		const ny = Math.max(1, Math.round((N * h) / L));
		let err = 0;
		for (let j = 0; j < ny && err <= tolerance; j++) {
			for (let i = 0; i < nx; i++) {
				const [x0, x1, y0, y1] = [(i * w) / nx, ((i + 1) * w) / nx, (j * h) / ny, ((j + 1) * h) / ny];
				// a piece is exact at its corners; the worst is midway along an edge or the diagonal
				for (const [a, b] of [[[x0, y0], [x1, y1]], [[x0, y0], [x1, y0]], [[x0, y0], [x0, y1]]]) {
					const pa = map(a[0], a[1]);
					const pb = map(b[0], b[1]);
					const pm = map((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
					err = Math.max(err, Math.hypot(pm[0] - (pa[0] + pb[0]) / 2, pm[1] - (pa[1] + pb[1]) / 2));
				}
				if (err > tolerance) break;
			}
		}
		if (err <= tolerance) return [nx, ny];
	}
	return [Math.max(1, Math.round((max * w) / L)), Math.max(1, Math.round((max * h) / L))];
}

/**
 * A drawing warped onto a surface.
 *
 * @param {import('./scene.js').Scene} sc The document.
 * @param {object} o The warp.
 * @param {string} o.content The id of the drawing in the defs (a `<g>` drawn in `[0, w] × [0, h]`).
 * @param {number} o.width The drawing's width.
 * @param {number} o.height Its height.
 * @param {(x: number, y: number) => [number, number]} o.map Where each of its points lands, in pixels (a projective map).
 * @param {number} [o.tolerance=0.75] The largest error allowed, in pixels (the warp is continuous, so this only bends lines a little at the seams).
 * @param {number} [o.max=28] The most cells along the longer side.
 * @returns {string} The markup.
 */
export function warp(sc, { content, width: w, height: h, map, tolerance = 0.75, max = 28 }) {
	const [nx, ny] = cells(map, w, h, tolerance, max);
	const href = `#${content}`;
	const pt = (i, j) => /** @type {import('../util/shape.js').Vec2} */ ([(i * w) / nx, (j * h) / ny]);
	if (nx === 1 && ny === 1) {
		const s = [pt(0, 0), pt(1, 0), pt(0, 1)];
		return el('use', { href, transform: `matrix(${affine(s, s.map((p) => map(p[0], p[1]))).map(n).join(' ')})` });
	}
	/** @type {import('../util/shape.js').Vec2[][]} */
	const grid = [];
	for (let j = 0; j <= ny; j++) {
		grid.push([]);
		for (let i = 0; i <= nx; i++) grid[j].push(map(...pt(i, j)));
	}
	let out = '';
	for (let j = 0; j < ny; j++) {
		for (let i = 0; i < nx; i++) {
			// split each cell along alternating diagonals, so the pieces don't all lean one way
			const tris = (i + j) % 2 ? [[[i, j], [i + 1, j], [i + 1, j + 1]], [[i, j], [i + 1, j + 1], [i, j + 1]]] : [[[i, j], [i + 1, j], [i, j + 1]], [[i + 1, j], [i + 1, j + 1], [i, j + 1]]];
			for (const t of tris) {
				const s = t.map(([a, b]) => pt(a, b));
				const d = t.map(([a, b]) => grid[b][a]);
				// a piece off the frame is skipped: a renderer would still make its tile, at whatever size it lands
				const xs = d.map((p) => p[0]);
				const ys = d.map((p) => p[1]);
				if (Math.max(...xs) < -2 || Math.min(...xs) > sc.width + 2 || Math.max(...ys) < -2 || Math.min(...ys) > sc.height + 2) continue;
				// each piece is one fill: a tile of just its cell (with a margin wider than the overlap), carried by its affine map
				const m = affine(s, d);
				const px = 2 / Math.max(1e-6, Math.min(Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3])));
				const [bx, by, bw, bh] = [(i * w) / nx - px, (j * h) / ny - px, w / nx + 2 * px, h / ny + 2 * px];
				const fill = sc.id('piece');
				sc.def(el('pattern', { id: fill, patternUnits: 'userSpaceOnUse', x: bx, y: by, width: bw, height: bh, viewBox: `${n(bx)} ${n(by)} ${n(bw)} ${n(bh)}`, patternTransform: `matrix(${m.map(n).join(' ')})` }, el('use', { href })));
				out += el('path', { d: polyPath(grow(d, 0.5)), fill: `url(#${fill})` });
			}
		}
	}
	return el('g', {}, out);
}
