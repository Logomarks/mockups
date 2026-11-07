/**
 * @module @logomarks/mockups/plates/print
 *
 * A halftone print: the art in one ink, solid in the middle and breaking
 * up into a dot screen towards its edges until it's gone, as a screen
 * printer fades a print out on a heavyweight tee. The dots are
 * `@logomarks/image-effects`' `halftoneFade` (an optional peer dependency,
 * loaded when this is called), erasing the ink as they grow; the ink is
 * the one-ink tone curve the sleeves use. The result is art (an SVG) for
 * `plate()`, best on a `fabric` screen, where it takes the cloth's light,
 * weave and folds.
 */

import { svgMarkup, placeSvg } from './inline.js';
import { inkMatrix } from '../materials/ink.js';
import { isHex } from '../util/color.js';
import { artHref } from '../render/art.js';

/** The fade's directions, as `halftoneFade` names them: `'radial'` fades out towards every edge. */
const DIRECTIONS = Object.freeze(['radial', 'up', 'down', 'left', 'right']);

/**
 * `@logomarks/image-effects`, imported when first needed.
 *
 * @returns {Promise<typeof import('@logomarks/image-effects')>} The module.
 * @throws {Error} When it isn't installed.
 */
async function effects() {
	try {
		return await import('@logomarks/image-effects');
	} catch {
		throw new Error('halftonePrint: needs @logomarks/image-effects (npm install @logomarks/image-effects)');
	}
}

/**
 * The art as markup drawn in one ink over a canvas, fitted whole.
 *
 * @param {import('../types.js').Art} art The art: SVG markup or a data URL, or a raster's bytes or href.
 * @param {{ width: number, height: number, ink: string }} o The canvas and the ink.
 * @returns {{ markup: string, defs: string }} The markup and its filter.
 */
function inked(art, { width, height, ink }) {
	const svg = svgMarkup(art);
	let body;
	if (svg) body = placeSvg(svg, { width, height }, 'contain');
	else {
		body = `<image href="${artHref(art)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`;
	}
	const defs = `<filter id="hp-ink" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${inkMatrix(ink)}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
	return { markup: `<g filter="url(#hp-ink)">${body}</g>`, defs };
}

/**
 * A halftone print of some art: one ink, fading out through a dot screen towards its edges.
 *
 * @param {import('../types.js').Art} art The art (a mark's SVG, or a raster).
 * @param {import('./print.js').HalftonePrintOptions} [options] The ink, the canvas, the screen and the fade.
 * @returns {Promise<string>} An SVG document (the print, rasterised), to pass to `plate()` as `art`.
 * @throws {TypeError} For a bad option; {Error} without `@logomarks/image-effects`.
 */
export async function halftonePrint(art, options = {}) {
	const { ink = '#161616', width = 1200, height = 1200, cell = '1.4vmin', start = 0.3, end = 0.92, shape = 'dot', grid = 'diamond', direction = 'radial', jitter = 0.15, seed = 'halftone', sharp } = options;
	if (!isHex(ink)) throw new TypeError(`halftonePrint: ink is a hex colour (got ${JSON.stringify(ink)})`);
	if (!(width > 0 && height > 0)) throw new TypeError('halftonePrint: width and height are positive numbers');
	if (!DIRECTIONS.includes(direction)) throw new TypeError(`halftonePrint: direction is one of ${DIRECTIONS.join(', ')} (got ${JSON.stringify(direction)})`);
	if (!(start >= 0 && end > start && end <= 1.5)) throw new TypeError('halftonePrint: 0 ≤ start < end');
	const { renderEffects } = await effects();
	const { markup, defs } = inked(art, { width, height, ink });
	return renderEffects({ width, height, markup, defs }, [{ kind: 'halftoneFade', color: 'none', direction, start, end, cell, shape, grid, jitter, seed }], { seed, sharp, id: 'hp' });
}
