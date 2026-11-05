/**
 * @module @logomarks/mockups/parts/poster/torn
 *
 * The outline of paper that's been up a while: a rectangle whose edges
 * wander a fraction of a millimetre, with bites torn out of it (most often
 * at the corners and along the bottom, where hands and weather get at it).
 * The print sits inside a slightly smaller outline, so a tear shows the
 * paper's white core along its edge.
 */

import { rng } from '../../util/rng.js';
import { n } from '../../util/num.js';

/**
 * A torn sheet's outlines about its centre.
 *
 * @param {number} w Its width (px).
 * @param {number} h Its height (px).
 * @param {number} mm Pixels per millimetre.
 * @param {string} seed The seed.
 * @param {number} [wear=1] How torn: 0 is a clean sheet, 1 a few bites, 2 a lot.
 * @returns {{ paper: string, print: string }} Path data: the paper's edge, and the print's (inside it where it's torn).
 */
export function tornSheet(w, h, mm, seed, wear = 1) {
	const r = rng(`${seed}:torn`);
	const step = 3.5 * mm;
	/** @type {{ x: number, y: number, nx: number, ny: number, t: number }[]} */
	const pts = [];
	const edge = (x0, y0, x1, y1, nx, ny) => {
		const len = Math.hypot(x1 - x0, y1 - y0);
		const k = Math.max(2, Math.round(len / step));
		for (let i = 0; i < k; i++) pts.push({ x: x0 + ((x1 - x0) * i) / k, y: y0 + ((y1 - y0) * i) / k, nx, ny, t: pts.length });
	};
	edge(-w / 2, -h / 2, w / 2, -h / 2, 0, 1);
	edge(w / 2, -h / 2, w / 2, h / 2, -1, 0);
	edge(w / 2, h / 2, -w / 2, h / 2, 0, -1);
	edge(-w / 2, h / 2, -w / 2, -h / 2, 1, 0);
	const N = pts.length;
	// the bites: where they are along the outline, how wide and how deep
	const bites = Array.from({ length: Math.round(wear * (2 + r.next() * 3)) }, () => {
		const corner = r.next() < 0.55;
		const at = corner ? Math.round((Math.floor(r.next() * 4) * N) / 4 + r.range(-2, 2)) : Math.round(r.range(0, N));
		return { at: (at + N) % N, half: r.range(3, 12), depth: r.range(4, 22) * mm * (corner ? 1.2 : 0.7) };
	});
	const inward = (i) => {
		let d = r.range(0, 0.6) * mm;
		for (const b of bites) {
			const dist = Math.min(Math.abs(i - b.at), N - Math.abs(i - b.at));
			if (dist < b.half) d = Math.max(d, b.depth * (1 - (dist / b.half) ** 2) * r.range(0.75, 1.1));
		}
		return d;
	};
	const depth = pts.map((_, i) => inward(i));
	const path = (extra) => 'M' + pts.map((p, i) => `${n(p.x + p.nx * (depth[i] + extra(i)))} ${n(p.y + p.ny * (depth[i] + extra(i)))}`).join('L') + 'Z';
	// the print stops short of a torn edge by the paper's white core
	return { paper: path(() => 0), print: path((i) => (depth[i] > 1.2 * mm ? 0.9 * mm : 0)) };
}
