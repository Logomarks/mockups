/**
 * @module @arraypress/mockups/parts/pole
 *
 * A round post in perspective (a billboard's mast, a shelter's legs): the
 * strip between its silhouette lines, shaded across like a cylinder (dark
 * at the far edge, lit on the light's side with a narrow highlight).
 */

import { el } from '../render/svg.js';
import { polyPath } from '../util/shape.js';
import { lit } from '../materials/light.js';
import { add, scale, sub, unit, cross } from '../util/vec.js';

/**
 * A post.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('../util/camera.js').View} view The view.
 * @param {object} o The post.
 * @param {import('../util/vec.js').Vec3} o.from Its foot.
 * @param {import('../util/vec.js').Vec3} o.to Its head.
 * @param {number} o.radius Its radius.
 * @param {string} o.color Its colour.
 * @param {import('../util/vec.js').Vec3} o.light Towards the key light.
 * @param {import('../materials/light.js').Finish} [o.finish] How it takes light.
 * @returns {string} The markup.
 */
export function pole(sc, view, { from, to, radius, color, light, finish = { specular: 0.35, shine: 20 } }) {
	const axis = unit(sub(to, from));
	const mid = scale(add(from, to), 0.5);
	const toEye = unit(sub(view.cam.eye, mid));
	// across the post, square to the line of sight
	const side = unit(cross(axis, toEye));
	const front = unit(cross(side, axis));
	const pts = [add(from, scale(side, -radius)), add(to, scale(side, -radius)), add(to, scale(side, radius)), add(from, scale(side, radius))].map((p) => view.at(p));
	const g = sc.id('pole');
	const [a, b] = [view.at(add(mid, scale(side, -radius))), view.at(add(mid, scale(side, radius)))];
	const stops = [-1, -0.6, -0.2, 0.2, 0.6, 1].map((t) => {
		const nrm = unit(add(scale(side, t), scale(front, Math.sqrt(Math.max(0, 1 - t * t)))));
		return el('stop', { offset: (t + 1) / 2, 'stop-color': lit(color, nrm, { light, point: mid, eye: view.cam.eye }, finish) });
	});
	sc.def(el('linearGradient', { id: g, gradientUnits: 'userSpaceOnUse', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, ...stops));
	return el('path', { d: polyPath(pts), fill: `url(#${g})` });
}
