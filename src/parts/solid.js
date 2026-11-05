/**
 * @module @logomarks/mockups/parts/solid
 *
 * Drawing a curved object (a cap's crown, a visor) in 2D from its 3D
 * shape: a parametric surface, seen by an orthographic camera turned and
 * tilted round it. Dense samples of the surface are projected and splatted
 * into small grids behind a depth test, giving the object's outline, how
 * light falls across it (a shade map to lay over the flat colour) and, for
 * a print on it, a two-channel displacement map that wraps flat art onto
 * the curve (x offset in the grey, y offset in the alpha).
 */

import { greyPng } from '../util/field.js';
import { clamp, n } from '../util/num.js';

/**
 * An orthographic camera turned about the vertical and tilted down.
 *
 * @param {number} turn Degrees about the vertical; positive shows the object's left side (its right as you face it).
 * @param {number} tilt Degrees above the horizon the camera looks down from.
 * @returns {import('./solid.js').Ortho} The camera: points and directions into view space (x right, y down the frame, z towards the viewer).
 */
export function ortho(turn, tilt) {
	const t = (turn * Math.PI) / 180;
	const a = (tilt * Math.PI) / 180;
	const ct = Math.cos(t);
	const st = Math.sin(t);
	const ca = Math.cos(a);
	const sa = Math.sin(a);
	const dir = ([x, y, z]) => {
		const x1 = x * ct + z * st;
		const z1 = -x * st + z * ct;
		return /** @type {[number, number, number]} */ ([x1, -(y * ca - z1 * sa), y * sa + z1 * ca]);
	};
	return { point: dir, dir };
}

/**
 * The surface's point and normal at a parameter, from a position function (the normal by finite differences, flipped to `outward`).
 *
 * @param {(u: number, v: number) => [number, number, number]} f The surface.
 * @param {number} u The first parameter.
 * @param {number} v The second.
 * @param {1 | -1} [outward=1] Which side the normal points to.
 * @returns {{ p: [number, number, number], nrm: [number, number, number] }} The point and its unit normal.
 */
export function sample(f, u, v, outward = 1) {
	const e = 1e-3;
	const p = f(u, v);
	const a = f(u + e, v);
	const b = f(u, v + e);
	const du = [a[0] - p[0], a[1] - p[1], a[2] - p[2]];
	const dv = [b[0] - p[0], b[1] - p[1], b[2] - p[2]];
	const c = [du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]];
	const l = Math.hypot(c[0], c[1], c[2]) || 1;
	return { p, nrm: /** @type {[number, number, number]} */ ([(outward * c[0]) / l, (outward * c[1]) / l, (outward * c[2]) / l]) };
}

/**
 * The convex hull of points (monotone chain), counter-clockwise.
 *
 * @param {[number, number][]} pts The points.
 * @returns {[number, number][]} The hull.
 */
export function hull(pts) {
	const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	/** @type {[number, number][]} */
	const lo = [];
	for (const q of p) {
		while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
		lo.push(q);
	}
	/** @type {[number, number][]} */
	const hi = [];
	for (const q of p.reverse()) {
		while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
		hi.push(q);
	}
	return [...lo.slice(0, -1), ...hi.slice(0, -1)];
}

/**
 * A polygon as path data.
 *
 * @param {[number, number][]} pts The points.
 * @param {boolean} [closed=true] Whether to close it.
 * @returns {string} Path data.
 */
export function polyPath(pts, closed = true) {
	return 'M' + pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L') + (closed ? 'Z' : '');
}

/**
 * A grid over a region of the frame, with a depth test, for splatting surface samples into.
 *
 * @param {{ x: number, y: number, w: number, h: number }} box The region, in view units.
 * @param {number} cell A cell's side, in view units.
 * @returns {import('./solid.js').Splat} The grid.
 */
