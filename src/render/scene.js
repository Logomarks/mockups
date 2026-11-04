/**
 * @module @arraypress/mockups/render/scene
 *
 * The document every 2D mockup is drawn into: a fixed-size SVG with one set
 * of `<defs>`, ids scoped by a prefix (so several mockups can sit inline on
 * one page), the artwork defined once as a 1000 × 1000 image that every part
 * reuses with `<use>`, and cached blur filters. Objects add layers back to
 * front; `svg()` writes the whole document.
 */

import { el } from './svg.js';
import { artHref } from './art.js';
import { hash } from '../util/rng.js';
import { n } from '../util/num.js';

/** The artwork's box in user units: a part scales it from 1000 to its own size. */
export const ART = 1000;

/**
 * A new document.
 *
 * @param {{ width: number, height: number, art?: import('../types.js').Art, key?: string }} o Its size in pixels, the artwork (left out when every artwork is placed with `image`), and a key for its ids (they're the key's hash, so the same mockup always gets the same ids).
 * @returns {import('./scene.js').Scene} The builder.
 */
export function scene({ width, height, art, key = '' }) {
	const href = art === undefined ? '' : artHref(art);
	const prefix = 'm' + hash(key + href.slice(0, 256) + href.length).toString(36);
	/** @type {string[]} */
	const defs = [];
	/** @type {string[]} */
	const layers = [];
	/** @type {Map<string, string>} */
	const blurs = new Map();
	let next = 0;
	const id = (name) => `${prefix}-${name}${next++}`;
	const artId = `${prefix}-art`;
	if (href) defs.push(el('image', { id: artId, width: ART, height: ART, href, preserveAspectRatio: 'xMidYMid slice' }));
	/** @type {Map<string, Map<number, string>>} */
	const images = new Map();

	return {
		width,
		height,
		id,
		art: artId,
		def(markup) {
			defs.push(markup);
		},
		add(...markup) {
			layers.push(...markup.filter(Boolean));
		},
		blur(sigma) {
			const key = n(sigma);
			let f = blurs.get(key);
			if (!f) {
				f = id('blur');
				blurs.set(key, f);
				defs.push(el('filter', { id: f, x: '-50%', y: '-50%', width: '200%', height: '200%', 'color-interpolation-filters': 'sRGB' }, el('feGaussianBlur', { stdDeviation: sigma })));
			}
			return `url(#${f})`;
		},
		useArt(x, y, w, h, attrs = {}) {
			if (!href) throw new TypeError('useArt: this document has no artwork of its own (place it with image())');
			return el('use', { href: `#${artId}`, transform: `translate(${n(x)} ${n(y)}) scale(${n(w / ART)} ${n(h / ART)})`, ...attrs });
		},
		image(art, aspect = 1) {
			const src = artHref(art);
			const byAspect = images.get(src) ?? new Map();
			images.set(src, byAspect);
			let box = byAspect.get(aspect);
			if (!box) {
				box = id('img');
				byAspect.set(aspect, box);
				defs.push(el('image', { id: box, width: ART * aspect, height: ART, href: src, preserveAspectRatio: 'xMidYMid slice' }));
			}
			return (x, y, w, h, attrs = {}) => el('use', { href: `#${box}`, transform: `translate(${n(x)} ${n(y)}) scale(${n(w / (ART * aspect))} ${n(h / ART)})`, ...attrs });
		},
		svg() {
			return (
				`<svg xmlns="http://www.w3.org/2000/svg" width="${n(width)}" height="${n(height)}" viewBox="0 0 ${n(width)} ${n(height)}">` +
				`<defs>${defs.join('')}</defs>${layers.join('')}</svg>`
			);
		},
	};
}
