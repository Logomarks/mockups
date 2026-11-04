/**
 * @module @arraypress/mockups/materials/folds
 *
 * How cloth lies: a height field over a garment, in millimetres. It starts
 * as a soft pillow (cloth rises from its edges, where it rolls down to the
 * surface) with a little unevenness, then each object adds its folds:
 * drapes from the armpits, ripples above a hem, the slack in a sleeve.
 * From the field come the two maps a garment needs: its shade (the folds
 * lit from the mockup's light) and its warp, a two-channel displacement
 * (x in the grey, y in the alpha) that moves the print with the slopes, so
 * a print bunches into a fold and stretches over a ridge, as ink on cloth
 * does.
 */

import { field, fbm, ridge, blur, shadePng, greyPng } from '../util/field.js';
import { clamp } from '../util/num.js';
import { rng } from '../util/rng.js';

/**
 * A cloth's height field over its extent: a pillow inside its outline, plus unevenness.
 *
 * @param {[number, number][]} poly The outline, in mm.
 * @param {{ x0: number, y0: number, x1: number, y1: number }} box The extent the field covers, in mm.
 * @param {import('./folds.js').ClothOptions} o The field's cell size, how far the edge rolls, how high the pillow is, the unevenness and seed.
 * @returns {import('./folds.js').Cloth} The field and how to add folds to it in mm.
 */
export function cloth(poly, box, { cell = 5, edge = 20, pillow = 1, rumple = 0.25, seed }) {
	const bw = box.x1 - box.x0;
	const bh = box.y1 - box.y0;
	const f = field(Math.ceil(bw / cell), Math.ceil(bh / cell));
	const inside = new Uint8Array(f.w * f.h);
	for (let y = 0; y < f.h; y++) {
		for (let x = 0; x < f.w; x++) {
			const px = box.x0 + ((x + 0.5) / f.w) * bw;
			const py = box.y0 + ((y + 0.5) / f.h) * bh;
			const d = signedDistance(poly, px, py);
			if (d > 0) inside[y * f.w + x] = 1;
			const t = clamp(d / edge, 0, 1);
			f.v[y * f.w + x] = pillow * Math.sqrt(t) * (d > 0 ? 1 : 0);
		}
	}
	if (rumple > 0) {
		const n = fbm(field(f.w, f.h), { seed: `${seed}:rumple`, scale: bw / 120, octaves: 3, amp: rumple });
		for (let i = 0; i < f.v.length; i++) f.v[i] += inside[i] ? n.v[i] : 0;
	}
	const frac = (p) => /** @type {[number, number]} */ ([(p[0] - box.x0) / bw, (p[1] - box.y0) / bh]);
	return {
		field: f,
		box,
		fold(a, b, width, height, taper = 0.35) {
			ridge(f, frac(a), frac(b), width / bw, height, taper);
		},
		wrinkle(a, b, width, height, side = 1) {
			wrinkleInto(f, box, a, b, width, height, side);
		},
		foldLine(a, b, width, height, waver = 6) {
			// a folded-and-unfolded line: overlapping short runs, each drifting a little off the straight
			const r = rng(`${seed}:line:${a[0]}:${a[1]}`);
			const runs = 4;
			let off = r.range(-waver, waver);
			for (let i = 0; i < runs; i++) {
				const t0 = Math.max(0, (i - 0.35) / runs);
				const t1 = Math.min(1, (i + 1.35) / runs);
				const next = off + r.range(-waver, waver) * 0.7;
				const at = (t, o) => /** @type {[number, number]} */ ([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + o]);
				wrinkleInto(f, box, at(t0, off), at(t1, next), width, height * r.range(0.7, 1), 1);
				off = next;
			}
		},
		soften(r = 1) {
			blur(f, r);
			for (let i = 0; i < f.v.length; i++) if (!inside[i]) f.v[i] = Math.min(f.v[i], 0);
		},
	};
}

/**
 * Adds a wrinkle along a segment, as jersey folds: a crisp crest, one steep side and one long soft side, fading out at both ends.
 *
 * @param {import('../util/field.js').Field} f The field.
 * @param {{ x0: number, y0: number, x1: number, y1: number }} box The field's extent, in mm.
 * @param {[number, number]} a One end, in mm.
 * @param {[number, number]} b The other end.
 * @param {number} width How far the soft side runs, in mm (the steep side runs a third of it).
 * @param {number} height Its height (negative for a crease).
 * @param {1 | -1} side Which side is the soft one (1: to the left going from `a` to `b`).
 */
