/**
 * @module @logomarks/mockups/three/glow
 *
 * The colour of a screen's light: the mean of what it shows, pushed a
 * little away from grey, as a lit screen's spill reads more saturated in
 * a dark room than its average. Browser only.
 */

import { canvas2d } from '../render/image.js';
import { hex } from '../util/color.js';

/**
 * The light a picture throws.
 *
 * @param {CanvasImageSource} picture The picture.
 * @param {number} [push=1.4] How far from grey (1: the plain mean).
 * @returns {string} The colour, hex.
 */
export function glowColor(picture, push = 1.4) {
	const [, g] = canvas2d(16, 16);
	g.drawImage(picture, 0, 0, 16, 16);
	const d = g.getImageData(0, 0, 16, 16).data;
	const sum = [0, 0, 0];
	for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += d[i + k];
	const mean = sum.map((v) => v / 256);
	const grey = (mean[0] + mean[1] + mean[2]) / 3;
	return hex(mean.map((v) => grey + (v - grey) * push));
}
