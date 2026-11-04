/**
 * @module @arraypress/mockups/util/num
 *
 * Number helpers shared by every part: clamping, mixing, and writing
 * numbers into SVG compactly (three decimals, no trailing zeros).
 */

/**
 * A number held inside a range.
 *
 * @param {number} v The number.
 * @param {number} [lo=0] The lowest it may be.
 * @param {number} [hi=1] The highest it may be.
 * @returns {number} `v`, no lower than `lo` and no higher than `hi`.
 */
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/**
 * The point `t` of the way from `a` to `b`.
 *
 * @param {number} a Where it starts (t = 0).
 * @param {number} b Where it ends (t = 1).
 * @param {number} t How far along.
 * @returns {number} The mix.
 */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * A number as SVG writes it: at most three decimals, no `-0`, no trailing zeros.
 *
 * @param {number} v The number.
 * @returns {string} Its shortest fixed form.
 */
export const n = (v) => {
	const r = Math.round(v * 1000) / 1000;
	return Object.is(r, -0) ? '0' : String(r);
};
