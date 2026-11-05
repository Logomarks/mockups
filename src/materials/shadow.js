/**
 * @module @logomarks/mockups/materials/shadow
 *
 * Soft shadows, as a photo has them: each object casts a tight contact
 * shadow and a wide ambient one (its own silhouette, offset away from the
 * light and blurred), and a flattened pool on the floor under its bottom
 * edge. A translucent object passes a shape with the parts that stop
 * light (a clear record's rim and label) solid and the rest faint.
 */

import { el } from '../render/svg.js';
import { n } from '../util/num.js';

/**
 * How shadows fall in a mockup.
 *
 * @typedef {object} Light
 * @property {number} x Where the light is, left (-1) to right (1); shadows fall the other way.
 * @property {number} strength How dark shadows are (1 is natural).
 * @property {number} unit The scale shadows are measured in (the sleeve's side, in pixels).
 */

/**
 * The shadows an object casts on what's behind it and on the floor.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {Light} light The light.
 * @param {object} o The object.
 * @param {(fill: string) => string} o.shape Its silhouette, filled with the colour given.
 * @param {{ x: number, bottom: number, width: number } | null} o.foot Where it stands on the floor: its centre, bottom edge and width; `null` when it lies flat (no pool).
 * @param {number} [o.lift=1] How far it stands off what's behind it, relative to a record on the ground: smaller is a tighter, fainter shadow (a sleeve lying on its records is about 0.3).
 * @returns {string} The shadow layers, to draw just before the object.
 */
export function castShadow(sc, light, { shape, foot, lift = 1 }) {
	const u = light.unit;
	const k = light.strength * Math.min(1, lift) ** 0.75;
	if (k <= 0) return '';
	const away = -light.x;
	const t = Math.max(0.05, lift);
	const layer = (dx, dy, sigma, alpha) =>
		el('g', { filter: sc.blur(sigma * u * t), opacity: Math.min(1, alpha * k) }, el('g', { transform: `translate(${n(dx * u * t)} ${n(dy * u * t)})` }, shape('#000')));
	const contact = layer(away * 0.02, 0.025, 0.03, 0.075) + layer(away * 0.005, 0.006, 0.007, 0.13);
	if (!foot) return contact;
	// the pool on the floor: under the bottom edge, stretched away from the light
	const floor = el('ellipse', {
		cx: foot.x + away * foot.width * 0.4,
		cy: foot.bottom - 0.004 * u,
		rx: foot.width * 0.5,
		ry: 0.018 * u,
		fill: '#000',
		filter: sc.blur(0.026 * u),
		opacity: Math.min(1, 0.11 * k),
	});
	return contact + floor;
}
