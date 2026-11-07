/**
 * @module @logomarks/mockups/plates/surface
 *
 * The shape of a screen's surface in the photo. Most signs are flat
 * rectangles, carried onto their four corners by a projective map; a round
 * label, a pin or a patch is the ellipse inscribed in those corners (a
 * circle seen in perspective); a cup's sleeve wraps round a cylinder or a
 * cone, its top and bottom edges two ellipses. Each gives the map from the
 * flat art to the photo, and the outline the art is cut to.
 */

import { quadMap } from './quad.js';

/** The surface shapes a screen can have. */
export const SCREEN_SHAPES = Object.freeze(/** @type {const} */ (['quad', 'ellipse']));

/** How much of a cylinder's front the art wraps round when no `span` is given, in degrees. */
export const DEFAULT_SPAN = 140;

/** Points sampled round an outline's curves. */
const STEPS = 48;

/**
 * A point on an ellipse seen from above or below: `theta` 0 at its front (nearest the camera), positive to the right.
 *
 * @param {readonly number[]} e The ellipse: centre x, centre y, half-width, half-height (positive when its front is lower, as seen from above).
 * @param {number} theta The angle round it, in radians.
 * @returns {[number, number]} The point.
 */
const onEllipse = ([cx, cy, rx, ry], theta) => [cx + rx * Math.sin(theta), cy + ry * Math.cos(theta)];

/**
 * A cylinder screen's corners: where its band's top and bottom edges end, at either side of the span.
 *
 * @param {import('./surface.js').Cylinder} c The cylinder.
 * @returns {[number, number][]} The corners, clockwise from the top-left.
 */
export function cylinderCorners(c) {
	const half = ((c.span ?? DEFAULT_SPAN) * Math.PI) / 360;
	return [onEllipse(c.top, -half), onEllipse(c.top, half), onEllipse(c.bottom, half), onEllipse(c.bottom, -half)];
}

/**
 * The map from the art onto a cylinder (or a cone: the top and bottom ellipses may differ): the art's x goes round
 * the span by angle, so it bunches up towards the sides as a printed sleeve does, and its y runs straight down from
 * the top edge to the bottom.
 *
 * @param {import('./surface.js').Cylinder} c The cylinder.
 * @param {number} width The art's width.
 * @param {number} height Its height.
 * @returns {(x: number, y: number) => [number, number]} Where each point of the art lands.
 */
export function cylinderMap(c, width, height) {
	const span = ((c.span ?? DEFAULT_SPAN) * Math.PI) / 180;
	return (x, y) => {
		const theta = (x / width - 0.5) * span;
		const [t, b] = [onEllipse(c.top, theta), onEllipse(c.bottom, theta)];
		const v = y / height;
		return [t[0] + (b[0] - t[0]) * v, t[1] + (b[1] - t[1]) * v];
	};
}

/**
 * A cylinder screen's true width over its height: the arc its art wraps round, over the band's height.
 *
 * @param {import('./surface.js').Cylinder} c The cylinder.
 * @returns {number} The aspect.
 */
export function cylinderAspect(c) {
	const span = ((c.span ?? DEFAULT_SPAN) * Math.PI) / 180;
	const r = (c.top[2] + c.bottom[2]) / 2;
	const h = Math.hypot(c.bottom[0] - c.top[0], c.bottom[1] - c.top[1]) || 1;
	return (r * span) / h;
}

/**
 * The map from the art onto a screen's surface.
 *
 * @param {{ corners: readonly [number, number][], cylinder?: import('./surface.js').Cylinder }} s The screen.
 * @param {number} width The art's width.
 * @param {number} height Its height.
 * @returns {(x: number, y: number) => [number, number]} Where each point of the art lands.
 */
export function surfaceMap(s, width, height) {
	return s.cylinder ? cylinderMap(s.cylinder, width, height) : quadMap(s.corners, width, height);
}

/**
 * A screen's outline in the photo, as a polygon: its corners; the ellipse inscribed in them, through the perspective;
 * or the band round a cylinder (the top edge, one side, the bottom edge back, the other side).
 *
 * @param {{ corners: readonly [number, number][], shape?: 'quad' | 'ellipse', cylinder?: import('./surface.js').Cylinder }} s The screen.
 * @returns {[number, number][]} The outline, clockwise.
 */
export function outline(s) {
	if (s.cylinder) {
		const map = cylinderMap(s.cylinder, 1, 1);
		const top = Array.from({ length: STEPS + 1 }, (_, i) => map(i / STEPS, 0));
		const bottom = Array.from({ length: STEPS + 1 }, (_, i) => map(1 - i / STEPS, 1));
		return [...top, ...bottom];
	}
	if (s.shape === 'ellipse') {
		const map = quadMap(s.corners, 2, 2);
		return Array.from({ length: STEPS * 2 }, (_, i) => {
			const a = (i / (STEPS * 2)) * Math.PI * 2 - Math.PI / 2;
			return map(1 + Math.cos(a), 1 + Math.sin(a));
		});
	}
	return s.corners.map((p) => [p[0], p[1]]);
}

/**
 * Whether a point is inside a polygon (even-odd).
 *
 * @param {readonly [number, number][]} poly The polygon.
 * @param {number} x The point's x.
 * @param {number} y Its y.
 * @returns {boolean}
 */
export function inPolygon(poly, x, y) {
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i];
		const [xj, yj] = poly[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
}

/**
 * A polygon pushed out from its centre by `m` pixels at each point, so a feathered edge still covers the sign.
 *
 * @param {readonly [number, number][]} poly The polygon.
 * @param {number} m How far.
 * @returns {[number, number][]} The grown polygon.
 */
export function spread(poly, m) {
	const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
	const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
	return poly.map(([x, y]) => {
		const d = Math.hypot(x - cx, y - cy) || 1;
		return [x + ((x - cx) / d) * m, y + ((y - cy) / d) * m];
	});
}

/**
 * A screen's size in the photo: its shortest side, in pixels (what a finish's edge is measured against).
 *
 * @param {readonly [number, number][]} corners The corners.
 * @returns {number} The length.
 */
export function shortSide(corners) {
	return Math.min(...corners.map((p, i) => Math.hypot(corners[(i + 1) % 4][0] - p[0], corners[(i + 1) % 4][1] - p[1])));
}
