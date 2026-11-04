/**
 * @module @arraypress/mockups/parts/cd/digipak
 *
 * A digipak, front on: a board sleeve 139.7 × 124.5 mm printed edge to edge
 * (the square cover filled across it), its board edge showing below, the
 * fold to the spine down the left catching the light.
 */

import { el } from '../../render/svg.js';
import { sheet } from '../sheet.js';
import { resolveStock } from '../../materials/paper.js';

/** A digipak's size, in mm. */
export const DIGIPAK = Object.freeze({ width: 139.7, height: 124.5 });

/**
 * A digipak and its shadow.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The digipak.
 * @param {number} o.cx Its centre, x (px).
 * @param {number} o.cy Its centre, y (px).
 * @param {number} o.mm Pixels per millimetre.
 * @param {import('../../render/scene.js').PlaceArt} o.art The front, placed in its box.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} o.shadow How dark its shadow is.
 * @returns {string} The markup.
 */
export function digipak(sc, { cx, cy, mm, art, light, shadow }) {
	const { width: W, height: H } = DIGIPAK;
	const w = W * mm;
	const h = H * mm;
	// the fold: a rounded board edge, lit along its crest
	const fold = el('rect', { x: -w / 2, y: -h / 2, width: 1.6 * mm, height: h, fill: '#fff', 'fill-opacity': 0.16 }) + el('line', { x1: -w / 2 + 0.5 * mm, y1: -h / 2, x2: -w / 2 + 0.5 * mm, y2: h / 2, stroke: '#fff', 'stroke-opacity': 0.45, 'stroke-width': 0.3 * mm });
	return sheet(sc, { cx, cy, w, h, radius: 0.8 * mm, art, overlay: fold, stock: resolveStock('matte', 'cd'), mm, light, thickness: 0.9 * mm, lift: 0.35, shadow, seed: 7 });
}
