/**
 * @module @logomarks/mockups/materials/night
 *
 * Night, done the way a photo grades it: everything lit by daylight is
 * pulled down to a deep blue (a veil over the frame), and what makes its
 * own light (a backlit poster, a lamp) is drawn after it, at full
 * strength, with a glow: a blurred copy of a large shape, or a radial fade
 * round a small one.
 */

import { el } from '../render/svg.js';

/**
 * The night veil over everything drawn so far.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {number} [depth=0.72] How dark, 0–1.
 * @returns {string} The markup.
 */
export const nightVeil = (sc, depth = 0.72) => el('rect', { width: sc.width, height: sc.height, fill: '#060b1c', opacity: depth });

/**
 * A glow round a large light source (a lightbox): blurred copies of its shape.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} shape The source's shape (markup, filled).
 * @param {number} radius How far it spills, in pixels.
 * @param {number} [strength=1] How bright.
 * @returns {string} The markup, to draw before the source.
 */
export const glow = (sc, shape, radius, strength = 1) =>
	el('g', { filter: sc.blur(radius), opacity: Math.min(1, 0.55 * strength) }, shape) + el('g', { filter: sc.blur(radius * 0.3), opacity: Math.min(1, 0.45 * strength) }, shape);

/**
 * A small light (a lamp): a bright core in a radial halo.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {number} x Where it is, x.
 * @param {number} y Where it is, y.
 * @param {number} r The halo's radius, in pixels.
 * @param {string} [color='#ffe2b0'] Its colour.
 * @returns {string} The markup.
 */
export function lamp(sc, x, y, r, color = '#ffe2b0') {
	const g = sc.id('halo');
	sc.def(el('radialGradient', { id: g }, el('stop', { offset: 0, 'stop-color': color, 'stop-opacity': 0.9 }), el('stop', { offset: 0.25, 'stop-color': color, 'stop-opacity': 0.35 }), el('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 })));
	return el('circle', { cx: x, cy: y, r, fill: `url(#${g})` }) + el('circle', { cx: x, cy: y, r: r * 0.12, fill: '#fffaf0' });
}
