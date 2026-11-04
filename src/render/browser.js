/**
 * @module @arraypress/mockups/browser
 *
 * The same API in a browser, plus rasterising through a canvas and loading
 * artwork from a URL or a file as a `data:` URI (an SVG drawn into a canvas
 * can't fetch anything, so its art has to be inline). `loadTextures()`
 * fetches the photographed board textures; until it's called, kraft board
 * is drawn with procedural fibre.
 */

import { artHref } from './art.js';
import { svgImage, canvas2d } from './image.js';
import { quietCrops, remember, PROBE } from './quiet.js';
import { KRAFT_COUNT, kraftUrl, setKraftTextures, kraftTextures } from '../materials/textures.js';

export * from '../index.js';
export { loadPlate } from '../plates/browser.js';

/** @type {Promise<boolean> | null} */
let texturesLoading = null;

/**
 * Fetches the photographed board textures for drawing, each kraft variant as a 512 px JPEG `data:` URI. Calling it again does nothing.
 *
 * @returns {Promise<boolean>} Whether they're loaded (false when they can't be fetched).
 */
export function loadTextures() {
	texturesLoading ??= (async () => {
		if (kraftTextures().length) return true;
		try {
			const list = await Promise.all(
				Array.from({ length: KRAFT_COUNT }, async (_, n) => {
					const r = await fetch(kraftUrl(n));
					if (!r.ok) throw new Error(String(r.status));
					const bmp = await createImageBitmap(await r.blob());
					const [c, g] = canvas2d(512, 512);
					g.drawImage(bmp, 0, 0, 512, 512);
					bmp.close();
					return c.toDataURL('image/jpeg', 0.85);
				}),
			);
			setKraftTextures(list);
			return true;
		} catch {
			texturesLoading = null;
			return false;
		}
	})();
	return texturesLoading;
}

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
	const out = c.toDataURL(opaque(g, c.width, c.height) ? 'image/jpeg' : 'image/png', quality);
	remember(out, quietCrops(probe(c), PROBE, PROBE));
	return out;
}

/**
 * A small grey copy of a canvas's square middle (as the objects place art), for finding where it's quiet.
 *
 * @param {HTMLCanvasElement} c The canvas.
 * @returns {Uint8Array} Luminance, `PROBE` square, row by row.
 */
function probe(c) {
	const m = Math.min(c.width, c.height);
	const [p, g] = canvas2d(PROBE, PROBE);
	g.drawImage(c, (c.width - m) / 2, (c.height - m) / 2, m, m, 0, 0, PROBE, PROBE);
	const d = g.getImageData(0, 0, PROBE, PROBE).data;
	const grey = new Uint8Array(PROBE * PROBE);
	for (let i = 0; i < grey.length; i++) grey[i] = 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2];
	return grey;
}

/**
 * Whether a drawn image has no see-through pixel, so it can be kept as a (much smaller) JPEG.
 *
 * @param {CanvasRenderingContext2D} g The canvas it's drawn on.
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @returns {boolean}
 */
function opaque(g, w, h) {
	const px = g.getImageData(0, 0, w, h).data;
	for (let i = 3; i < px.length; i += 4) if (px[i] < 255) return false;
	return true;
}
