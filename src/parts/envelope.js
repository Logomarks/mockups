/**
 * @module @arraypress/mockups/parts/envelope
 *
 * An envelope's front, as an overlay for a sheet: the layers of paper
 * folded behind it show through faintly (the back flap's point, the side
 * flaps' diagonals), the pocket swells a little in the middle, and a logo
 * can be printed in its top-left corner. A DL envelope is 220 × 110 mm.
 */

import { el } from '../render/svg.js';
import { n } from '../util/num.js';

/** A DL envelope's size, in mm. */
export const DL = Object.freeze({ width: 220, height: 110 });

/**
 * The envelope's front, centred on the origin, to draw over its paper.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The envelope.
 * @param {number} o.w Its width, in pixels.
 * @param {number} o.h Its height, in pixels.
 * @param {number} o.mm Pixels per millimetre.
 * @param {import('../render/scene.js').PlaceArt | null} [o.logo] A logo (square), printed top-left.
 * @param {number} [o.logoSize=16] The logo's side, in mm.
 * @returns {string} The markup.
 */
export function envelopeFace(sc, { w, h, mm, logo = null, logoSize = 16 }) {
	const x = -w / 2;
	const y = -h / 2;
	// show-through of the layers behind: the back flap (a deep point), the bottom flap, the side flaps
	const layer = (pts, a) => el('path', { d: `M${pts.map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}Z`, fill: '#000', opacity: a });
	const seam = (pts) => el('path', { d: `M${pts.map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}`, fill: 'none', stroke: '#000', 'stroke-width': Math.max(0.6, 0.25 * mm), opacity: 0.035 });
	const flap = [[x, y], [x + w, y], [0, y + h * 0.5]];
	const bottom = [[x, y + h], [x + w * 0.36, y + h * 0.36], [x + w * 0.64, y + h * 0.36], [x + w, y + h]];
	const swell = sc.id('swell');
	sc.def(
		el(
			'radialGradient',
			{ id: swell, cx: 0.48, cy: 0.45, r: 0.62 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.09 }),
			el('stop', { offset: 0.7, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.06 }),
		),
	);
	const s = logoSize * mm;
	const m = 10 * mm;
	return (
		layer(flap, 0.02) +
		layer(bottom, 0.014) +
		seam([flap[0], flap[2], flap[1]]) +
		seam(bottom) +
		el('rect', { x, y, width: w, height: h, fill: `url(#${swell})` }) +
		(logo ? logo(x + m, y + m, s, s) : '')
	);
}
