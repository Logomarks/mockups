/**
 * @module @arraypress/mockups/parts/tabletop
 *
 * The surface a standing object (a mug, a bag, a box) stands on, seen from
 * a little above: the desk's texture foreshortened (squashed up the frame,
 * as a table top recedes), and the soft shadows an upright object leaves on
 * it: a dark contact line round its foot, and a wider pool falling away
 * from the light.
 */

import { el } from '../render/svg.js';
import { surfaceLayer } from '../materials/desk.js';
import { clamp, n } from '../util/num.js';

/**
 * The surface, foreshortened, filling the frame.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('../materials/desk.js').Surface} surf The surface.
 * @param {{ light: number, seed: string, mm: number, squash?: number }} o Where the light is, the seed, pixels per millimetre (at the object), and how much the top recedes (0.45: depth shows at 0.45 of its width).
 * @returns {string} The markup.
 */
export function tabletop(sc, surf, { light, seed, mm, squash = 0.45 }) {
	const k = clamp(squash, 0.1, 1);
	// the surface drawn into a taller frame, then squashed into this one
	const tall = { ...sc, height: sc.height / k };
	return el('g', { transform: `scale(1 ${n(k)})` }, surfaceLayer(tall, surf, { light, seed, mm }));
}

/**
 * The shadows an upright object leaves on the surface round its foot (an ellipse, as a round or square foot reads from a little above).
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The foot.
 * @param {number} o.cx Its centre, x.
 * @param {number} o.cy Its centre, y.
 * @param {number} o.rx Its half-width.
 * @param {number} o.ry Its half-depth (as seen).
 * @param {number} o.mm Pixels per millimetre.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} [o.strength=1] How dark.
 * @param {number} [o.height=100] How tall the object is, in mm (a taller one throws a longer pool).
 * @returns {string} The layers.
 */
export function footShadow(sc, { cx, cy, rx, ry, mm, light, strength = 1, height = 100 }) {
	if (strength <= 0) return '';
	const away = -clamp(light, -1, 1);
	const reach = height * 0.18 * mm;
	const e = (dx, dy, sx, sy, sigma, alpha) =>
		el('ellipse', { cx: cx + dx, cy: cy + dy, rx: rx * sx, ry: ry * sy, fill: '#000', opacity: clamp(alpha * strength), filter: sc.blur(Math.max(0.5, sigma)) });
	return (
		e(away * reach * 0.9, -ry * 0.1, 1.15 + 0.25 * Math.abs(away), 1.5, reach * 0.45, 0.16) +
		e(away * reach * 0.15, ry * 0.05, 1.04, 1.1, 2.2 * mm, 0.32) +
		e(0, ry * 0.08, 0.99, 0.95, 0.6 * mm, 0.55)
	);
}
