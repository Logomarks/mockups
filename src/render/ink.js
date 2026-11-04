/**
 * @module @arraypress/mockups/render/ink
 *
 * A mark drawn in `currentColor` (as icon and logo sets ship them) given a
 * colour, so it can be printed on a sign or an app icon in the brand's
 * ink. Raster art, and SVG with colours of its own, pass through as they
 * are.
 */

import { base64 } from './art.js';

/**
 * Art with its `currentColor` set.
 *
 * @param {import('../types.js').Art} art The art: SVG markup or an SVG `data:` URI is inked; anything else is returned as it is.
 * @param {string} color The colour for `currentColor`.
 * @returns {import('../types.js').Art} The art, inked.
 */
export function ink(art, color) {
	if (typeof art !== 'string') return art;
	const s = art.trim();
	let svg = s.startsWith('<') ? s : null;
	if (!svg && s.startsWith('data:image/svg+xml')) {
		const comma = s.indexOf(',');
		const body = s.slice(comma + 1);
		svg = /;base64$/.test(s.slice(0, comma)) ? new TextDecoder().decode(Uint8Array.from(atob(body), (c) => c.charCodeAt(0))) : decodeURIComponent(body);
	}
	if (!svg || !/currentColor/i.test(svg)) return art;
	return `data:image/svg+xml;base64,${base64(new TextEncoder().encode(svg.replace(/currentColor/gi, color)))}`;
}
