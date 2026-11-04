/**
 * @module @arraypress/mockups/util/size
 *
 * The output size every object takes: one number for a square, or
 * `{ width, height }`, whole pixels from 16 to 8192.
 */

/**
 * A size option as width and height.
 *
 * @param {import('../types.js').Size | undefined} size One number (a square) or `{ width, height }`.
 * @param {number} [fallback=1600] The square's side when there's no size.
 * @returns {{ width: number, height: number }} Whole pixels.
 * @throws {TypeError} When a side isn't a number from 16 to 8192.
 */
export function resolveSize(size, fallback = 1600) {
	const s = size ?? fallback;
	const [w, h] = typeof s === 'number' ? [s, s] : [s?.width, s?.height];
	for (const v of [w, h]) if (typeof v !== 'number' || !Number.isFinite(v) || v < 16 || v > 8192) throw new TypeError(`size: a number of pixels from 16 to 8192, or { width, height } (got ${JSON.stringify(size)})`);
	return { width: Math.round(/** @type {number} */ (w)), height: Math.round(/** @type {number} */ (h)) };
}
