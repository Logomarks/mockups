/**
 * @module @logomarks/mockups/util/camera
 *
 * A pinhole camera for the objects drawn in perspective. It orbits a
 * target (turned about the vertical, raised above the horizon, at a
 * distance, with a field of view), projects world points to the picture,
 * and is then framed: scaled and centred so a set of points fills the
 * frame. Projecting a plane through it is a true projective transform, so
 * angled screens and signs keep their perspective.
 */

import { sub, dot, cross, unit, add, scale } from './vec.js';

/**
 * Where a camera is and what it looks at.
 *
 * @typedef {object} Orbit
 * @property {import('./vec.js').Vec3} [target] The point it looks at (the origin).
 * @property {number} [turn=0] Degrees about the vertical; positive moves the camera to the right of the front (+z).
 * @property {number} [pitch=0] Degrees above the horizon; 90 looks straight down.
 * @property {number} [distance=10] How far the camera is from the target.
 * @property {number} [fov=30] The vertical field of view in degrees (smaller is flatter, like a long lens).
 */

/**
 * A camera.
 *
 * @param {Orbit} o Where it is.
 * @returns {import('./camera.js').Camera} The camera, projecting to unit image coordinates (y down).
 */
export function camera({ target = [0, 0, 0], turn = 0, pitch = 0, distance = 10, fov = 30 } = {}) {
	const t = (turn * Math.PI) / 180;
	const p = (pitch * Math.PI) / 180;
	const eye = add(target, scale([Math.sin(t) * Math.cos(p), Math.sin(p), Math.cos(t) * Math.cos(p)], distance));
	const forward = unit(sub(target, eye));
	// right comes from the turn alone, so straight down is as well defined as straight on
	const right = /** @type {import('./vec.js').Vec3} */ ([Math.cos(t), 0, -Math.sin(t)]);
	const up = cross(right, forward);
	const f = 1 / Math.tan((fov * Math.PI) / 360);
	return {
		eye,
		forward,
		right,
		up,
		project(q) {
			const d = sub(q, eye);
			const z = Math.max(1e-6, dot(d, forward));
			return [(dot(d, right) / z) * f, (-dot(d, up) / z) * f, z];
		},
	};
}

/**
 * A camera framed: its picture scaled and centred so some points fill the frame.
 *
 * @param {import('./camera.js').Camera} cam The camera.
 * @param {object} o The frame.
 * @param {number} o.width Its width in pixels.
 * @param {number} o.height Its height in pixels.
 * @param {import('./vec.js').Vec3[]} o.points What has to fit (an object's corners).
 * @param {number} [o.fit=0.8] How much of the frame they fill, by the tighter side.
 * @param {[number, number]} [o.shift] Where their centre goes, as a fraction of the frame from its middle (`[0, 0]`).
 * @returns {import('./camera.js').View} The view: points to pixels.
 */
export function frame(cam, { width, height, points, fit = 0.8, shift = [0, 0] }) {
	const pr = points.map((q) => cam.project(q));
	const xs = pr.map((q) => q[0]);
	const ys = pr.map((q) => q[1]);
	const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
	const k = Math.min((width * fit) / Math.max(1e-9, x1 - x0), (height * fit) / Math.max(1e-9, y1 - y0));
	const ox = width * (0.5 + shift[0]) - ((x0 + x1) / 2) * k;
	const oy = height * (0.5 + shift[1]) - ((y0 + y1) / 2) * k;
	return {
		cam,
		width,
		height,
		scale: k,
		at(q) {
			const [x, y] = cam.project(q);
			return [x * k + ox, y * k + oy];
		},
		depth: (q) => dot(sub(q, cam.eye), cam.forward),
		faces: (q, normal) => dot(normal, sub(cam.eye, q)) > 0,
	};
}

/**
 * A flat surface's points in pixels: `(x, y)` along two axes from an origin.
 *
 * @param {import('./camera.js').View} view The view.
 * @param {import('./vec.js').Vec3} o The surface's origin (its drawing's top-left).
 * @param {import('./vec.js').Vec3} u World units per unit across the drawing.
 * @param {import('./vec.js').Vec3} v World units per unit down it.
 * @returns {(x: number, y: number) => [number, number]} Drawing units to pixels: a projective map.
 */
export const onPlane = (view, o, u, v) => (x, y) => view.at([o[0] + u[0] * x + v[0] * y, o[1] + u[1] * x + v[1] * y, o[2] + u[2] * x + v[2] * y]);

/**
 * Where the horizon is: how far down the frame the vanishing line of level ground falls.
 *
 * @param {import('./camera.js').View} view The view.
 * @returns {number} Its height in pixels from the top (it may be off the frame).
 */
export function horizon(view) {
	const { eye, forward } = view.cam;
	const f = Math.hypot(forward[0], forward[2]) || 1;
	return view.at([eye[0] + (forward[0] / f) * 1e6, eye[1], eye[2] + (forward[2] / f) * 1e6])[1];
}

/**
 * A polygon cut where it passes too close to (or behind) the camera, so it can be projected.
 *
 * @param {import('./camera.js').View} view The view.
 * @param {readonly import('./vec.js').Vec3[]} poly The polygon (convex or not), in world space.
 * @param {number} near How far in front of the camera to cut.
 * @returns {import('./vec.js').Vec3[]} The part in front of the cut.
 */
export function clipNear(view, poly, near) {
	/** @type {import('./vec.js').Vec3[]} */
	const out = [];
	for (let i = 0; i < poly.length; i++) {
		const a = poly[i];
		const b = poly[(i + 1) % poly.length];
		const da = view.depth(a) - near;
		const db = view.depth(b) - near;
		if (da >= 0) out.push(a);
		if (da >= 0 !== db >= 0) {
			const t = da / (da - db);
			out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
		}
	}
	return out;
}

/**
 * How much of a level line a view sees: the stretch of `x` (at a height and depth) in front of the camera and within the frame (with a margin).
 *
 * @param {import('./camera.js').View} view The view.
 * @param {number} y The line's height.
 * @param {number} z Its depth.
 * @param {[number, number]} range The most it could run, along x.
 * @param {number} [margin=0.25] How far past the frame's sides to keep, as a fraction of its width.
 * @returns {[number, number]} The part seen (the whole range when none of it is).
 */
export function seen(view, y, z, range, margin = 0.25) {
	const steps = 200;
	let [lo, hi] = [Infinity, -Infinity];
	for (let i = 0; i <= steps; i++) {
		const x = range[0] + ((range[1] - range[0]) * i) / steps;
		if (view.depth([x, y, z]) < 1) continue;
		const px = view.at([x, y, z])[0];
		if (px < -margin * view.width || px > (1 + margin) * view.width) continue;
		lo = Math.min(lo, x);
		hi = Math.max(hi, x);
	}
	const step = (range[1] - range[0]) / steps;
	return lo > hi ? range : [Math.max(range[0], lo - step), Math.min(range[1], hi + step)];
}