function wrinkleInto(f, box, a, b, width, height, side) {
	const cw = (box.x1 - box.x0) / f.w;
	const ch = (box.y1 - box.y0) / f.h;
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const len = Math.hypot(dx, dy) || 1;
	const ux = dx / len;
	const uy = dy / len;
	const reach = width * 4;
	const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - reach - box.x0) / cw));
	const i1 = Math.min(f.w - 1, Math.ceil((Math.max(a[0], b[0]) + reach - box.x0) / cw));
	const j0 = Math.max(0, Math.floor((Math.min(a[1], b[1]) - reach - box.y0) / ch));
	const j1 = Math.min(f.h - 1, Math.ceil((Math.max(a[1], b[1]) + reach - box.y0) / ch));
	for (let j = j0; j <= j1; j++) {
		for (let i = i0; i <= i1; i++) {
			const px = box.x0 + (i + 0.5) * cw - a[0];
			const py = box.y0 + (j + 0.5) * ch - a[1];
			const t = (px * ux + py * uy) / len;
			if (t <= 0 || t >= 1) continue;
			const d = (px * -uy + py * ux) * side;
			// a cusp at the crest: e^(-|d|/w), the soft side three times the steep one
			const w = d > 0 ? width : width / 3;
			const end = Math.min(1, Math.min(t, 1 - t) / 0.3);
			f.v[j * f.w + i] += height * Math.exp(-Math.abs(d) / w) * end * end * (3 - 2 * end);
		}
	}
}

/**
 * How far a point is inside a polygon: positive inside, negative outside.
 *
 * @param {[number, number][]} poly The polygon.
 * @param {number} x The point, x.
 * @param {number} y The point, y.
 * @returns {number} The signed distance.
 */
export function signedDistance(poly, x, y) {
	let d = Infinity;
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [ax, ay] = poly[j];
		const [bx, by] = poly[i];
		if (by > y !== ay > y && x < ((ax - bx) * (y - by)) / (ay - by) + bx) inside = !inside;
		const dx = bx - ax;
		const dy = by - ay;
		const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1));
		d = Math.min(d, Math.hypot(ax + t * dx - x, ay + t * dy - y));
	}
	return inside ? d : -d;
}

/**
 * The folds lit from the light, as a PNG to lay over the garment.
 *
 * @param {import('./folds.js').Cloth} c The cloth.
 * @param {number} light Where the light is, left (-1) to right (1).
 * @param {{ relief?: number, dark?: number, bright?: number }} [o] How steep the folds read, and how dark and bright they go.
 * @returns {string} A PNG `data:` URI.
 */
export function shadeMap(c, light, { relief = 2.5, dark = 0.35, bright = 0.25 } = {}) {
	return shadePng(c.field, { light, relief, dark, bright, gamma: 1.1 });
}

/**
 * The warp the folds put in a print: a two-channel displacement map, x offset in the grey and y offset in the alpha, each the slope of the cloth there.
 *
 * @param {import('./folds.js').Cloth} c The cloth.
 * @returns {{ href: string, peak: number }} The map, and the steepest slope it carries (in height units per cell), so the caller can scale it.
 */
export function warpMap(c) {
	const f = c.field;
	const at = (x, y) => f.v[clamp(y, 0, f.h - 1) * f.w + clamp(x, 0, f.w - 1)];
	const gx = new Float32Array(f.v.length);
	const gy = new Float32Array(f.v.length);
	let peak = 1e-6;
	for (let y = 0; y < f.h; y++) {
		for (let x = 0; x < f.w; x++) {
			const i = y * f.w + x;
			gx[i] = (at(x + 1, y) - at(x - 1, y)) / 2;
			gy[i] = (at(x, y + 1) - at(x, y - 1)) / 2;
			peak = Math.max(peak, Math.abs(gx[i]), Math.abs(gy[i]));
		}
	}
	const href = greyPng(f.w, f.h, (x, y) => [0.5 + (0.5 * gx[y * f.w + x]) / peak, 0.5 + (0.5 * gy[y * f.w + x]) / peak]);
	return { href, peak };
}