export function splat(box, cell) {
	const w = Math.max(2, Math.ceil(box.w / cell));
	const h = Math.max(2, Math.ceil(box.h / cell));
	const depth = new Float32Array(w * h).fill(-Infinity);
	const a = new Float32Array(w * h);
	const b = new Float32Array(w * h);
	const sx = new Float32Array(w * h);
	const sy = new Float32Array(w * h);
	return {
		w,
		h,
		box,
		put(x, y, z, va, vb = 0) {
			const i = Math.floor(((x - box.x) / box.w) * w);
			const j = Math.floor(((y - box.y) / box.h) * h);
			if (i < 0 || j < 0 || i >= w || j >= h) return;
			const k = j * w + i;
			if (z <= depth[k]) return;
			depth[k] = z;
			a[k] = va;
			b[k] = vb;
			sx[k] = x;
			sy[k] = y;
		},
		fill() {
			// cells no sample reached take their nearest filled neighbour's values, a few rings out
			for (let pass = 0; pass < 6; pass++) {
				const was = depth.slice();
				for (let j = 0; j < h; j++) {
					for (let i = 0; i < w; i++) {
						const k = j * w + i;
						if (was[k] !== -Infinity) continue;
						for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
							const ii = i + di;
							const jj = j + dj;
							if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue;
							const q = jj * w + ii;
							if (was[q] === -Infinity) continue;
							depth[k] = was[q];
							a[k] = a[q];
							b[k] = b[q];
							sx[k] = sx[q];
							sy[k] = sy[q];
							break;
						}
					}
				}
			}
		},
		a,
		b,
		sx,
		sy,
		depth,
	};
}

/**
 * Splatted light as a shade map: black where the surface turns from the light, white where it faces it, clear at `base`.
 *
 * @param {import('./solid.js').Splat} s The grid (its `a` holds each cell's lighting, 0–1).
 * @param {{ base: number, dark: number, bright: number }} o The lighting that reads as the cloth's own colour, and how dark and bright the map may go.
 * @returns {string} A PNG `data:` URI.
 */
export function shadeOf(s, { base, dark, bright }) {
	// two passes of a 3 × 3 average, so the cells' edges never show as steps
	let v0 = s.a;
	for (let pass = 0; pass < 2; pass++) {
		const out = new Float32Array(v0.length);
		for (let y = 0; y < s.h; y++) {
			for (let x = 0; x < s.w; x++) {
				let sum = 0;
				for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) sum += v0[clamp(y + j, 0, s.h - 1) * s.w + clamp(x + i, 0, s.w - 1)];
				out[y * s.w + x] = sum / 9;
			}
		}
		v0 = out;
	}
	return greyPng(s.w, s.h, (x, y) => {
		const v = v0[y * s.w + x];
		return v < base ? [0, ((base - v) / base) * dark] : [1, ((v - base) / (1 - base)) * bright];
	});
}

/**
 * Splatted print coordinates as a displacement map that wraps art drawn flat in `art` onto the surface: each cell's offset to where its art coordinate lies in that box.
 *
 * @param {import('./solid.js').Splat} s The grid (its `a` and `b` hold each cell's art coordinate, 0–1 across and down).
 * @param {{ x: number, y: number, w: number, h: number }} art Where the art is drawn flat, in view units.
 * @returns {{ href: string, scale: number }} The map, and the displacement scale to use with it.
 */
export function warpOf(s, art) {
	const dx = new Float32Array(s.w * s.h);
	const dy = new Float32Array(s.w * s.h);
	let peak = 1e-6;
	for (let y = 0; y < s.h; y++) {
		for (let x = 0; x < s.w; x++) {
			// measured from where the sample itself landed, not the cell's centre, so neighbouring cells agree
			const k = y * s.w + x;
			dx[k] = art.x + s.a[k] * art.w - s.sx[k];
			dy[k] = art.y + s.b[k] * art.h - s.sy[k];
			peak = Math.max(peak, Math.abs(dx[k]), Math.abs(dy[k]));
		}
	}
	const scale = peak * 2.05;
	return { href: greyPng(s.w, s.h, (x, y) => [clamp(0.5 + dx[y * s.w + x] / scale), clamp(0.5 + dy[y * s.w + x] / scale)]), scale };
}
