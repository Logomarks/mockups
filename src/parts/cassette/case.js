/**
 * @module @logomarks/mockups/parts/cassette/case
 *
 * A cassette's case (a Norelco box), standing front on: 70 × 109 mm of
 * clear plastic, the J-card's front under the lid and its spine folded
 * round the hinge on the left, the hinge's knuckles, the ribs along the
 * lid's edges and the catch on the right, with the plastic's glare and lit
 * edges. Drawn in millimetres inside a group scaled to pixels.
 */

import { el } from '../../render/svg.js';
import { glass } from '../../materials/glass.js';
import { roundRect } from '../../util/shape.js';
import { clamp, n } from '../../util/num.js';
import { jcard, JCARD } from './jcard.js';

/** A cassette case's size, in mm, standing with its hinge on the left. */
export const CASE = Object.freeze({ width: 70, height: 109 });

/**
 * A cassette case.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The case.
 * @param {number} o.x Its left edge (px).
 * @param {number} o.y Its top edge (px).
 * @param {number} o.mm Pixels per millimetre.
 * @param {import('../../render/scene.js').PlaceArt} o.art The cover, placed in a square.
 * @param {string} o.title The title on the J-card.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @returns {string} The markup.
 */
export function tapeCase(sc, { x, y, mm, art, title, light }) {
	const { width: W, height: H } = CASE;
	const lx = clamp(light, -1, 1);
	const ids = { clip: sc.id('tcase'), edge: sc.id('tcedge') };
	const jx = W - JCARD.width - 1.6;
	const jy = (H - JCARD.height) / 2;
	sc.def(el('clipPath', { id: ids.clip }, el('rect', { width: W, height: H, rx: 1.4 })));
	sc.def(
		el(
			'linearGradient',
			{ id: ids.edge, x1: 0.5 + 0.5 * lx, y1: 0, x2: 0.5 - 0.5 * lx, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.9 }),
			el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0.3 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.35 }),
		),
	);
	const line = (x1, y1, x2, y2, color, alpha, w = 0.25) => el('line', { x1, y1, x2, y2, stroke: color, 'stroke-opacity': alpha, 'stroke-width': w });
	// the J-card's spine wrapping round the hinge: the cover's colours, in shadow
	const spine = el('g', {}, el('rect', { width: jx, height: H, fill: '#1b1b1d' }), el('g', { filter: sc.blur(2) }, art(-40, jy, 80, 80, { opacity: 0.85 })), el('rect', { width: jx, height: H, fill: '#000', 'fill-opacity': 0.4 }));
	const card = el('g', { transform: `translate(${n(jx)} ${n(jy)})` }, jcard(sc, art, title));
	const knuckle = (ky) => el('rect', { x: 0.3, y: ky, width: jx - 0.6, height: 13, rx: 0.8, fill: '#fff', 'fill-opacity': 0.22, stroke: '#fff', 'stroke-opacity': 0.55, 'stroke-width': 0.25 });
	const lid =
		el('rect', { width: W, height: H, fill: '#fff', 'fill-opacity': 0.04 }) +
		line(jx + 0.4, 1.3, W - 1.3, 1.3, '#fff', 0.55) +
		line(W - 1.3, 1.3, W - 1.3, H - 1.3, lx > 0 ? '#fff' : '#000', lx > 0 ? 0.5 : 0.3) +
		line(jx + 0.4, H - 1.3, W - 1.3, H - 1.3, '#000', 0.3) +
		line(jx, 0, jx, H, '#fff', 0.5, 0.35) +
		line(jx + 0.45, 0, jx + 0.45, H, '#000', 0.3, 0.3) +
		knuckle(5) +
		knuckle(H - 18) +
		// the catch on the opening side
		el('rect', { x: W - 3, y: H / 2 - 9, width: 2.2, height: 18, rx: 0.6, fill: '#fff', 'fill-opacity': 0.14, stroke: '#fff', 'stroke-opacity': 0.4, 'stroke-width': 0.2 });
	return el(
		'g',
		{ transform: `translate(${n(x)} ${n(y)}) scale(${n(mm)})` },
		el('g', { 'clip-path': `url(#${ids.clip})` }, spine, card, lid, glass(sc, { outline: roundRect(0, 0, W, H, 1.4, 4), light, strength: 1.6, band: 0.34 })),
		el('rect', { x: 0.15, y: 0.15, width: W - 0.3, height: H - 0.3, rx: 1.3, fill: 'none', stroke: `url(#${ids.edge})`, 'stroke-width': 0.5 }),
		el('rect', { width: W, height: H, rx: 1.4, fill: 'none', stroke: '#000', 'stroke-opacity': 0.3, 'stroke-width': 0.15 }),
	);
}
