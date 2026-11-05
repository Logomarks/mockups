/**
 * @module @logomarks/mockups/util/brand
 *
 * The brand a composed print is set from: its name, its colour, the ink
 * that reads on that colour, and the paper it's printed on. The scenes
 * that lay out their own prints (a menu, a receipt, a binder's cover)
 * read these the same way.
 */

import { luma } from './color.js';

/**
 * The ink that reads on a colour: near-black on a light one, warm white on a dark one.
 *
 * @param {string} color The colour behind, hex.
 * @returns {string} The ink, hex.
 */
export const inkOn = (color) => (luma(color) > 0.58 ? '#161616' : '#f6f3ec');

/**
 * The brand, from a scene's options.
 *
 * @param {import('./reader.js').Reader} o The scene's options.
 * @param {{ color: string, paper?: string }} d The scene's own defaults: the brand colour, and the paper.
 * @returns {import('./brand.js').Brand} The brand.
 * @throws {TypeError} When a colour isn't hex or the name isn't a string.
 */
export function brandOf(o, d) {
	const color = o.color('color', d.color);
	return {
		mark: /** @type {import('../types.js').Art} */ (o.raw('art')),
		name: o.text('name', ''),
		color,
		ink: o.color('ink', inkOn(color)),
		paper: o.color('paper', d.paper ?? '#f4f1ea'),
	};
}
