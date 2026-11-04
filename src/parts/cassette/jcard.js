/**
 * @module @arraypress/mockups/parts/cassette/jcard
 *
 * A J-card's front panel (65 × 101.6 mm, portrait), made from a square
 * cover: the cover across the top, and below it a band of the cover's own
 * colours (its bottom edge, blurred and darkened) carrying the title, as
 * tape labels lay out square art.
 */

import { el, esc } from '../../render/svg.js';
import { n } from '../../util/num.js';

/** A J-card's front panel and spine, in mm. */
export const JCARD = Object.freeze({ width: 65, height: 101.6, spine: 12.7 });

/** The type the band is set in. */
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * A J-card's front, in mm about its top left.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {import('../../render/scene.js').PlaceArt} art The cover, placed in a square.
 * @param {string} title The title in the band (none when empty).
 * @returns {string} The markup, 65 × 101.6.
 */
export function jcard(sc, art, title) {
	const { width: W, height: H } = JCARD;
	const clip = sc.id('jcard');
	sc.def(el('clipPath', { id: clip }, el('rect', { width: W, height: H })));
	const words = title.toUpperCase();
	return el(
		'g',
		{ 'clip-path': `url(#${clip})` },
		// the band: the cover, larger and blurred, its lower part showing, darkened so type reads on it
		el('g', { filter: sc.blur(6) }, art(-W * 0.3, H - W * 1.6, W * 1.6, W * 1.6)),
		el('rect', { y: W, width: W, height: H - W, fill: '#000', 'fill-opacity': 0.5 }),
		art(0, 0, W, W),
		el('line', { x1: 5, y1: W + 0.01, x2: W - 5, y2: W + 0.01, stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': 0.2 }),
		words && el('text', { x: 5, y: W + 13, 'font-family': FONT, 'font-size': fitType(words, W - 10, 5.2), 'font-weight': 700, 'letter-spacing': 0.3, fill: '#fff' }, esc(words)),
		el('text', { x: 5, y: H - 6, 'font-family': FONT, 'font-size': 2.3, 'font-weight': 500, 'letter-spacing': 0.5, fill: '#fff', 'fill-opacity': 0.75 }, 'STEREO · DOLBY B NR'),
		el('rect', { x: W - 16, y: H - 9.2, width: 11, height: 4.4, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.6, 'stroke-width': 0.25 }),
		el('text', { x: W - 10.5, y: H - 6, 'font-family': FONT, 'font-size': 2.3, 'font-weight': 700, fill: '#fff', 'fill-opacity': 0.75, 'text-anchor': 'middle' }, 'TAPE'),
	);
}

/**
 * A type size that fits words in a width (Helvetica's capitals average about 0.68 em).
 *
 * @param {string} words The words.
 * @param {number} width The width.
 * @param {number} max The largest size.
 * @returns {number} The size.
 */
export function fitType(words, width, max) {
	return Number(n(Math.min(max, width / Math.max(1, words.length * 0.68))));
}
