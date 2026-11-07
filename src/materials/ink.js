/**
 * @module @logomarks/mockups/materials/ink
 *
 * A one-ink print: art (a photo, a mark, words) printed in a single ink on
 * coloured stock, as a screen-printed sleeve or a risograph insert is. The
 * art's darks take the ink and its lights leave the stock bare, so a photo
 * comes out as a monotone in the ink's colour. The same tone curve in 2D
 * (an SVG filter) and 3D (a canvas's pixels), so the two match.
 */

import { el } from '../render/svg.js';
import { isHex, rgb } from '../util/color.js';
import { n } from '../util/num.js';

/** How the ink's cover follows the art's lightness: `cover = OFFSET - SLOPE × luminance`, clamped to 0–1. */
const OFFSET = 1.15;
const SLOPE = 1.35;

/** The luminance weights (sRGB). */
const LUMA = [0.2126, 0.7152, 0.0722];

/**
 * A print finish from its option.
 *
 * @param {unknown} v `'full'` (or nothing: the art as it is, in full colour) or `{ ink, paper }`.
 * @param {string} object The object's name, for errors.
 * @returns {import('./ink.js').InkPrint | null} The ink and stock, or `null` for full colour.
 * @throws {TypeError} For anything else.
 */
export function resolvePrint(v, object) {
	if (v === undefined || v === null || v === 'full') return null;
	const o = /** @type {Record<string, unknown>} */ (v);
	if (typeof v !== 'object' || !isHex(o.ink) || (o.paper !== undefined && !isHex(o.paper))) throw new TypeError(`${object}: print is 'full' or { ink, paper } in hex colours (got ${JSON.stringify(v)})`);
	return { ink: /** @type {string} */ (o.ink), paper: /** @type {string} */ (o.paper ?? '#f3f0e8') };
}

/**
 * A one-ink print as an SVG filter: the art's darks in the ink, its lights clear (lay it over the stock's colour).
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./ink.js').InkPrint} p The ink and stock.
 * @returns {string} A `url(#…)` for a `filter`.
 */
export function inkFilter(sc, p) {
	const id = sc.id('ink');
	sc.def(el('filter', { id, 'color-interpolation-filters': 'sRGB' }, el('feColorMatrix', { type: 'matrix', values: inkMatrix(p.ink) }), el('feComposite', { in2: 'SourceAlpha', operator: 'in' })));
	return `url(#${id})`;
}

/**
 * The one-ink tone curve as an `feColorMatrix`'s values: every pixel the ink, as opaque as the art is dark.
 *
 * @param {string} ink The ink, a hex colour.
 * @returns {string} The matrix's values.
 */
export function inkMatrix(ink) {
	const [r, g, b] = rgb(ink).map((v) => v / 255);
	const a = LUMA.map((k) => n(-SLOPE * k)).join(' ');
	return `0 0 0 0 ${n(r)}  0 0 0 0 ${n(g)}  0 0 0 0 ${n(b)}  ${a} 0 ${OFFSET}`;
}

/**
 * A one-ink print on a canvas's pixels, in place: each pixel the stock, with the ink over it as deep as the art is dark, and a faint unevenness, as ink lies on paper.
 *
 * @param {HTMLCanvasElement} canvas The art, drawn.
 * @param {import('./ink.js').InkPrint} p The ink and stock.
 * @returns {HTMLCanvasElement} The same canvas.
 */
export function inkCanvas(canvas, p) {
	const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	const img = g.getImageData(0, 0, canvas.width, canvas.height);
	const d = img.data;
	const ink = rgb(p.ink);
	const paper = rgb(p.paper);
	let seed = 7;
	for (let i = 0; i < d.length; i += 4) {
		const l = (LUMA[0] * d[i] + LUMA[1] * d[i + 1] + LUMA[2] * d[i + 2]) / 255;
		const cover = Math.min(1, Math.max(0, OFFSET - SLOPE * l)) * (d[i + 3] / 255);
		seed = (seed * 16807) % 2147483647;
		const grain = (seed / 2147483647 - 0.5) * 10;
		for (let k = 0; k < 3; k++) d[i + k] = paper[k] + (ink[k] - paper[k]) * cover + grain;
		d[i + 3] = 255;
	}
	g.putImageData(img, 0, 0);
	return canvas;
}
