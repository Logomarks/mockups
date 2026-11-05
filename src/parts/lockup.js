/**
 * @module @logomarks/mockups/parts/lockup
 *
 * A brand's lockup: its mark and its name set beside it (a row) or under
 * it (a stack), in one ink, sized by the mark's height. A mark drawn in
 * `currentColor` takes the ink; one with colours of its own keeps them.
 * Every scene that prints or shows the brand (a stage's screen, a menu's
 * head, a binder's spine) sets it with this.
 */

import { el, esc } from '../render/svg.js';
import { fitArt } from '../render/fit.js';
import { ink as inked } from '../render/ink.js';
import { FONT } from './screen/ui.js';

/** How wide a letter of the name runs, as a share of its size (the system sans, medium). */
const ADVANCE = 0.58;

/**
 * How wide a line of type runs, roughly.
 *
 * @param {string} words The words.
 * @param {number} size Their size.
 * @param {number} [spacing=0] Letter-spacing.
 * @returns {number} The width.
 */
export function typeWidth(words, size, spacing = 0) {
	return [...words].reduce((w, c) => w + size * (/[iIl.,:;'!|]/.test(c) ? 0.28 : /[mwMW]/.test(c) ? 0.86 : /\s/.test(c) ? 0.3 : ADVANCE) + spacing, 0);
}

/**
 * A lockup's size, before it's placed.
 *
 * @param {import('./lockup.js').LockupSpec} o The lockup.
 * @returns {{ width: number, height: number }} Its width and height.
 */
export function lockupSize({ name = '', size, layout = 'row' }) {
	const type = size * (layout === 'row' ? 0.62 : 0.34);
	const words = name ? typeWidth(name, type, type * -0.02) : 0;
	if (layout === 'stack') return { width: Math.max(size, words), height: name ? size + type * 1.5 : size };
	return { width: size + (name ? size * 0.32 + words : 0), height: size };
}

/**
 * A lockup set in a box: as large as fits, aligned in it.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./lockup.js').LockupSpec & { x: number, y: number, width: number, height: number, align?: 'start' | 'middle' }} o The lockup and the box (`size` is the most the mark may be).
 * @returns {string} The markup.
 */
export function lockupIn(sc, o) {
	const one = lockupSize({ ...o, size: 1 });
	const size = Math.min(o.size, o.width / one.width, o.height / one.height);
	const { width, height } = lockupSize({ ...o, size });
	const x = o.align === 'start' ? o.x : o.x + (o.width - width) / 2;
	return lockup(sc, { ...o, size, x, y: o.y + (o.height - height) / 2 });
}

/**
 * A lockup at a point.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./lockup.js').LockupSpec & { x: number, y: number }} o The lockup, and its top-left.
 * @returns {string} The markup.
 */
export function lockup(sc, { mark, name = '', ink, size, layout = 'row', x, y, weight = 500 }) {
	const art = fitArt(sc, inked(mark, ink), { x: layout === 'stack' ? x + (lockupSize({ name, size, layout }).width - size) / 2 : x, y, width: size, height: size }, 'contain');
	if (!name) return art;
	const type = size * (layout === 'row' ? 0.62 : 0.34);
	const words = { fill: ink, 'font-family': FONT, 'font-size': type, 'font-weight': weight, 'letter-spacing': type * -0.02 };
	const text =
		layout === 'row'
			? el('text', { ...words, x: x + size * 1.32, y: y + size / 2 + type * 0.36 }, esc(name))
			: el('text', { ...words, x: x + lockupSize({ name, size, layout }).width / 2, y: y + size + type * 1.25, 'text-anchor': 'middle' }, esc(name));
	return art + text;
}
