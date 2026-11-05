/**
 * @module @logomarks/mockups/three/screen
 *
 * What a 3D screen shows, as a live texture: a canvas (redrawn by the page,
 * a shader's output), a video, or an image or artwork. A canvas is read
 * again every frame and a video as it plays; a picture is read once. The
 * screen's light is sampled from it now and then (its mean colour and how
 * bright it is), so the room takes the colour of what's playing.
 */

import { artHref } from '../render/art.js';
import { canvas2d } from '../render/image.js';

/**
 * A screen texture from what it shows.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('./screen.js').ScreenSource} source A canvas, video, image or bitmap, or artwork (bytes, SVG, a `data:` URI or a URL).
 * @returns {Promise<import('./screen.js').ScreenTexture>} The texture, how to read the source again, and its light.
 * @throws {TypeError} When there's nothing to show.
 */
export async function screenTexture(THREE, source) {
	if (source === undefined || source === null || source === '') throw new TypeError('tvScene: screen is required (a canvas, video, image or artwork)');
	const media = isMedia(source) ? source : await picture(/** @type {import('../types.js').Art} */ (source));
	const video = typeof HTMLVideoElement === 'function' && media instanceof HTMLVideoElement;
	const live = video || isCanvas(media);
	const texture = video ? new THREE.VideoTexture(/** @type {HTMLVideoElement} */ (media)) : live ? new THREE.CanvasTexture(/** @type {HTMLCanvasElement} */ (media)) : new THREE.Texture(/** @type {HTMLImageElement} */ (media));
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.minFilter = THREE.LinearFilter;
	texture.generateMipmaps = false;
	texture.needsUpdate = true;
	const [probe, g] = canvas2d(64, 64);
	return {
		texture,
		update() {
			if (live && !video) texture.needsUpdate = true;
		},
		light() {
			try {
				g.drawImage(/** @type {CanvasImageSource} */ (media), 0, 0, probe.width, probe.height);
				const d = g.getImageData(0, 0, probe.width, probe.height).data;
				const sum = [0, 0, 0];
				for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += d[i + k];
				const mean = sum.map((v) => v / (d.length / 4) / 255);
				const top = Math.max(...mean, 1e-3);
				// a phosphor's light reads more saturated than its mean: pushed away from grey, the brightest channel 1
				const grey = (mean[0] + mean[1] + mean[2]) / 3 / top;
				const color = /** @type {[number, number, number]} */ (mean.map((v) => Math.min(1, Math.max(0, grey + (v / top - grey) * 1.6))));
				return { color, level: top };
			} catch {
				// a video not yet playing, or from another origin: a soft white
				return { color: [1, 1, 1], level: 0.3 };
			}
		},
	};
}

/**
 * Whether a source is something a texture reads directly.
 *
 * @param {unknown} v The source.
 * @returns {boolean} True for a canvas, video, image or bitmap.
 */
function isMedia(v) {
	return (
		isCanvas(v) ||
		(typeof HTMLVideoElement === 'function' && v instanceof HTMLVideoElement) ||
		(typeof HTMLImageElement === 'function' && v instanceof HTMLImageElement) ||
		(typeof ImageBitmap === 'function' && v instanceof ImageBitmap)
	);
}

/**
 * Whether a source is a canvas.
 *
 * @param {unknown} v The source.
 * @returns {boolean} True for a page or offscreen canvas.
 */
function isCanvas(v) {
	return (typeof HTMLCanvasElement === 'function' && v instanceof HTMLCanvasElement) || (typeof OffscreenCanvas === 'function' && v instanceof OffscreenCanvas);
}

/**
 * Artwork loaded as an image.
 *
 * @param {import('../types.js').Art} art The artwork.
 * @returns {Promise<HTMLImageElement>} The image, decoded.
 */
async function picture(art) {
	const img = new Image();
	img.crossOrigin = 'anonymous';
	img.src = artHref(art);
	await img.decode();
	return img;
}
