/**
 * @module @arraypress/mockups/util/color
 *
 * The little colour maths the materials need: hex in and out, mixing two
 * colours, and how light a colour is (to pick a label's ink, or how a
 * ground reads).
 */

import { clamp } from './num.js';

/**
 * A hex colour as channels.
 *
 * @param {string} hex `#rgb` or `#rrggbb` (the `#` optional).
 * @returns {[number, number, number]} Red, green and blue, 0–255.
 * @throws {TypeError} When it isn't a hex colour.
 */
export function rgb(hex) {
	const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
	if (!m) throw new TypeError(`Not a hex colour: ${JSON.stringify(hex)}`);
	const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/**
 * Channels as a hex colour.
 *
 * @param {readonly number[]} c Red, green and blue, 0–255 (rounded and clamped).
 * @returns {string} `#rrggbb`, lower case.
 */
export const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');

/**
 * Two colours mixed.
 *
 * @param {string} a The first colour (t = 0).
 * @param {string} b The second (t = 1).
 * @param {number} t How much of `b`.
 * @returns {string} The mix, as `#rrggbb`.
 */
export function mix(a, b, t) {
	const x = rgb(a);
	const y = rgb(b);
	return hex(x.map((v, i) => v + (y[i] - v) * t));
}

/**
 * Two colours multiplied, as light through a filter is.
 *
 * @param {string} a One colour.
 * @param {string} b The other.
 * @returns {string} Their product, as `#rrggbb`.
 */
export function multiply(a, b) {
	const x = rgb(a);
	const y = rgb(b);
	return hex(x.map((v, i) => (v * y[i]) / 255));
}

/**
 * How light a colour is (Rec. 709 luma of the sRGB values).
 *
 * @param {string} c A hex colour.
 * @returns {number} 0 for black to 1 for white.
 */
export function luma(c) {
	const [r, g, b] = rgb(c);
	return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Whether a string is a hex colour.
 *
 * @param {unknown} v Anything.
 * @returns {v is string} `true` for `#rgb` and `#rrggbb`.
 */
export const isHex = (v) => typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());
