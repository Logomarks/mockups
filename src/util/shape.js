/**
 * @module @arraypress/mockups/util/shape
 *
 * Flat geometry for the objects drawn in perspective: a rounded rectangle
 * as points (so it can be projected point by point), points as path data,
 * the convex hull of a set (an extruded slab's silhouette), and the affine
 * map that carries one triangle onto another (the perspective warp's
 * pieces).
 */

import { n } from './num.js';

/**
 * A 2D point.
 *
 * @typedef {[number, number]} Vec2
 */

/**
 * A rounded rectangle's outline, clockwise from the top-left corner's top end.
 *
 * @param {number} x Its left edge.
 * @param {number} y Its top edge.
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @param {number} r The corners' radius (held to half the shorter side).
 * @param {number} [steps=8] Points per corner.
 * @returns {Vec2[]} The outline.
 */
export function roundRect(x, y, w, h, r, steps = 8) {
	const rr = Math.max(0, Math.min(r, w / 2, h / 2));
	if (rr === 0) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
	/** @type {Vec2[]} */
	const out = [];
	const corners = /** @type {const} */ ([
		[x + w - rr, y + rr, -90],
		[x + w - rr, y + h - rr, 0],
		[x + rr, y + h - rr, 90],
		[x + rr, y + rr, 180],
	]);
	for (const [cx, cy, a0] of corners) {
		for (let i = 0; i <= steps; i++) {
			const a = ((a0 + (90 * i) / steps) * Math.PI) / 180;
			out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
		}
	}
	// start at the top-left corner's top end
	return [...out.slice(-1), ...out.slice(0, -1)];
}

/**
 * Points as closed path data.
 *
 * @param {readonly Vec2[]} pts The points.
 * @returns {string} `M…L…Z`.
 */
export const polyPath = (pts) => (pts.length ? 'M' + pts.map((p) => `${n(p[0])} ${n(p[1])}`).join('L') + 'Z' : '');

/**
 * The convex hull of some points (monotone chain).
 *
 * @param {readonly Vec2[]} pts The points.
 * @returns {Vec2[]} The hull, counter-clockwise in y-down coordinates.
 */
export function hull(pts) {
	const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	if (p.length < 3) return p;
	const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	/** @type {Vec2[]} */
	const lo = [];
	for (const q of p) {
		while (lo.length >= 2 && turn(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
		lo.push(q);
	}
	/** @type {Vec2[]} */
	const hi = [];
	for (let i = p.length - 1; i >= 0; i--) {
		const q = p[i];
		while (hi.length >= 2 && turn(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
		hi.push(q);
	}
	return [...lo.slice(0, -1), ...hi.slice(0, -1)];
}

/**
 * The affine map carrying one triangle onto another.
 *
 * @param {readonly Vec2[]} s The source triangle.
 * @param {readonly Vec2[]} d The destination triangle.
 * @returns {[number, number, number, number, number, number]} SVG's `matrix(a b c d e f)`.
 */
export function affine(s, d) {
	const [ux, uy, vx, vy] = [s[1][0] - s[0][0], s[1][1] - s[0][1], s[2][0] - s[0][0], s[2][1] - s[0][1]];
	const [px, py, qx, qy] = [d[1][0] - d[0][0], d[1][1] - d[0][1], d[2][0] - d[0][0], d[2][1] - d[0][1]];
	const det = ux * vy - vx * uy || 1e-12;
	// M · [u v] = [p q]  →  M = [p q] · [u v]⁻¹
	const a = (px * vy - qx * uy) / det;
	const c = (qx * ux - px * vx) / det;
	const b = (py * vy - qy * uy) / det;
	const dd = (qy * ux - py * vx) / det;
	return [a, b, c, dd, d[0][0] - a * s[0][0] - c * s[0][1], d[0][1] - b * s[0][0] - dd * s[0][1]];
}

/**
 * A triangle grown outwards by a margin on every side (about its incentre).
 *
 * @param {readonly Vec2[]} t The triangle.
 * @param {number} m The margin.
 * @returns {Vec2[]} The grown triangle.
 */
export function grow(t, m) {
	const [a, b, c] = t;
	const la = Math.hypot(b[0] - c[0], b[1] - c[1]);
	const lb = Math.hypot(a[0] - c[0], a[1] - c[1]);
	const lc = Math.hypot(a[0] - b[0], a[1] - b[1]);
	const per = la + lb + lc || 1;
	const ix = (la * a[0] + lb * b[0] + lc * c[0]) / per;
	const iy = (la * a[1] + lb * b[1] + lc * c[1]) / per;
	const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
	const r = (2 * area) / per;
	const k = r > 1e-9 ? (r + m) / r : 1;
	return t.map((p) => /** @type {Vec2} */ ([ix + (p[0] - ix) * k, iy + (p[1] - iy) * k]));
}

/**
 * A polygon clipped to a rectangle (Sutherland–Hodgman).
 *
 * @param {readonly Vec2[]} pts The polygon.
 * @param {number} x0 The rectangle's left edge.
 * @param {number} y0 Its top edge.
 * @param {number} x1 Its right edge.
 * @param {number} y1 Its bottom edge.
 * @returns {Vec2[]} The part inside.
 */
export function clipRect(pts, x0, y0, x1, y1) {
	/** @type {[(p: Vec2) => boolean, (a: Vec2, b: Vec2) => Vec2][]} */
	const edges = [
		[(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
		[(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
		[(p) => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
		[(p) => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
	];
	let out = [...pts];
	for (const [inside, cut] of edges) {
		const src = out;
		out = [];
		for (let i = 0; i < src.length; i++) {
			const a = src[i];
			const b = src[(i + 1) % src.length];
			if (inside(a)) out.push(a);
			if (inside(a) !== inside(b)) out.push(cut(a, b));
		}
	}
	return out;
}
