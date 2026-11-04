/**
 * @module @arraypress/mockups/parts/skyline
 *
 * The far side of a street, out of focus: a row of seeded building blocks
 * along the horizon in pale, hazy tones, with rows of windows (lit at
 * night), blurred as a lens focused on something near would blur them.
 */

import { el } from '../render/svg.js';
import { rng } from '../util/rng.js';
import { mix } from '../util/color.js';

/**
 * A row of buildings across the street.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('../util/camera.js').View} view The view.
 * @param {object} o The row.
 * @param {number} o.z How far back it stands (world z).
 * @param {[number, number]} o.x How far it runs, left and right (world x).
 * @param {boolean} [o.night=false] Whether its windows are lit.
 * @param {string} [o.haze='#dfe6ea'] The air's colour (the buildings fade into it).
 * @param {string} [o.seed='skyline'] Seeds the blocks.
 * @returns {string} The markup.
 */
export function skyline(sc, view, { z, x, night = false, haze = '#dfe6ea', seed = 'skyline' }) {
	const r = rng(`${seed}:blocks`);
	const tones = ['#b9b2a6', '#a49b8f', '#c9c2b5', '#8f8a84', '#b3a28f', '#9aa1a8'];
	let blocks = '';
	let lights = '';
	for (let x0 = x[0]; x0 < x[1]; ) {
		const w = r.range(5, 14);
		const h = r.range(7, 22);
		const tone = mix(tones[Math.floor(r.next() * tones.length)], haze, 0.45);
		const quad = [[x0, 0], [x0 + w, 0], [x0 + w, h], [x0, h]].map(([a, b]) => view.at([a, b, z]));
		blocks += el('path', { d: 'M' + quad.map((p) => p.join(' ')).join('L') + 'Z', fill: tone });
		// rows of windows
		for (let fy = 1.2; fy < h - 1; fy += 3.2) {
			for (let fx = x0 + 0.9; fx < x0 + w - 1.2; fx += 2.2) {
				const on = night && r.next() < 0.35;
				const win = [[fx, fy], [fx + 1.2, fy], [fx + 1.2, fy + 1.6], [fx, fy + 1.6]].map(([a, b]) => view.at([a, b, z]));
				const d = 'M' + win.map((p) => p.join(' ')).join('L') + 'Z';
				if (on) lights += el('path', { d, fill: r.next() < 0.5 ? '#ffd68a' : '#ffe9c4' });
				else blocks += el('path', { d, fill: mix(tone, '#3a4048', 0.35) });
			}
		}
		x0 += w + r.range(0, 1.5);
	}
	const blur = sc.blur(view.width * 0.004);
	return el('g', { filter: blur }, blocks) + (lights ? el('g', { filter: blur, opacity: 0.9 }, lights) : '');
}
