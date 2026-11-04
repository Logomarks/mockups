/**
 * @module @arraypress/mockups/materials/plaster
 *
 * A painted plaster wall: the paint's colour, the trowelled surface's fine
 * bumps lit from the light's side (fractal noise as a height field, under
 * a distant light), broad patches where the paint is a shade uneven, and
 * the light falling off across the wall. The relief can also be laid over
 * something stuck flat to the wall (a pasted poster takes its texture).
 */

import { el } from '../render/svg.js';
import { hash } from '../util/rng.js';
import { clamp } from '../util/num.js';

/**
 * The filter that lights the plaster's bumps: white where they face the light, darker where they turn away, as a multiply layer.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The relief.
 * @param {number} o.mm Pixels per millimetre.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {string} o.seed The seed.
 * @param {number} [o.depth=1] How deep the bumps are.
 * @returns {string} The filter's `url(#…)`.
 */
export function plasterFilter(sc, { mm, light, seed, depth = 1 }) {
	const f = sc.id('plaster');
	const lx = clamp(light, -1, 1);
	sc.def(
		el(
			'filter',
			{ id: f, x: 0, y: 0, width: '100%', height: '100%', filterUnits: 'objectBoundingBox', 'color-interpolation-filters': 'sRGB' },
			el('feTurbulence', { type: 'fractalNoise', baseFrequency: 1 / (1.8 * mm), numOctaves: 3, seed: hash(seed) % 997, result: 'n' }),
			el(
				'feDiffuseLighting',
				{ in: 'n', surfaceScale: 1.6 * depth * Math.min(4, mm), diffuseConstant: 1, 'lighting-color': '#ffffff', result: 'lit' },
				el('feDistantLight', { azimuth: lx >= 0 ? -60 + 30 * (1 - lx) : -120 - 30 * (1 + lx), elevation: 52 }),
			),
			// a flat patch comes out white, so the layer only darkens where the bumps turn away
			el('feComponentTransfer', { in: 'lit' }, ...['R', 'G', 'B'].map((c) => el(`feFunc${c}`, { type: 'linear', slope: 1.27, intercept: 0 }))),
		),
	);
	return `url(#${f})`;
}

/**
 * A plaster wall filling a box.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The wall.
 * @param {number} o.width Its width (px).
 * @param {number} o.height Its height (px).
 * @param {number} o.mm Pixels per millimetre.
 * @param {string} o.color The paint.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {string} o.seed The seed.
 * @returns {string} The markup, in `[0, width] × [0, height]`.
 */
export function plasterWall(sc, { width, height, mm, color, light, seed }) {
	const lx = clamp(light, -1, 1);
	const ids = { patch: sc.id('patchy'), fall: sc.id('falloff') };
	sc.def(
		el(
			'filter',
			{ id: ids.patch, x: 0, y: 0, width: '100%', height: '100%', filterUnits: 'objectBoundingBox' },
			el('feTurbulence', { type: 'fractalNoise', baseFrequency: 1 / (160 * mm), numOctaves: 2, seed: (hash(seed) % 997) + 3, result: 'n' }),
			el('feColorMatrix', { in: 'n', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 -0.38' }),
		),
	);
	sc.def(
		el(
			'radialGradient',
			{ id: ids.fall, gradientUnits: 'userSpaceOnUse', cx: width * (0.5 + 0.45 * lx), cy: -height * 0.1, r: Math.hypot(width, height) * 1.05 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.1 }),
			el('stop', { offset: 0.55, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.14 }),
		),
	);
	return el(
		'g',
		{},
		el('rect', { width, height, fill: color }),
		el('rect', { width, height, fill: '#3a3020', filter: `url(#${ids.patch})`, opacity: 0.12 }),
		el('rect', { width, height, fill: '#fff', filter: plasterFilter(sc, { mm, light, seed }), style: 'mix-blend-mode:multiply', opacity: 0.4 }),
		el('rect', { width, height, fill: `url(#${ids.fall})` }),
	);
}
