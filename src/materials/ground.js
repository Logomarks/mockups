/**
 * @module @logomarks/mockups/materials/ground
 *
 * The seamless paper the objects stand on: a flat colour, a faint vignette
 * towards the corners, and how strong shadows read on it (a dark ground
 * hides a black shadow, so they're drawn a little deeper there).
 */

import { el } from '../render/svg.js';
import { isHex, luma } from '../util/color.js';
import { clamp } from '../util/num.js';

/** The named grounds. */
export const GROUNDS = Object.freeze({
	light: Object.freeze({ color: '#e6e6e6', vignette: 0 }),
	dark: Object.freeze({ color: '#161618', vignette: 0.25 }),
});

/**
 * A ground resolved from its option.
 *
 * @param {import('../types.js').Ground | undefined} g A name, a hex colour, or `{ color, vignette }`.
 * @returns {{ color: string, vignette: number, dark: boolean, shadow: number }} Its colour, vignette, whether it's dark, and how deep shadows are drawn on it (1 on a light ground).
 * @throws {TypeError} For anything else.
 */
export function resolveGround(g = 'light') {
	const o = typeof g === 'string' ? (Object.hasOwn(GROUNDS, g) ? GROUNDS[/** @type {'light' | 'dark'} */ (g)] : isHex(g) ? { color: g } : null) : g;
	if (!o || !isHex(o.color)) throw new TypeError(`ground: 'light', 'dark', a hex colour or { color } (got ${JSON.stringify(g)})`);
	const l = luma(o.color);
	return { color: o.color, vignette: clamp(o.vignette ?? 0), dark: l < 0.4, shadow: l < 0.4 ? 1.5 : 1 };
}

/**
 * The ground's layers: its colour and the vignette.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {ReturnType<typeof resolveGround>} g The ground.
 * @returns {string} The markup.
 */
export function groundLayer(sc, g) {
	const { width: w, height: h } = sc;
	const v = sc.id('vignette');
	sc.def(
		el(
			'radialGradient',
			{ id: v, gradientUnits: 'userSpaceOnUse', cx: w / 2, cy: h * 0.46, r: Math.hypot(w, h) * 0.62 },
			el('stop', { offset: 0.45, 'stop-color': '#000', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': g.vignette }),
		),
	);
	return el('rect', { width: w, height: h, fill: g.color }) + (g.vignette ? el('rect', { width: w, height: h, fill: `url(#${v})` }) : '');
}
