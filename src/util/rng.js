/**
 * @module @arraypress/mockups/util/rng
 *
 * Seeded randomness, so the same options always draw the same mockup: the
 * tracks cut into a record, where a splatter lands, how marble swirls.
 * A string is hashed (cyrb53 folded to 32 bits) into an sfc32 generator.
 */

/**
 * A string hashed to a 32-bit unsigned integer.
 *
 * @param {string} str Any string.
 * @param {number} [salt=0] A salt, for several independent hashes of one string.
 * @returns {number} An integer in `[0, 2^32)`.
 */
export function hash(str, salt = 0) {
	let h1 = 0xdeadbeef ^ salt;
	let h2 = 0x41c6ce57 ^ salt;
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
	return (h1 ^ h2) >>> 0;
}

/**
 * A seeded generator of floats in `[0, 1)`, with a range helper.
 *
 * @param {string} seed The seed.
 * @returns {{ next: () => number, range: (lo: number, hi: number) => number }} The generator.
 */
export function rng(seed) {
	let a = hash(seed, 1);
	let b = hash(seed, 2);
	let c = hash(seed, 3);
	let d = hash(seed, 4);
	const next = () => {
		a >>>= 0;
		b >>>= 0;
		c >>>= 0;
		d >>>= 0;
		const t = (a + b) | 0;
		a = b ^ (b >>> 9);
		b = (c + (c << 3)) | 0;
		c = (c << 21) | (c >>> 11);
		d = (d + 1) | 0;
		const r = (t + d) | 0;
		c = (c + r) | 0;
		return (r >>> 0) / 4294967296;
	};
	return { next, range: (lo, hi) => lo + (hi - lo) * next() };
}
