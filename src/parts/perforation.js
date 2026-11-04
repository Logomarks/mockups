/**
 * @module @arraypress/mockups/parts/perforation
 *
 * A ticket's perforation: the outlines of the ticket and its stub, each
 * with the same torn edge where they parted (small paper teeth where the
 * cuts were), and the line of holes on a ticket that's still whole.
 * Everything is centred on the whole ticket, so both pieces take the art
 * in the same box.
 */

import { el } from '../render/svg.js';
import { rng } from '../util/rng.js';
import { n } from '../util/num.js';

/**
 * The torn edge: points from the top to the bottom of the ticket at `x`.
 *
 * @param {number} x Where the perforation is, from the ticket's centre.
 * @param {number} h The ticket's height.
 * @param {number} mm Pixels per millimetre.
 * @param {string} seed The seed.
 * @returns {[number, number][]} The edge, top to bottom.
 */
export function tornEdge(x, h, mm, seed) {
	const r = rng(`${seed}:tear`);
	const step = 0.9 * mm;
	/** @type {[number, number][]} */
	const pts = [];
	for (let y = -h / 2, i = 0; y < h / 2; y += step, i++) pts.push([x + (i % 2 ? 0.35 : -0.2) * mm + r.range(-0.18, 0.18) * mm, y]);
	pts.push([x, h / 2]);
	return pts;
}

/**
 * The outlines of a ticket's two pieces, centred on the whole ticket.
 *
 * @param {number} w The ticket's width.
 * @param {number} h Its height.
 * @param {number} radius Its corners' radius.
 * @param {number} at Where the perforation is, as a fraction of the width from the left.
 * @param {number} mm Pixels per millimetre.
 * @param {string} seed The seed.
 * @returns {{ main: string, stub: string }} Path data for the ticket and its stub.
 */
export function tornPieces(w, h, radius, at, mm, seed) {
	const x0 = -w / 2;
	const x1 = w / 2;
	const y0 = -h / 2;
	const y1 = h / 2;
	const r = Math.min(radius, h / 2);
	const xp = x0 + at * w;
	const edge = tornEdge(xp, h, mm, seed);
	const line = (pts) => pts.map((p) => `L${n(p[0])} ${n(p[1])}`).join('');
	const main = `M${n(x0 + r)} ${n(y0)}L${n(edge[0][0])} ${n(y0)}${line(edge)}L${n(x0 + r)} ${n(y1)}a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(-r)}L${n(x0)} ${n(y0 + r)}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(-r)}Z`;
	const back = [...edge].reverse();
	const stub = `M${n(back[0][0])} ${n(y1)}${line(back)}L${n(x1 - r)} ${n(y0)}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(r)}L${n(x1)} ${n(y1 - r)}a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(r)}Z`;
	return { main, stub };
}

/**
 * The line of perforation holes on a whole ticket, centred on it: tiny dark slots with a lit lip.
 *
 * @param {number} w The ticket's width.
 * @param {number} h Its height.
 * @param {number} at Where the perforation is, as a fraction of the width.
 * @param {number} mm Pixels per millimetre.
 * @returns {string} The markup.
 */
export function perforationLine(w, h, at, mm) {
	const x = -w / 2 + at * w;
	const dash = 0.9 * mm;
	const gap = 0.7 * mm;
	const common = { x1: x, y1: -h / 2, x2: x, y2: h / 2, 'stroke-dasharray': `${n(dash)} ${n(gap)}`, fill: 'none' };
	return el('line', { ...common, stroke: '#000', 'stroke-width': Math.max(0.6, 0.22 * mm), opacity: 0.32 }) + el('line', { ...common, transform: `translate(${n(0.18 * mm)} 0)`, stroke: '#fff', 'stroke-width': Math.max(0.5, 0.14 * mm), opacity: 0.35 });
}
