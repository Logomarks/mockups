/**
 * @module @logomarks/mockups/materials/grain
 *
 * Film grain over the whole frame: a small tile of seeded noise (light and
 * dark specks, a triangular distribution like film's) repeated as a
 * pattern. A photo always has some; without it smooth gradients band and
 * the picture reads as vector art.
 */

import { el } from '../render/svg.js';
import { encodePng } from '../render/png.js';
import { base64 } from '../render/art.js';
import { rng } from '../util/rng.js';

/** The tile's side, in pixels. */
const TILE = 160;

/** @type {Map<string, string>} */
const tiles = new Map();

/**
 * The grain tile as a `data:` URI, made once per seed.
 *
 * @param {string} seed The seed.
 * @returns {string} A PNG `data:` URI.
 */
export function grainTile(seed) {
	let uri = tiles.get(seed);
	if (!uri) {
		const r = rng(`${seed}:grain`);
		const px = new Uint8Array(TILE * TILE * 2);
		for (let i = 0; i < TILE * TILE; i++) {
			const v = r.next() + r.next() - 1; // triangular, -1 to 1
			px[i * 2] = v > 0 ? 255 : 0;
			px[i * 2 + 1] = Math.round(Math.abs(v) * 255);
		}
		uri = `data:image/png;base64,${base64(encodePng(TILE, TILE, px))}`;
		tiles.set(seed, uri);
	}
	return uri;
}

/**
 * The grain over the frame.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {number} amount How strong, 0–1 (0 for none).
 * @param {string} seed The seed.
 * @returns {string} The layer's markup, or nothing.
 */
export function grainLayer(sc, amount, seed) {
	if (amount <= 0) return '';
	const p = sc.id('grain');
	sc.def(el('pattern', { id: p, patternUnits: 'userSpaceOnUse', width: TILE, height: TILE }, el('image', { width: TILE, height: TILE, href: grainTile(seed) })));
	return el('rect', { width: sc.width, height: sc.height, fill: `url(#${p})`, opacity: 0.04 * amount });
}
