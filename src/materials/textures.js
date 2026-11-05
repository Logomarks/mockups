/**
 * @module @logomarks/mockups/materials/textures
 *
 * Photographed textures shipped with the package (`assets/textures/`): four
 * kraft board surfaces, healed of their seams and pulled to one kraft
 * colour (see `tools/heal-textures.mjs`). Drawing is synchronous, so the
 * images are loaded ahead of it and kept here: the Node entry loads them on
 * import, the browser entry with `loadTextures()`, and the 3D box scene
 * loads its own. Until they're loaded, board falls back to procedural fibre.
 */

/** How many kraft variants there are. */
export const KRAFT_COUNT = 4;

/** How much board one texture tile covers, in mm. */
export const KRAFT_SPAN = 150;

/** The variants' mean luminance (0–1, after healing), for drawing their grain over other colours. */
export const KRAFT_MEAN = 0.63;

/** @type {string[]} */
let kraft = [];

/**
 * Where a kraft texture is, beside the package's source.
 *
 * @param {number} n The variant, 0–3.
 * @returns {URL} Its URL (a `file:` URL in Node).
 */
export function kraftUrl(n) {
	return new URL(`../../assets/textures/kraft-${n}.webp`, import.meta.url);
}

/**
 * Keeps the kraft textures, as `data:` URIs an SVG can embed.
 *
 * @param {string[]} list The variants.
 */
export function setKraftTextures(list) {
	kraft = list.slice(0, KRAFT_COUNT);
}

/**
 * The kraft textures loaded, if they are.
 *
 * @returns {readonly string[]} The variants' `data:` URIs (empty until loaded).
 */
export function kraftTextures() {
	return kraft;
}
