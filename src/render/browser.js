/**
 * @module @arraypress/mockups/browser
 *
 * The same API in a browser, plus rasterising through a canvas and loading
 * artwork from a URL or a file as a `data:` URI (an SVG drawn into a canvas
 * can't fetch anything, so its art has to be inline).
 */

import { artHref } from './art.js';
import { svgImage, canvas2d } from './image.js';

export * from '../index.js';

/**
 * A mockup drawn into a canvas at its own size.
 *
 * @param {import('../types.js').Mockup} m The mockup.
 * @param {HTMLCanvasElement | OffscreenCanvas} [canvas] A canvas to draw into (a new one by default); it's resized to the mockup.
 * @returns {Promise<HTMLCanvasElement | OffscreenCanvas>} The canvas.
 */
export async function renderCanvas(m, canvas) {
	const img = await svgImage(m.svg);
	const c = canvas ?? document.createElement('canvas');
	c.width = m.width;
	c.height = m.height;
	const g = /** @type {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} */ (c.getContext('2d'));
	g.drawImage(img, 0, 0, m.width, m.height);
	return c;
}

/**
 * A mockup as an image `Blob`.
 *
 * @param {import('../types.js').Mockup} m The mockup.
 * @param {{ type?: string, quality?: number }} [o] The image type (`'image/png'`) and quality for lossy ones (0.92).
 * @returns {Promise<Blob>} The image.
 */
export async function renderBlob(m, { type = 'image/png', quality = 0.92 } = {}) {
	const c = await renderCanvas(m);
	if ('convertToBlob' in c) return c.convertToBlob({ type, quality });
	return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('renderBlob: the canvas gave no image'))), type, quality));
}

/**
 * Artwork from a URL, a `File`/`Blob` or bytes, as a `data:` URI scaled down to fit `size`.
 *
 * @param {string | Blob | Uint8Array | ArrayBuffer} input A URL, a file, or image bytes.
 * @param {{ size?: number, quality?: number }} [o] The longest side to keep (1600) and the JPEG quality (0.9).
 * @returns {Promise<string>} A `data:` URI.
 */
export async function loadArt(input, { size = 1600, quality = 0.9 } = {}) {
	const blob =
		typeof input === 'string'
			? await fetch(input).then((r) => {
					if (!r.ok) throw new Error(`loadArt: ${r.status} for ${input}`);
					return r.blob();
				})
			: input instanceof Blob
				? input
				: new Blob([/** @type {BlobPart} */ (input)]);
	const bytes = new Uint8Array(await blob.arrayBuffer());
	const href = artHref(bytes);
	if (href.startsWith('data:image/svg+xml')) return href;
	const bmp = await createImageBitmap(blob);
	const s = Math.min(1, size / Math.max(bmp.width, bmp.height));
	const [c, g] = canvas2d(Math.round(bmp.width * s), Math.round(bmp.height * s));
	g.drawImage(bmp, 0, 0, c.width, c.height);
	bmp.close();
	return c.toDataURL(href.startsWith('data:image/png') ? 'image/png' : 'image/jpeg', quality);
}
