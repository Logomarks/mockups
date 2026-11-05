/**
 * @module @logomarks/mockups/plates/browser
 *
 * Plates in a browser: fetched from a URL (relative to the page), or from a
 * plate object from a plates module, and inlined so the composited SVG can
 * be drawn into a canvas (which can't fetch anything itself).
 */

import { loadWith } from './load.js';

/**
 * Bytes over `fetch`.
 *
 * @param {URL} url Where.
 * @returns {Promise<Uint8Array>} The bytes.
 * @throws {Error} When the request fails.
 */
async function read(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`loadPlate: ${res.status} for ${url.href}`);
	return new Uint8Array(await res.arrayBuffer());
}

/**
 * A plate, its photo and maps fetched and inlined, ready for `plate()`.
 *
 * @param {import('./format.js').Plate | string | URL} source A plate object (from a plates module, its `base` set), or the URL of its directory or `plate.json`.
 * @returns {Promise<import('./format.js').Plate>} The loaded plate.
 */
export async function loadPlate(source) {
	if (typeof source === 'string') source = new URL(source, globalThis.location?.href);
	return loadWith(source, read);
}
