/**
 * @module @logomarks/mockups/parts/axo
 *
 * An axonometric view for boxy things (a bag, a carton): the object turned
 * about the vertical and seen from a little above, with no perspective, so
 * every flat face is an affine image of itself and its print maps onto it
 * exactly with one SVG matrix. World units are millimetres: x to the right
 * along the front, y up, z towards the camera (the back is at -depth).
 */

import { n } from '../util/num.js';

/**
 * A view.
 *
 * @param {{ turn: number, elevation: number, mm?: number, origin?: [number, number] }} o How far the object is turned (degrees; positive shows its right side), how far above it the camera is (degrees), pixels per mm (1), and where the world origin lands in pixels (0, 0).
 * @returns {import('./axo.js').Axo} The projection.
 */
export function axo({ turn, elevation, mm = 1, origin = [0, 0] }) {
	const a = (turn * Math.PI) / 180;
	const e = (elevation * Math.PI) / 180;
	const ca = Math.cos(a);
	const sa = Math.sin(a);
	const ce = Math.cos(e);
	const se = Math.sin(e);
	// a direction's image, in pixels: nearer points (front right) fall lower
	const lin = (x, y, z) => [(x * ca - z * sa) * mm, (-y * ce + (x * sa + z * ca) * se) * mm];
	const at = (x, y, z) => {
		const [X, Y] = lin(x, y, z);
		return /** @type {[number, number]} */ ([origin[0] + X, origin[1] + Y]);
	};
	return {
		mm,
		at,
		lin,
		matrix(o, u, v) {
			const [ex, ey] = at(...o);
			const [ax, ay] = lin(...u);
			const [cx, cy] = lin(...v);
			return `matrix(${[ax, ay, cx, cy, ex, ey].map(n).join(' ')})`;
		},
		path(points, close = true) {
			return points.map((p, i) => `${i ? 'L' : 'M'}${n(at(...p)[0])} ${n(at(...p)[1])}`).join('') + (close ? 'Z' : '');
		},
		facing(normal) {
			// how much a face turns towards the camera (1 head on), from its outward normal
			return normal[0] * sa * ce + normal[1] * se + normal[2] * ca * ce;
		},
	};
}
