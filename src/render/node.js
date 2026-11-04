/**
 * @module @arraypress/mockups/node
 *
 * The same API in Node, plus rasterising through sharp (an optional peer,
 * imported on first use) and loading artwork from a path or URL, sized
 * down to what a mockup draws, so the SVG stays small and renders fast.
 */

import { readFile } from 'node:fs/promises';
import { artHref } from './art.js';

export * from '../index.js';

/** @type {Promise<typeof import('sharp').default> | null} */
let sharpModule = null;

/**
 * sharp, imported once.
 *
 * @returns {Promise<typeof import('sharp').default>} Its default export.
 * @throws {Error} When it isn't installed.
 */
async function sharp() {
	sharpModule ??= import('sharp').then(
		(m) => m.default,
		() => {
			sharpModule = null;
			throw new Error('@arraypress/mockups/node: rasterising needs sharp (npm install sharp)');
		},
	);
	return sharpModule;
}

/**
 * A mockup (or any SVG) as an image.
 *
 * @param {import('../types.js').Mockup | string} input A mockup, or SVG markup.
 * @param {import('./node.js').ImageOutput} [output] The format (`'png'`, `'webp'`, `'jpeg'` or `'avif'`; PNG by default), its quality, and a width to scale to.
 * @returns {Promise<Buffer>} The encoded image.
 */
export async function renderImage(input, output = {}) {
	const { format = 'png', quality = 90, width } = output;
	const svg = typeof input === 'string' ? input : input.svg;
	const s = await sharp();
	let img = s(Buffer.from(svg), { limitInputPixels: false });
	if (width) img = img.resize({ width: Math.round(width) });
	if (format === 'png') return img.png({ compressionLevel: 6 }).toBuffer();
	if (format === 'webp') return img.webp({ quality }).toBuffer();
	if (format === 'jpeg') return img.jpeg({ quality, mozjpeg: true }).toBuffer();
	if (format === 'avif') return img.avif({ quality }).toBuffer();
	throw new TypeError(`renderImage: format is 'png', 'webp', 'jpeg' or 'avif' (got ${JSON.stringify(format)})`);
}

/**
 * Artwork from a file, a URL or bytes, as a `data:` URI sized for a mockup.
 *
 * Raster art is scaled down (never up) to fit `size` and re-encoded: JPEG
 * when it has no transparency, PNG when it has. SVG stays SVG.
 *
 * @param {string | Uint8Array | ArrayBuffer} input A path, an http(s) URL, a `data:` URI, SVG markup, or image bytes.
 * @param {{ size?: number, quality?: number }} [o] The longest side to keep (1600) and the JPEG quality (90).
 * @returns {Promise<string>} A `data:` URI.
 */
export async function loadArt(input, { size = 1600, quality = 90 } = {}) {
	/** @type {Uint8Array} */
	let bytes;
	if (typeof input === 'string') {
		const s = input.trim();
		if (s.startsWith('<')) return artHref(s);
		if (/^https?:\/\//i.test(s)) {
			const res = await fetch(s);
			if (!res.ok) throw new Error(`loadArt: ${res.status} for ${s}`);
			bytes = new Uint8Array(await res.arrayBuffer());
		} else if (s.startsWith('data:')) {
			const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(s);
			if (!m) throw new TypeError('loadArt: a malformed data: URI');
			bytes = m[2] ? Buffer.from(m[3], 'base64') : new TextEncoder().encode(decodeURIComponent(m[3]));
		} else bytes = await readFile(s);
	} else bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
	const href = artHref(bytes);
	if (href.startsWith('data:image/svg+xml')) return href;
	const s = await sharp();
	const img = s(bytes).rotate().resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true });
	const { hasAlpha } = await s(bytes).metadata();
	const out = hasAlpha ? await img.png().toBuffer() : await img.jpeg({ quality, mozjpeg: true }).toBuffer();
	return artHref(out);
}
