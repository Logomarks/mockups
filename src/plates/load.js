/**
 * @module @logomarks/mockups/plates/load
 *
 * Loading a plate: its description (an object, or a `plate.json` by path or
 * URL) and its files (the photo and each screen's maps, named relative to
 * where the plate lives) read and inlined as `data:` URIs, so the composited
 * SVG renders anywhere. The reading itself is the runtime's: the file system
 * or `fetch` in Node, `fetch` in a browser.
 */

import { artHref } from '../render/art.js';
import { checkPlate, plateFiles } from './format.js';

/**
 * Reads bytes from a URL.
 *
 * @typedef {(url: URL) => Promise<Uint8Array>} ReadBytes
 */

/**
 * Where a plate given by location keeps its description: the URL itself when it names a `.json`, else `plate.json` inside it.
 *
 * @param {URL} url The location.
 * @returns {URL} The description's URL.
 */
export function describedAt(url) {
	if (/\.json$/i.test(url.pathname)) return url;
	return new URL('plate.json', url.href.endsWith('/') ? url : new URL(url.href + '/'));
}

/**
 * A plate with every file inlined.
 *
 * @param {import('./format.js').Plate | URL} source The plate (its `base` says where its files are), or where its `plate.json` is.
 * @param {ReadBytes} read How to read a file.
 * @returns {Promise<import('./format.js').Plate>} The plate, its files as `data:` URIs.
 * @throws {TypeError} When it's malformed, or a file is named relative to nothing.
 */
export async function loadWith(source, read) {
	/** @type {import('./format.js').Plate} */
	let plate;
	/** @type {URL | null} */
	let base = null;
	if (source instanceof URL) {
		const at = describedAt(source);
		plate = JSON.parse(new TextDecoder().decode(await read(at)));
		base = at;
	} else {
		plate = source;
		if (plate && plate.base) base = new URL(plate.base);
	}
	const p = checkPlate(plate);
	/** @type {Map<string, string>} */
	const inline = new Map();
	await Promise.all(
		plateFiles(p).map(async (f) => {
			if (f.startsWith('data:')) return inline.set(f, f);
			if (!base && !/^[a-z][a-z0-9+.-]*:/i.test(f)) throw new TypeError(`plate '${p.name}': ${f} is relative, but the plate has no base`);
			inline.set(f, artHref(await read(new URL(f, base ?? undefined))));
		}),
	);
	const at = (f) => (f ? inline.get(f) : undefined);
	return { ...p, base: undefined, photo: /** @type {string} */ (at(p.photo)), screens: p.screens.map((s) => ({ ...s, shading: at(s.shading), mask: at(s.mask), reflection: at(s.reflection) })) };
}
