/**
 * @module @logomarks/mockups/util/reader
 *
 * Reading a print object's options: each read checks its kind, fills in
 * the default and holds numbers in range, and a bad value throws a
 * TypeError that names the object and the option.
 */

import { isHex } from './color.js';
import { clamp } from './num.js';

/**
 * A reader for one object's options.
 *
 * @param {string} object The object's name, for errors (`'card'`).
 * @param {unknown} options What was passed.
 * @returns {import('./reader.js').Reader} The reader.
 * @throws {TypeError} When `options` isn't an object, or has no `art`.
 */
export function reader(object, options) {
	if (!options || typeof options !== 'object') throw new TypeError(`${object}: pass { art, … }`);
	const o = /** @type {Record<string, unknown>} */ (options);
	if (o.art === undefined || o.art === null || o.art === '') throw new TypeError(`${object}: art is required`);
	const fail = (name, want) => new TypeError(`${object}: ${name} is ${want} (got ${JSON.stringify(o[name])})`);
	return {
		raw: (name) => o[name],
		num(name, fallback, lo = -Infinity, hi = Infinity) {
			const v = o[name];
			if (v === undefined) return fallback;
			if (typeof v !== 'number' || !Number.isFinite(v)) throw fail(name, 'a number');
			return clamp(v, lo, hi);
		},
		oneOf(name, fallback, list) {
			const v = o[name] ?? fallback;
			if (!list.includes(/** @type {never} */ (v))) throw fail(name, list.map((s) => `'${s}'`).join(', ').replace(/, ([^,]*)$/, ' or $1'));
			return /** @type {never} */ (v);
		},
		color(name, fallback) {
			const v = o[name];
			if (v === undefined || v === null) return fallback;
			if (!isHex(v)) throw fail(name, 'a hex colour');
			return /** @type {string} */ (v);
		},
		text(name, fallback) {
			const v = o[name];
			if (v === undefined) return fallback;
			if (typeof v !== 'string') throw fail(name, 'a string');
			return v;
		},
		bool(name, fallback) {
			const v = o[name];
			if (v === undefined) return fallback;
			if (typeof v !== 'boolean') throw fail(name, 'true or false');
			return v;
		},
	};
}

/**
 * A short, stable signature of an artwork, for a document's key (two mockups of different art on one page get different ids).
 *
 * @param {import('../types.js').Art | undefined | null} art The artwork.
 * @returns {string} Its kind, length and a few of its characters.
 */
export function artKey(art) {
	if (art === undefined || art === null) return '-';
	if (typeof art === 'string') return `s${art.length}:${art.slice(0, 48)}:${art.slice(-48)}`;
	const b = art instanceof ArrayBuffer ? new Uint8Array(art) : art;
	return `b${b.length}:${Array.from(b.subarray(Math.max(0, b.length - 32))).join('.')}`;
}
