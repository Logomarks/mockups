/**
 * @module @arraypress/mockups/plates/node
 *
 * Plates in Node: loaded from a directory, a `plate.json`, a `file:` or
 * http(s) URL, or a plate object from a plates module.
 */

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadWith } from './load.js';

/**
 * Bytes from a `file:` URL or over http(s).
 *
 * @param {URL} url Where.
 * @returns {Promise<Uint8Array>} The bytes.
 * @throws {Error} When the request fails.
 */
async function read(url) {
	if (url.protocol === 'file:') return readFile(url);
	const res = await fetch(url);
	if (!res.ok) throw new Error(`loadPlate: ${res.status} for ${url.href}`);
	return new Uint8Array(await res.arrayBuffer());
}

/**
 * A plate, its photo and maps read and inlined, ready for `plate()`.
 *
 * @param {import('./format.js').Plate | string | URL} source A plate object (from a plates module, its `base` set), or where one is: a directory or `plate.json` path, or a URL.
 * @returns {Promise<import('./format.js').Plate>} The loaded plate.
 */
export async function loadPlate(source) {
	if (typeof source === 'string') source = /^[a-z][a-z0-9+.-]+:/i.test(source) ? new URL(source) : pathToFileURL(source);
	return loadWith(source, read);
}
