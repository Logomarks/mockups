/**
 * @module @logomarks/mockups/parts/curve
 *
 * Smooth outlines from a few points: a closed curve through them
 * (Catmull-Rom, written as cubic Béziers), and a tube round a spine with a
 * width at each point, capped round at its end (a finger, a strap).
 */

import { n } from '../util/num.js';

/**
 * A smooth curve through points, as path data.
 *
 * @param {[number, number][]} pts The points.
 * @param {boolean} [closed=true] Whether it closes back to the first.
 * @returns {string} Path data.
 */
export function smooth(pts, closed = true) {
	const k = pts.length;
	if (k < 2) return '';
	const at = (i) => (closed ? pts[(i + k) % k] : pts[Math.max(0, Math.min(k - 1, i))]);
	let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
	for (let i = 0; i < (closed ? k : k - 1); i++) {
		const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
		d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
	}
	return closed ? d + 'Z' : d;
}

/**
 * The outline round a spine, as points: down one side, round the tip, back up the other.
 *
 * @param {[number, number][]} spine The spine, base to tip.
 * @param {number[]} widths The width at each point of the spine.
 * @param {boolean} [cap=true] Whether to round the tip (otherwise it's cut square).
 * @returns {[number, number][]} The outline's points.
 */
export function tubePoints(spine, widths, cap = true) {
	const k = spine.length;
	/** @type {[number, number][]} */
	const left = [];
	/** @type {[number, number][]} */
	const right = [];
	for (let i = 0; i < k; i++) {
		const a = spine[Math.max(0, i - 1)];
		const b = spine[Math.min(k - 1, i + 1)];
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const l = Math.hypot(dx, dy) || 1;
		const nx = -dy / l;
		const ny = dx / l;
		const w = widths[i] / 2;
		left.push([spine[i][0] + nx * w, spine[i][1] + ny * w]);
		right.push([spine[i][0] - nx * w, spine[i][1] - ny * w]);
	}
	/** @type {[number, number][]} */
	const tip = [];
	if (cap) {
		const a = spine[k - 2];
		const b = spine[k - 1];
		const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
		const tx = (b[0] - a[0]) / l;
		const ty = (b[1] - a[1]) / l;
		const w = widths[k - 1] / 2;
		// a half round from the left side, over the tip, to the right side
		for (const deg of [60, 30, 0, -30, -60]) {
			const t = (deg * Math.PI) / 180;
			tip.push([b[0] + tx * w * Math.cos(t) * 0.95 - ty * w * Math.sin(t), b[1] + ty * w * Math.cos(t) * 0.95 + tx * w * Math.sin(t)]);
		}
	}
	return [...left, ...tip, ...right.reverse()];
}

/**
 * A tube round a spine, as smooth path data.
 *
 * @param {[number, number][]} spine The spine, base to tip.
 * @param {number[]} widths The width at each point.
 * @param {boolean} [cap=true] Whether to round the tip.
 * @returns {string} Path data.
 */
export function tube(spine, widths, cap = true) {
	return smooth(tubePoints(spine, widths, cap));
}
