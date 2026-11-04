/**
 * @module @arraypress/mockups/materials/marble
 *
 * Marbled vinyl: bands of each colour laid side by side at a seeded angle,
 * then pulled into swirls by turbulence (an SVG displacement), the way two
 * or three pellets of colour smear when the press closes.
 */

import { el } from '../render/svg.js';
import { rng, hash } from '../util/rng.js';

/**
 * A marbled disc, centred on the origin.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {readonly string[]} colors Its colours, banded in turn.
 * @param {number} radius The record's radius.
 * @param {string} seed The seed.
 * @param {number} [opacity=1] How much light it stops.
 * @returns {string} The markup.
 */
export function marble(sc, colors, radius, seed, opacity = 1) {
	const r = rng(`${seed}:marble`);
	const f = sc.id('marble');
	const span = radius * 1.9;
	sc.def(
		el(
			'filter',
			{ id: f, filterUnits: 'userSpaceOnUse', x: -radius * 1.1, y: -radius * 1.1, width: radius * 2.2, height: radius * 2.2, 'color-interpolation-filters': 'sRGB' },
			el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9 / radius, numOctaves: 2, seed: hash(seed) % 997, result: 'n' }),
			el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: radius * 0.9, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }),
			el('feGaussianBlur', { in: 'd', stdDeviation: radius * 0.008 }),
		),
	);
	let bands = '';
	let last = -1;
	for (let y = -span; y < span; ) {
		const h = radius * (0.03 + 0.2 * r.next() ** 2);
		// never the same colour twice running, or two bands merge into one
		const c = (last + 1 + Math.floor(r.next() * (colors.length - 1))) % colors.length;
		bands += el('rect', { x: -span, y, width: span * 2, height: h + 1, fill: colors[c] });
		last = c;
		y += h;
	}
	return el('g', { opacity }, el('circle', { r: radius, fill: colors[0] }), el('g', { filter: `url(#${f})` }, el('g', { transform: `rotate(${r.range(0, 180)})` }, bands)));
}
