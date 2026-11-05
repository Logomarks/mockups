/**
 * @module @logomarks/mockups/parts/keyboard
 *
 * A laptop's deck, drawn on its top face through the face's map: a
 * keyboard of plain keys (a half-height function row, the usual staggered
 * rows, a long space bar and arrow keys; no legends) and a trackpad below
 * it. Every key is a rounded rectangle projected point by point, so the
 * deck foreshortens with the view.
 */

import { el } from '../render/svg.js';
import { roundRect, polyPath } from '../util/shape.js';

/** Each row's key widths, in key pitches (14.5 across), and its height (in pitches of the main rows). */
export const ROWS = Object.freeze([
	{ keys: Array(14).fill(14.5 / 14), h: 0.56 },
	{ keys: [...Array(13).fill(1), 1.5], h: 1 },
	{ keys: [1.5, ...Array(12).fill(1), 1], h: 1 },
	{ keys: [1.75, ...Array(11).fill(1), 1.75], h: 1 },
	{ keys: [2.25, ...Array(10).fill(1), 2.25], h: 1 },
	{ keys: [1, 1, 1.25, 1.25, 5.5, 1.25, 1.25, 1, 1, 1], h: 1 },
]);

/**
 * A deck: keys and a trackpad.
 *
 * @param {(x: number, y: number) => [number, number]} map The top face's units (mm from its back-left corner) to pixels.
 * @param {object} o The deck.
 * @param {number} o.width The face's width.
 * @param {number} o.depth Its depth (front to back).
 * @param {string} o.key The keys' colour.
 * @param {string} o.pad The trackpad's colour.
 * @param {string} o.edge A hairline colour for the keys' and pad's edges.
 * @returns {string} The markup.
 */
export function deck(map, { width, depth, key, pad, edge }) {
	const across = width * 0.86;
	const pitch = across / 14.5;
	const gap = pitch * 0.11;
	const x0 = (width - across) / 2;
	let y = depth * 0.1;
	const shape = (x, yy, w, h, r) => polyPath(roundRect(x, yy, w, h, r, 3).map((p) => map(p[0], p[1])));
	let keys = '';
	for (const row of ROWS) {
		let x = x0;
		const h = row.h * pitch - gap;
		for (const k of row.keys) {
			const w = k * pitch - gap;
			keys += `<path d="${shape(x, y, w, h, pitch * 0.12)}"/>`;
			x += k * pitch;
		}
		y += row.h * pitch;
	}
	const pw = width * 0.4;
	const ph = Math.min(depth - y - depth * 0.08, pw * 0.62);
	const py = y + (depth - y - ph) / 2 + depth * 0.01;
	return (
		el('g', { fill: key, stroke: edge, 'stroke-width': 0.6, 'stroke-opacity': 0.5 }, keys) +
		el('path', { d: shape((width - pw) / 2, py, pw, ph, pitch * 0.35), fill: pad, stroke: edge, 'stroke-width': 0.8, 'stroke-opacity': 0.6 })
	);
}
