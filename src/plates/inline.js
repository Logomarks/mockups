/**
 * @module @logomarks/mockups/plates/inline
 *
 * SVG art drawn as markup rather than as an `<image>`. The warp draws the
 * art once per piece, and librsvg rasterises an SVG `<image>` afresh for
 * each, so the pieces misregister by pixels at their seams; inline, every
 * piece draws the same vectors and the seams vanish.
 */

/** How each fit aligns and scales the nested SVG. */
const ALIGN = Object.freeze({ cover: 'xMidYMid slice', contain: 'xMidYMid meet', top: 'xMidYMin slice' });

/** A root `<svg …>` tag's sizing attributes, which the inlined copy replaces. */
const SIZING = /\s(?:width|height|x|y|preserveAspectRatio)\s*=\s*("[^"]*"|'[^']*')/g;

/**
 * Art's SVG markup, when it is SVG.
 *
 * @param {import('../types.js').Art} art The art.
 * @returns {string | null} The markup, or `null` for raster art or a URL.
 */
export function svgMarkup(art) {
	if (typeof art !== 'string') return null;
	const s = art.trim();
	if (s.startsWith('<')) return s.includes('<svg') ? s : null;
	const m = /^data:image\/svg\+xml(;base64)?,(.*)$/s.exec(s);
	if (!m) return null;
	if (!m[1]) return decodeURIComponent(m[2]);
	return new TextDecoder().decode(Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0)));
}

/**
 * SVG markup placed in a box, filling it as `cover` (cropped evenly), `contain` (whole, centred) or `top` (cropped from the bottom).
 *
 * @param {string} markup The SVG.
 * @param {{ width: number, height: number }} box The box, from the origin.
 * @param {'cover' | 'contain' | 'top'} fit How it fills the box.
 * @returns {string} A nested `<svg>` sized to the box.
 */
export function placeSvg(markup, { width, height }, fit) {
	const body = markup.replace(/^[\s\S]*?(?=<svg[\s>])/, '');
	return body.replace(/<svg\b([^>]*)>/, (_, attrs) => `<svg${attrs.replace(SIZING, '')} x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="${ALIGN[fit]}" overflow="hidden">`);
}
