/**
 * @module @arraypress/mockups/materials/sky
 *
 * A soft sky for the outdoor objects, drawn rather than photographed: a
 * gradient from the zenith down to a paler horizon, a glow where the sun
 * is, and a few seeded clouds (clusters of blurred ellipses, lit from
 * above). At night it's a deep blue going to a warm city glow at the
 * horizon, with no clouds to speak of.
 */

import { el } from '../render/svg.js';
import { rng } from '../util/rng.js';
import { clamp } from '../util/num.js';

/** The skies, top to horizon, with the clouds' colour and how many. */
export const SKIES = Object.freeze({
	day: Object.freeze({ stops: ['#4f86c6', '#7eaadb', '#b9d3ec', '#e4eef6'], cloud: '#ffffff', clouds: 5, sun: '#fff6e0' }),
	dusk: Object.freeze({ stops: ['#3b4f86', '#7d6f9e', '#e0a07f', '#f6d1a3'], cloud: '#f3c6b2', clouds: 4, sun: '#ffd9a0' }),
	night: Object.freeze({ stops: ['#070b1c', '#0f1a3a', '#1f2c52', '#4a3f55'], cloud: '#2a3256', clouds: 2, sun: '#000000' }),
});

/**
 * A sky.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The sky.
 * @param {keyof typeof SKIES} [o.time='day'] Day, dusk or night.
 * @param {number} o.horizon Where the horizon is, in pixels from the top.
 * @param {number} [o.sun=0.3] Where the sun is across the frame, -1 to 1.
 * @param {string} [o.seed='sky'] Seeds the clouds.
 * @returns {string} The markup, filling the frame.
 */
export function sky(sc, { time = 'day', horizon, sun = 0.3, seed = 'sky' }) {
	const s = SKIES[time];
	const { width: w, height: h } = sc;
	const hz = clamp(horizon, h * 0.05, h * 2);
	const ids = { grad: sc.id('sky'), glow: sc.id('sun') };
	const stops = s.stops.map((c, i) => el('stop', { offset: [0, 0.45, 0.82, 1][i], 'stop-color': c }));
	sc.def(el('linearGradient', { id: ids.grad, gradientUnits: 'userSpaceOnUse', x1: 0, y1: Math.min(0, hz - h * 1.1), x2: 0, y2: hz }, ...stops));
	const sx = w * (0.5 + sun * 0.5);
	sc.def(
		el(
			'radialGradient',
			{ id: ids.glow, gradientUnits: 'userSpaceOnUse', cx: sx, cy: hz - h * 0.25, r: Math.max(w, h) * 0.7 },
			el('stop', { offset: 0, 'stop-color': s.sun, 'stop-opacity': time === 'night' ? 0 : 0.55 }),
			el('stop', { offset: 1, 'stop-color': s.sun, 'stop-opacity': 0 }),
		),
	);
	const r = rng(`${seed}:clouds`);
	let clouds = '';
	for (let i = 0; i < s.clouds; i++) {
		const cx = r.range(-0.1, 1.1) * w;
		const cy = r.range(0.08, 0.75) * hz;
		const size = r.range(0.12, 0.28) * w * (0.5 + (cy / hz) * 0.7);
		let puffs = '';
		const count = 5 + Math.floor(r.next() * 5);
		for (let j = 0; j < count; j++) {
			const px = cx + r.range(-1, 1) * size;
			const py = cy + r.range(-0.2, 0.15) * size;
			const rx = r.range(0.25, 0.55) * size;
			puffs += el('ellipse', { cx: px, cy: py, rx, ry: rx * r.range(0.35, 0.55) });
		}
		// a lit top and a faintly grey underside, both soft
		clouds +=
			el('g', { fill: s.cloud, opacity: time === 'night' ? 0.25 : 0.55, filter: sc.blur(size * 0.18) }, puffs) +
			el('g', { fill: '#000', opacity: time === 'night' ? 0 : 0.035, filter: sc.blur(size * 0.2), transform: `translate(0 ${size * 0.12})` }, puffs);
	}
	return el('g', {}, el('rect', { width: w, height: h, fill: `url(#${ids.grad})` }), el('rect', { width: w, height: h, fill: `url(#${ids.glow})` }), clouds);
}
