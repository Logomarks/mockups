/**
 * @module @logomarks/mockups/materials/slate
 *
 * Riven slate: a dark stone split along its grain, so its face is shelves
 * of layers with low steps between them, lit from the light's side; its
 * colour drifting in long bands along the grain; a fine grit; and a few
 * points of mica that catch the light.
 */

import { el } from '../render/svg.js';
import { mottle, speckTile } from './noise.js';
import { field, fbm, blur, shadePng } from '../util/field.js';
import { hash } from '../util/rng.js';

/**
 * Slate's layers, drawn over its colour.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} seed The seed.
 * @param {number} mm Pixels per millimetre.
 * @param {number} light Where the light is, left (-1) to right (1).
 * @returns {string} The layers.
 */
export function slate(sc, seed, mm, light) {
	const { width: w, height: h } = sc;
	const s = hash(seed);
	const span = Math.max(w, h) / mm;
	// the cleft: noise stretched along the grain, cut into shelves with steep risers between them
	const fw = 240;
	const fh = Math.max(8, Math.round((fw * h) / w));
	const f = fbm(field(fw, fh), { seed: `${seed}:cleft`, scale: Math.max(2, span / 80), octaves: 3, stretch: [6, 1], gain: 0.5 });
	for (let i = 0; i < f.v.length; i++) {
		const v = f.v[i] * 2.6;
		const k = Math.floor(v);
		const t = v - k;
		f.v[i] = (k + smoothstep(0.85, 1, t)) * 0.2 + f.v[i] * 0.04;
	}
	blur(f, 1);
	const cleft = el('image', { width: w, height: h, href: shadePng(f, { light, relief: 4, dark: 0.14, bright: 0.06 }), preserveAspectRatio: 'none' });
	const grit = speckTile(sc, { size: 320, freq: [1 / Math.max(1, mm * 0.32), 1 / Math.max(1, mm * 0.32)], octaves: 2, dark: 0.11, light: 0.07, seed: s });
	const mica = speckTile(sc, { size: 416, freq: [0.8 / Math.max(1, mm * 0.2), 0.8 / Math.max(1, mm * 0.2)], octaves: 1, dark: 0, light: 0.9, cut: 0.16, seed: s + 3 });
	return (
		mottle(sc, `${seed}:s`, Math.max(2, span / 70), 0.045, 3) +
		mottle(sc, `${seed}:s2`, Math.min(span / 14, 40), 0.035, 2) +
		cleft +
		el('rect', { width: w, height: h, fill: grit }) +
		el('rect', { width: w, height: h, fill: mica, opacity: 0.35 })
	);
}

/**
 * A smooth step from 0 to 1 between two edges.
 *
 * @param {number} a The lower edge.
 * @param {number} b The upper edge.
 * @param {number} x The value.
 * @returns {number} 0 below `a`, 1 above `b`, smooth between.
 */
function smoothstep(a, b, x) {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
}
