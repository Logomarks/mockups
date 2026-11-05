/**
 * @module @logomarks/mockups/materials/vinyl
 *
 * What a record is pressed in. A spec (a finish's name, a hex colour,
 * `{ color, opacity }`, `{ splatter }` or `{ marble }`) resolves to a
 * material: its colour, how much light it stops, and how strongly its
 * grooves catch the light. Translucent vinyl is a filter: what's behind it
 * is multiplied by its colour (with a little of the colour scattered back
 * from the front light, more on a dark ground), not washed over with it.
 * `body` paints the disc itself; the light on its face is `./surface.js`.
 */

import { el } from '../render/svg.js';
import { isHex, luma, mix, multiply } from '../util/color.js';
import { clamp } from '../util/num.js';
import { splatter } from './splatter.js';
import { marble } from './marble.js';

/** The named finishes: colour, opacity (1 is solid) and sheen (how much the grooves shine). */
export const FINISHES = Object.freeze({
	clear: Object.freeze({ color: '#6c7176', opacity: 0.065, sheen: 0.55 }),
	black: Object.freeze({ color: '#0d0d0e', opacity: 1, sheen: 1 }),
	white: Object.freeze({ color: '#eeede8', opacity: 1, sheen: 0.45 }),
	smoke: Object.freeze({ color: '#26272b', opacity: 0.62, sheen: 0.8 }),
});

/**
 * A resolved material.
 *
 * @typedef {object} Material
 * @property {'clear' | 'solid' | 'tinted' | 'splatter' | 'marble'} kind How it's painted.
 * @property {string} color Its colour (the base, for splatter and marble).
 * @property {number} opacity How much light it stops, 0–1.
 * @property {number} sheen How strongly its grooves catch the light, 0–1.
 * @property {string[]} colors The splatter's or marble's colours.
 * @property {Material | null} base What a splatter lands on.
 */

/**
 * A material from its spec.
 *
 * @param {import('./vinyl.js').VinylSpec | undefined} spec A finish (`'clear'`, `'black'`, `'white'`, `'smoke'`), a hex colour (solid), `{ color, opacity }`, `{ splatter: colors, base }` or `{ marble: colors, opacity }`.
 * @returns {Material} The material.
 * @throws {TypeError} For anything else.
 */
export function resolveVinyl(spec = 'clear') {
	const bad = () => new TypeError(`vinyl: 'clear', 'black', 'white', 'smoke', a hex colour, { color, opacity }, { splatter } or { marble } (got ${JSON.stringify(spec)})`);
	if (typeof spec === 'string') {
		if (Object.hasOwn(FINISHES, spec)) {
			const f = FINISHES[/** @type {keyof typeof FINISHES} */ (spec)];
			return { kind: spec === 'clear' ? 'clear' : f.opacity < 1 ? 'tinted' : 'solid', ...f, colors: [], base: null };
		}
		if (isHex(spec)) return { kind: 'solid', color: spec, opacity: 1, sheen: sheenFor(spec), colors: [], base: null };
		throw bad();
	}
	if (!spec || typeof spec !== 'object') throw bad();
	if ('splatter' in spec) {
		const colors = spec.splatter;
		if (!Array.isArray(colors) || !colors.length || !colors.every(isHex)) throw new TypeError('vinyl.splatter: one or more hex colours');
		const base = resolveVinyl(spec.base ?? 'clear');
		return { ...base, kind: 'splatter', colors: [...colors], base, opacity: Math.max(base.opacity, 0.35) };
	}
	if ('marble' in spec) {
		const colors = spec.marble;
		if (!Array.isArray(colors) || colors.length < 2 || !colors.every(isHex)) throw new TypeError('vinyl.marble: two or more hex colours');
		const opacity = clamp(spec.opacity ?? 1);
		return { kind: 'marble', color: colors[0], opacity, sheen: 0.7, colors: [...colors], base: null };
	}
	if ('color' in spec && isHex(spec.color)) {
		const opacity = clamp(spec.opacity ?? 0.75);
		return { kind: opacity >= 0.98 ? 'solid' : 'tinted', color: spec.color, opacity, sheen: sheenFor(spec.color), colors: [], base: null };
	}
	throw bad();
}

/** Darker vinyl shows its sheen more. */
const sheenFor = (c) => 0.45 + 0.5 * (1 - luma(c));

/**
 * The colour a record's body is painted in, at its opacity: solid vinyl its own colour; translucent vinyl the ground seen through it (multiplied by its colour), plus what it scatters back.
 *
 * @param {Material} m The material.
 * @param {string} ground The ground's colour.
 * @returns {string} The paint.
 */
export function paint(m, ground) {
	if (m.opacity >= 0.98) return m.color;
	return mix(multiply(ground, m.color), m.color, 0.15 + 0.35 * (1 - luma(ground)));
}

/**
 * Whether a record reads as dark on this ground: then its grooves are drawn in light, not shadow.
 *
 * @param {Material} m The material.
 * @param {string} ground The ground's colour.
 * @returns {boolean} Whether it's dark.
 */
export function isDark(m, ground) {
	return luma(mix(ground, paint(m, ground), m.opacity)) < 0.36;
}

/**
 * The disc itself, centred on the origin: its colour and, for coloured translucent vinyl, light gathering towards the middle.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {Material} m The material.
 * @param {number} r The record's radius.
 * @param {string} seed The seed for a splatter or marble.
 * @param {string} ground The ground's colour.
 * @returns {string} The markup.
 */
export function body(sc, m, r, seed, ground) {
	if (m.kind === 'splatter' && m.base) return body(sc, m.base, r, seed, ground) + splatter(sc, m.colors, r, seed);
	if (m.kind === 'marble') return marble(sc, m.colors, r, seed, m.opacity);
	const color = paint(m, ground);
	const disc = el('circle', { r, fill: color, opacity: m.opacity });
	if (m.kind !== 'tinted') return disc;
	const g = sc.id('glow');
	sc.def(
		el(
			'radialGradient',
			{ id: g, gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r },
			el('stop', { offset: 0.3, 'stop-color': mix(m.color, '#ffffff', 0.4), 'stop-opacity': 0.22 }),
			el('stop', { offset: 0.8, 'stop-color': color, 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': mix(color, '#000000', 0.35), 'stop-opacity': 0.35 }),
		),
	);
	return disc + el('circle', { r, fill: `url(#${g})` });
}
