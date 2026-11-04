/**
 * @module @arraypress/mockups/parts/slab
 *
 * A rounded slab in perspective: the shape of a phone, a laptop's lid and
 * base, a sign's box. Its outline is a rounded rectangle on a face,
 * extruded back by its depth. The sides are drawn as a band of facets,
 * each lit for the way it faces (so a metal edge catches the light where
 * it turns towards it), with a fine bevel highlight along the front edge.
 * The front face is left to the caller, who gets its outline and a map
 * from its own units to pixels.
 */

import { el } from '../render/svg.js';
import { along, scale, add } from '../util/vec.js';
import { roundRect, polyPath } from '../util/shape.js';
import { lit } from '../materials/light.js';
import { n } from '../util/num.js';

/** A rounded side: a band leaning to the front, a flat middle, a band leaning back. */
export const ROUNDED = Object.freeze([Object.freeze([0, 0.22, 50]), Object.freeze([0.22, 0.42, 22]), Object.freeze([0.42, 0.62, 0]), Object.freeze([0.62, 0.8, -25]), Object.freeze([0.8, 1, -55])]);

/**
 * Where a slab is: the centre of its front face and its axes (unit vectors).
 *
 * @typedef {object} Frame
 * @property {import('../util/vec.js').Vec3} o The front face's centre.
 * @property {import('../util/vec.js').Vec3} u Across the face, left to right.
 * @property {import('../util/vec.js').Vec3} v Down the face, top to bottom.
 * @property {import('../util/vec.js').Vec3} n Out of the face (towards the front).
 */

/**
 * A slab.
 *
 * @param {import('../util/camera.js').View} view The view.
 * @param {object} o The slab.
 * @param {Frame} o.frame Where it is.
 * @param {number} o.width Its width.
 * @param {number} o.height Its height.
 * @param {number} o.radius Its corners' radius.
 * @param {number} o.depth How far back it goes.
 * @param {string} o.color Its sides' colour.
 * @param {import('../materials/light.js').Finish} [o.finish] How its sides take light.
 * @param {import('../util/vec.js').Vec3} o.light Towards the key light.
 * @param {number} [o.bevel=1] How wide the front edge's highlight is, in pixels (0 for none).
 * @param {readonly (readonly [number, number, number])[]} [o.profile] The side's cross-section, front to back: bands of `[from, to, tilt]`, the depth's fractions and how far each band's normal leans towards the front (degrees). A rounded edge by default; `[[0, 1, 0]]` for a flat one.
 * @returns {import('./slab.js').Slab} Its sides, and its faces' outlines and maps.
 */
export function slab(view, { frame, width: w, height: h, radius, depth, color, finish, light, bevel = 1, profile = ROUNDED }) {
	const { o, u, v, n: nrm } = frame;
	const local = roundRect(-w / 2, -h / 2, w, h, radius, Math.max(3, Math.round(Math.min(10, radius * 40 / Math.max(w, h) + 4))));
	const back = add(o, scale(nrm, -depth));
	const at = (base, p) => view.at(along(base, u, p[0], v, p[1]));
	const front2 = local.map((p) => at(o, p));
	const back2 = local.map((p) => at(back, p));
	const eye = view.cam.eye;
	let sides = '';
	let edge = '';
	for (let i = 0; i < local.length; i++) {
		const a = local[i];
		const b = local[(i + 1) % local.length];
		// the outward normal of this facet, in the face's plane
		const ex = b[0] - a[0];
		const ey = b[1] - a[1];
		const l = Math.hypot(ex, ey) || 1;
		const out = along([0, 0, 0], u, ey / l, v, -ex / l);
		const j = (i + 1) % local.length;
		for (const [f0, f1, tilt] of profile) {
			const t = (tilt * Math.PI) / 180;
			const normal = add(scale(out, Math.cos(t)), scale(nrm, Math.sin(t)));
			const mid = along(add(o, scale(nrm, (-depth * (f0 + f1)) / 2)), u, (a[0] + b[0]) / 2, v, (a[1] + b[1]) / 2);
			if (!view.faces(mid, normal)) continue;
			const fill = lit(color, normal, { light, point: mid, eye }, finish);
			const p0 = add(o, scale(nrm, -depth * f0));
			const p1 = add(o, scale(nrm, -depth * f1));
			sides += el('path', { d: polyPath([at(p0, a), at(p0, b), at(p1, b), at(p1, a)]), fill, stroke: fill, 'stroke-width': 0.6, 'stroke-linejoin': 'round' });
		}
		// the bevel: a hairline where the front turns into the side, leaning half way between them
		const tip = add(scale(out, 0.7), scale(nrm, 0.7));
		const mid = along(o, u, (a[0] + b[0]) / 2, v, (a[1] + b[1]) / 2);
		if (bevel > 0 && view.faces(mid, tip)) {
			const glint = lit(color, tip, { light, point: mid, eye }, { ambient: 0.5, diffuse: 0.8, specular: 0.6, shine: 14 });
			edge += el('line', { x1: n(front2[i][0]), y1: n(front2[i][1]), x2: n(front2[j][0]), y2: n(front2[j][1]), stroke: glint, 'stroke-width': bevel, 'stroke-linecap': 'round' });
		}
	}
	const frontFaces = view.faces(o, nrm);
	return {
		sides,
		edge,
		front: front2,
		back: back2,
		frontFaces,
		path: polyPath(frontFaces ? front2 : back2),
		map: (x, y) => at(o, [x - w / 2, y - h / 2]),
		backMap: (x, y) => at(back, [x - w / 2, y - h / 2]),
		outline: (inset, r) => roundRect(-w / 2 + inset, -h / 2 + inset, w - 2 * inset, h - 2 * inset, r, 8).map((p) => at(o, p)),
	};
}
