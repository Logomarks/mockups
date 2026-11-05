/**
 * @module @logomarks/mockups/parts/poster/creases
 *
 * What paste does to paper: creases where it was smoothed down unevenly
 * (a dark fold with a lit ridge beside it), short wrinkles near the edges,
 * a few bubbles of air, and the edges a shade darker where the glue soaked
 * in. Drawn about the sheet's centre, to lay over its print.
 */

import { el } from '../../render/svg.js';
import { rng } from '../../util/rng.js';
import { clamp, n } from '../../util/num.js';

/**
 * Creases, wrinkles and bubbles over a sheet.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The sheet.
 * @param {number} o.w Its width (px).
 * @param {number} o.h Its height (px).
 * @param {number} o.mm Pixels per millimetre.
 * @param {string} o.edge Its outline (path data about its centre).
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {string} o.seed The seed.
 * @returns {string} The markup.
 */
export function creases(sc, { w, h, mm, edge, light, seed }) {
	const r = rng(`${seed}:creases`);
	const lx = clamp(light, -1, 1);
	let out = '';
	const fold = (x0, y0, x1, y1, strength) => {
		// the lit side of a ridge faces the light; the other falls into shadow
		const nx = -(y1 - y0);
		const ny = x1 - x0;
		const l = Math.hypot(nx, ny) || 1;
		const side = (nx * lx - ny) / l > 0 ? 1 : -1;
		const ox = ((nx / l) * 0.7 * mm) * side;
		const oy = ((ny / l) * 0.7 * mm) * side;
		const mx = (x0 + x1) / 2 + r.range(-0.03, 0.03) * w;
		const my = (y0 + y1) / 2 + r.range(-0.03, 0.03) * h;
		const d = (dx, dy) => `M${n(x0 + dx)} ${n(y0 + dy)}Q${n(mx + dx)} ${n(my + dy)} ${n(x1 + dx)} ${n(y1 + dy)}`;
		return (
			el('path', { d: d(0, 0), fill: 'none', stroke: '#000', 'stroke-opacity': 0.3 * strength, 'stroke-width': 0.9 * mm, filter: sc.blur(0.5 * mm), 'stroke-linecap': 'round' }) +
			el('path', { d: d(ox, oy), fill: 'none', stroke: '#fff', 'stroke-opacity': 0.4 * strength, 'stroke-width': 0.7 * mm, filter: sc.blur(0.45 * mm), 'stroke-linecap': 'round' })
		);
	};
	// long creases across, from one edge partway in
	for (let i = 0, k = 3 + Math.floor(r.next() * 3); i < k; i++) {
		const x0 = r.range(-0.5, 0.5) * w;
		const y0 = (r.next() < 0.5 ? -0.5 : 0.5) * h;
		out += fold(x0, y0, x0 + r.range(-0.4, 0.4) * w, y0 * r.range(-0.2, 0.6), r.range(0.6, 1));
	}
	// short wrinkles by the edges
	for (let i = 0, k = 8 + Math.floor(r.next() * 8); i < k; i++) {
		const vertical = r.next() < 0.5;
		const s = r.next() < 0.5 ? -1 : 1;
		const x0 = vertical ? s * (0.5 * w - r.range(2, 20) * mm) : r.range(-0.45, 0.45) * w;
		const y0 = vertical ? r.range(-0.45, 0.45) * h : s * (0.5 * h - r.range(2, 20) * mm);
		const len = r.range(12, 45) * mm;
		const a = (vertical ? 0 : Math.PI / 2) + r.range(-0.5, 0.5);
		out += fold(x0, y0, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len, r.range(0.4, 0.8));
	}
	// bubbles: a soft bump, lit on its upper side
	const bub = sc.id('bubble');
	sc.def(el('radialGradient', { id: bub, cx: 0.5 + 0.2 * lx, cy: 0.35, r: 0.6 }, el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.22 }), el('stop', { offset: 0.6, 'stop-color': '#fff', 'stop-opacity': 0 }), el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.12 })));
	for (let i = 0, k = 2 + Math.floor(r.next() * 3); i < k; i++) {
		out += el('ellipse', { cx: r.range(-0.4, 0.4) * w, cy: r.range(-0.4, 0.4) * h, rx: r.range(8, 22) * mm, ry: r.range(6, 16) * mm, fill: `url(#${bub})`, transform: `rotate(${n(r.range(-30, 30))})` });
	}
	// glue soaked into the edges
	out += el('path', { d: edge, fill: 'none', stroke: '#2a2015', 'stroke-opacity': 0.18, 'stroke-width': 5 * mm, filter: sc.blur(2.5 * mm) });
	return el('g', {}, out);
}
