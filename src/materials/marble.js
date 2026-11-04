/**
 * @module @arraypress/mockups/materials/marble
 *
 * Marbled vinyl, the way a press makes it: pellets of each colour sit in
 * the puck at the centre and are squeezed outwards and round as the press
 * closes, so the colours run from the middle to the rim in broad curving
 * lobes, a big pool of the first colour, smaller tongues of the rest, and
 * thin streaks dragged along their edges. Turbulence breaks every edge
 * into smoke; a slight blur blends them where they meet.
 */

import { el } from '../render/svg.js';
import { rng, hash } from '../util/rng.js';
import { n } from '../util/num.js';

/**
 * One lobe of colour: the region between two curves running from the centre out past the rim, both turning the same way.
 *
 * @param {number} radius The record's radius.
 * @param {number} a0 Where its leading edge starts, radians.
 * @param {number} width How wide it is, radians, at the rim.
 * @param {number} twist How far its edges turn by the rim, radians.
 * @param {import('../util/rng.js').Rng} r The generator (for its edges' wobble).
 * @returns {string} Path data.
 */
export function lobe(radius, a0, width, twist, r) {
	const steps = 18;
	const wob = [r.range(0, 6.3), r.range(0, 6.3), r.range(1.5, 3.5), r.range(0.08, 0.22)];
	// narrow in the middle (the pellet), opening towards the rim
	const edge = (side) =>
		Array.from({ length: steps + 1 }, (_, i) => {
			const t = i / steps;
			const open = width * (0.35 + 0.65 * Math.sqrt(t));
			const a = a0 + twist * t ** 1.3 + side * open + wob[3] * Math.sin(wob[2] * t * Math.PI + wob[side > 0 ? 0 : 1]);
			const d = radius * 1.15 * t;
			return [Math.cos(a) * d, Math.sin(a) * d];
		});
	return 'M' + [...edge(0), ...edge(1).reverse()].map(([x, y]) => `${n(x)} ${n(y)}`).join('L') + 'Z';
}

/**
 * A marbled disc, centred on the origin.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {readonly string[]} colors Its colours: the first is the pool, the rest run through it.
 * @param {number} radius The record's radius.
 * @param {string} seed The seed.
 * @param {number} [opacity=1] How much light it stops.
 * @returns {string} The markup.
 */
export function marble(sc, colors, radius, seed, opacity = 1) {
	const r = rng(`${seed}:marble`);
	const f = sc.id('marble');
	const s = hash(seed) % 997;
	sc.def(
		el(
			'filter',
			{ id: f, filterUnits: 'userSpaceOnUse', x: -radius * 1.2, y: -radius * 1.2, width: radius * 2.4, height: radius * 2.4, 'color-interpolation-filters': 'sRGB' },
			// broad warps first, then a fine one
			el('feTurbulence', { type: 'fractalNoise', baseFrequency: 1.6 / radius, numOctaves: 2, seed: s, result: 'broad' }),
			el('feDisplacementMap', { in: 'SourceGraphic', in2: 'broad', scale: radius * 0.32, xChannelSelector: 'R', yChannelSelector: 'G', result: 'a' }),
			el('feTurbulence', { type: 'fractalNoise', baseFrequency: 7 / radius, numOctaves: 3, seed: s + 1, result: 'fine' }),
			el('feDisplacementMap', { in: 'a', in2: 'fine', scale: radius * 0.045, xChannelSelector: 'G', yChannelSelector: 'R', result: 'b' }),
			// a crisp copy and a smoky one, half and half: colours bleed into each other at the edges
			el('feGaussianBlur', { in: 'b', stdDeviation: radius * 0.008, result: 'crisp' }),
			el('feGaussianBlur', { in: 'b', stdDeviation: radius * 0.045, result: 'smoke' }),
			el('feComposite', { in: 'crisp', in2: 'smoke', operator: 'arithmetic', k1: 0, k2: 0.55, k3: 0.45, k4: 0 }),
		),
	);
	const twist = (r.next() < 0.5 ? -1 : 1) * r.range(1.6, 2.8);
	let shapes = '';
	// tongues of the other colours, spread round the disc
	const rest = colors.slice(1);
	const lobes = 4 + Math.floor(r.next() * 4);
	for (let i = 0; i < lobes; i++) {
		const a0 = (i / lobes) * Math.PI * 2 + r.range(-0.3, 0.3);
		shapes += el('path', { d: lobe(radius, a0, r.range(0.18, 0.55), twist * r.range(0.8, 1.2), r), fill: rest[i % rest.length] });
	}
	// streaks dragged along, in any of the colours, the pool's too
	for (let i = 0, m = 6 + Math.floor(r.next() * 6); i < m; i++) {
		const c = colors[Math.floor(r.next() * colors.length)];
		shapes += el('path', { d: lobe(radius, r.range(0, Math.PI * 2), r.range(0.02, 0.07), twist * r.range(0.9, 1.25), r), fill: c, 'fill-opacity': r.range(0.55, 0.95) });
	}
	return el('g', { opacity }, el('circle', { r: radius, fill: colors[0] }), el('g', { filter: `url(#${f})` }, el('circle', { r: radius * 1.2, fill: colors[0] }), shapes));
}
