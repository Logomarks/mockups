/**
 * @module @arraypress/mockups/render/fit
 *
 * Art placed in a box the way a screen or a sign shows it: `cover` fills
 * the box and crops the overflow evenly, `top` fills its width and crops
 * from the bottom (a web page, read from the top), `contain` shows all of
 * it, centred. The art's proportions come from its bytes, so each artwork
 * is embedded once, at its own aspect.
 */

import { artHref } from './art.js';
import { artSize } from './dims.js';

/** How art fills a box. */
export const FITS = Object.freeze(['cover', 'contain', 'top']);

/**
 * Art in a box.
 *
 * @param {import('./scene.js').Scene} sc The document.
 * @param {import('../types.js').Art} art The art.
 * @param {{ x: number, y: number, width: number, height: number }} box The box.
 * @param {'cover' | 'contain' | 'top'} [fit='cover'] How it fills the box.
 * @returns {string} The markup (it may spill past the box for `top`; clip it there).
 * @throws {TypeError} For a fit it doesn't know.
 */
export function fitArt(sc, art, { x, y, width: w, height: h }, fit = 'cover') {
	if (!FITS.includes(fit)) throw new TypeError(`fit is 'cover', 'contain' or 'top' (got ${JSON.stringify(fit)})`);
	const size = artSize(artHref(art));
	const a = size ? size.width / size.height : w / h;
	if (fit === 'cover' || !size) return sc.image(art, w / h)(x, y, w, h);
	const place = sc.image(art, a);
	if (fit === 'top') return a >= w / h ? sc.image(art, w / h)(x, y, w, h) : place(x, y, w, w / a);
	const [cw, ch] = a >= w / h ? [w, w / a] : [h * a, h];
	return place(x + (w - cw) / 2, y + (h - ch) / 2, cw, ch);
}
