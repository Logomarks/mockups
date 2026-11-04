/**
 * @module @arraypress/mockups/parts/pocket
 *
 * A clear PVC badge pocket, lying flat, centred on the origin and drawn in
 * millimetres: a faint haze of plastic (heavier over the empty lip at the
 * top), the welded seam round it, a slot for the clip, glossy reflections
 * sweeping across it, and bright and dark lines where its edges catch the
 * light.
 */

import { el } from '../render/svg.js';
import { outline } from './sheet.js';
import { n } from '../util/num.js';

/**
 * The pocket's outline, with the slot cut through it, as path data (even-odd).
 *
 * @param {number} w Its width, mm.
 * @param {number} h Its height, mm.
 * @returns {{ d: string, slot: { x: number, y: number, w: number, h: number } }} The outline, and the slot's centre and size.
 */
export function pocketShape(w, h) {
	const slot = { x: 0, y: -h / 2 + 6.5, w: 15, h: 3.2 };
	const hole = outline(slot.w, slot.h, slot.h / 2).replace(/M(-?[\d.]+) (-?[\d.]+)/, (_, x, y) => `M${n(Number(x) + slot.x)} ${n(Number(y) + slot.y)}`);
	return { d: outline(w, h, 5) + hole, slot };
}

/**
 * The pocket over what it holds.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The pocket.
 * @param {number} o.w Its width, mm.
 * @param {number} o.h Its height, mm.
 * @param {number} o.lip How deep the empty lip at the top is, mm.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @returns {string} The markup, centred on the origin.
 */
export function pocket(sc, { w, h, lip, light }) {
	const { d } = pocketShape(w, h);
	const clip = sc.id('pocket');
	sc.def(el('clipPath', { id: clip }, el('path', { d, 'clip-rule': 'evenodd' })));
	const sweep = sc.id('gloss');
	const tilt = 0.25 * light;
	sc.def(
		el(
			'linearGradient',
			{ id: sweep, x1: 0.1 + tilt, y1: 0, x2: 0.9 + tilt, y2: 1 },
			el('stop', { offset: 0.18, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 0.27, 'stop-color': '#fff', 'stop-opacity': 0.26 }),
			el('stop', { offset: 0.31, 'stop-color': '#fff', 'stop-opacity': 0.08 }),
			el('stop', { offset: 0.36, 'stop-color': '#fff', 'stop-opacity': 0.16 }),
			el('stop', { offset: 0.46, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 0.7, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 0.78, 'stop-color': '#fff', 'stop-opacity': 0.12 }),
			el('stop', { offset: 0.86, 'stop-color': '#fff', 'stop-opacity': 0 }),
		),
	);
	const seam = outline(w - 5, h - 5, 3.2);
	return el(
		'g',
		{},
		el(
			'g',
			{ 'clip-path': `url(#${clip})` },
			// the plastic's haze, thicker where it's two empty layers
			el('path', { d, fill: '#e6eef0', opacity: 0.1, 'fill-rule': 'evenodd' }),
			el('rect', { x: -w / 2, y: -h / 2, width: w, height: lip, fill: '#eef3f4', opacity: 0.16 }),
			// the seam where the layers are welded: a band of thicker plastic round the edge
			el('path', { d: seam, fill: 'none', stroke: '#fff', 'stroke-width': 5, opacity: 0.1 }),
			el('path', { d: seam, fill: 'none', stroke: '#000', 'stroke-width': 0.3, opacity: 0.16 }),
			el('path', { d: seam, fill: 'none', stroke: '#fff', 'stroke-width': 0.35, opacity: 0.45, transform: 'translate(0 0.35)' }),
			el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: `url(#${sweep})` }),
		),
		// the cut edges catch the light, and the slot's lip
		el('path', { d, fill: 'none', 'fill-rule': 'evenodd', stroke: '#fff', 'stroke-width': 0.5, opacity: 0.55 }),
		el('path', { d, fill: 'none', 'fill-rule': 'evenodd', stroke: '#000', 'stroke-width': 0.3, opacity: 0.22, transform: 'translate(0.25 0.4)' }),
	);
}
