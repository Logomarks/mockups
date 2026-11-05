/**
 * @module @logomarks/mockups/materials/noise
 *
 * The two noises every textured surface is built from: broad mottling
 * (low-frequency noise drawn small in JS and stretched over the frame, so
 * it costs nothing to rasterise) and a seamless tile of fine specks from
 * SVG turbulence.
 */

import { el } from '../render/svg.js';
import { field, fbm, greyPng } from '../util/field.js';

/**
 * Broad mottling: low-frequency noise drawn small and stretched over the frame, light and dark.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} seed The seed.
 * @param {number} cells How many noise cells span the frame's longer side.
 * @param {number} amount How strong, 0–1.
 * @param {number} [octaves=3] Octaves of noise.
 * @returns {string} The layer.
 */
export function mottle(sc, seed, cells, amount, octaves = 3) {
	const { width: w, height: h } = sc;
	const n = 96;
	const fw = w >= h ? n : Math.round((n * w) / h);
	const fh = w >= h ? Math.round((n * h) / w) : n;
	const f = fbm(field(fw, fh), { seed: `${seed}:mottle`, scale: (cells * fw) / n, octaves, gain: 0.55 });
	const href = greyPng(f.w, f.h, (x, y) => {
		const v = f.v[y * f.w + x];
		return [v > 0 ? 1 : 0, Math.abs(v) * amount];
	});
	return el('image', { width: w, height: h, href, preserveAspectRatio: 'none' });
}

/**
 * A seamless tile of fine texture: turbulence turned into light and dark specks.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The tile.
 * @param {number} o.size The tile's side, in pixels.
 * @param {[number, number]} o.freq The turbulence's base frequency across and down, per pixel.
 * @param {number} o.octaves Octaves.
 * @param {number} o.dark How dark the dark specks go, 0–1.
 * @param {number} o.light How light the light specks go, 0–1.
 * @param {number} [o.cut=0.5] Where the noise turns from light to dark specks (above it: dark).
 * @param {number} [o.seed=0] The turbulence's seed.
 * @param {'fractalNoise' | 'turbulence'} [o.type='fractalNoise'] The kind of turbulence.
 * @returns {string} A `url(#…)` for a fill.
 */
export function speckTile(sc, { size, freq, octaves, dark, light, cut = 0.5, seed = 0, type = 'fractalNoise' }) {
	const f = sc.id('speck');
	const p = sc.id('tile');
	const s = Math.max(8, Math.round(size));
	// whole periods across the tile, so it repeats without a seam
	const fq = freq.map((v) => Math.max(1, Math.round(v * s)) / s);
	// the noise's red channel, R: dark specks get alpha (R - cut) × k, light ones (cut - R) × k
	const kd = (dark * 2) / (1 - cut);
	const kl = (light * 2) / cut;
	sc.def(
		el(
			'filter',
			{ id: f, filterUnits: 'userSpaceOnUse', x: 0, y: 0, width: s, height: s, 'color-interpolation-filters': 'sRGB' },
			el('feTurbulence', { type, baseFrequency: `${fq[0]} ${fq[1]}`, numOctaves: octaves, seed: seed % 1000, stitchTiles: 'stitch', result: 'n' }),
			el('feColorMatrix', { in: 'n', type: 'matrix', values: `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${kd} 0 0 0 ${-cut * kd}`, result: 'd' }),
			el('feColorMatrix', { in: 'n', type: 'matrix', values: `0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${-kl} 0 0 0 ${cut * kl}`, result: 'l' }),
			el('feMerge', {}, el('feMergeNode', { in: 'd' }), el('feMergeNode', { in: 'l' })),
		),
	);
	sc.def(el('pattern', { id: p, patternUnits: 'userSpaceOnUse', width: s, height: s }, el('rect', { width: s, height: s, filter: `url(#${f})` })));
	return `url(#${p})`;
}
