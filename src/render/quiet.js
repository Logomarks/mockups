/**
 * @module @arraypress/mockups/render/quiet
 *
 * Where a cover is quiet: the windows with the fewest edges (no type, no
 * logo, no busy detail), found from a small grey copy of it. `loadArt`
 * measures the art it loads and remembers the windows by the `data:` URI
 * it returns, so a label cut from the cover (`labels: 'auto'`) lands on a
 * calm patch rather than across the title.
 */

/** How many measured artworks are kept. */
const KEEP = 32;

/** The side of the grey copy `loadArt` measures. */
export const PROBE = 128;

/** @type {Map<string, import('../types.js').Crop[]>} */
const known = new Map();

/**
 * The quietest square windows of a grey image: the lowest mean edge strength (a Laplacian), each one apart from the last.
 *
 * @param {ArrayLike<number>} grey Luminance, 0–255, row by row.
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @param {{ size?: number, count?: number }} [o] The windows' side as a fraction of the shorter side (0.34), and how many (2).
 * @returns {import('../types.js').Crop[]} The windows, quietest first, as fractions of the image.
 */
export function quietCrops(grey, w, h, { size = 0.34, count = 2 } = {}) {
	// edge strength (a Laplacian: fine strokes like type and line art score high, soft gradients low), summed into an
	// integral image so any window's total is four reads
	const sum = new Float64Array((w + 1) * (h + 1));
	const at = (x, y) => grey[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
	for (let y = 0; y < h; y++) {
		let row = 0;
		for (let x = 0; x < w; x++) {
			row += Math.abs(4 * at(x, y) - at(x - 1, y) - at(x + 1, y) - at(x, y - 1) - at(x, y + 1));
			sum[(y + 1) * (w + 1) + x + 1] = sum[y * (w + 1) + x + 1] + row;
		}
	}
	const side = Math.max(2, Math.round(size * Math.min(w, h)));
	/** @type {{ x: number, y: number, score: number }[]} */
	const all = [];
	const step = Math.max(1, Math.round(side / 8));
	for (let y = 0; y + side <= h; y += step)
		for (let x = 0; x + side <= w; x += step) {
			const s = sum[(y + side) * (w + 1) + x + side] - sum[y * (w + 1) + x + side] - sum[(y + side) * (w + 1) + x] + sum[y * (w + 1) + x];
			all.push({ x: (x + side / 2) / w, y: (y + side / 2) / h, score: s });
		}
	all.sort((a, b) => a.score - b.score);
	/** @type {import('../types.js').Crop[]} */
	const out = [];
	for (const c of all) {
		if (out.some((o) => Math.hypot(o.x - c.x, o.y - c.y) < size * 0.6)) continue;
		out.push({ x: c.x, y: c.y, size: side / Math.min(w, h) });
		if (out.length === count) break;
	}
	return out;
}

/**
 * Remembers an artwork's quiet windows.
 *
 * @param {string} href The artwork's `data:` URI (as `loadArt` returns it).
 * @param {import('../types.js').Crop[]} crops Its windows.
 */
export function remember(href, crops) {
	known.delete(href);
	known.set(href, crops);
	if (known.size > KEEP) known.delete(/** @type {string} */ (known.keys().next().value));
}

/**
 * An artwork's quiet windows, if it was measured.
 *
 * @param {string} href The artwork's `data:` URI.
 * @returns {import('../types.js').Crop[] | null} Its windows, or `null`.
 */
export function recall(href) {
	return known.get(href) ?? null;
}
