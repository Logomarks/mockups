/**
 * @module @logomarks/mockups/util/vec
 *
 * Three-vectors as plain arrays, for the objects drawn in perspective:
 * adding, scaling, dot and cross products, length and direction. World
 * space is x right, y up, z towards the front.
 */

/**
 * A 3-vector.
 *
 * @typedef {[number, number, number]} Vec3
 */

/**
 * The sum of two vectors.
 *
 * @param {Vec3} a One.
 * @param {Vec3} b The other.
 * @returns {Vec3} `a + b`.
 */
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/**
 * The difference of two vectors.
 *
 * @param {Vec3} a One.
 * @param {Vec3} b The one taken away.
 * @returns {Vec3} `a - b`.
 */
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/**
 * A vector scaled.
 *
 * @param {Vec3} a The vector.
 * @param {number} k The factor.
 * @returns {Vec3} `k a`.
 */
export const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

/**
 * A point along a frame: `o + s u + t v (+ w n)`.
 *
 * @param {Vec3} o The origin.
 * @param {Vec3} u The first axis.
 * @param {number} s How far along it.
 * @param {Vec3} v The second axis.
 * @param {number} t How far along it.
 * @param {Vec3} [w] A third axis.
 * @param {number} [r=0] How far along it.
 * @returns {Vec3} The point.
 */
export const along = (o, u, s, v, t, w, r = 0) => [
	o[0] + u[0] * s + v[0] * t + (w ? w[0] * r : 0),
	o[1] + u[1] * s + v[1] * t + (w ? w[1] * r : 0),
	o[2] + u[2] * s + v[2] * t + (w ? w[2] * r : 0),
];

/**
 * The dot product.
 *
 * @param {Vec3} a One.
 * @param {Vec3} b The other.
 * @returns {number} `a · b`.
 */
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * The cross product.
 *
 * @param {Vec3} a One.
 * @param {Vec3} b The other.
 * @returns {Vec3} `a × b`.
 */
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/**
 * A vector's length.
 *
 * @param {Vec3} a The vector.
 * @returns {number} `|a|`.
 */
export const len = (a) => Math.hypot(a[0], a[1], a[2]);

/**
 * A vector's direction.
 *
 * @param {Vec3} a The vector.
 * @returns {Vec3} `a / |a|` (the zero vector stays zero).
 */
export const unit = (a) => {
	const l = len(a) || 1;
	return [a[0] / l, a[1] / l, a[2] / l];
};

/**
 * A vector turned about the vertical (y) axis.
 *
 * @param {Vec3} a The vector.
 * @param {number} deg The angle in degrees; positive turns +x towards -z.
 * @returns {Vec3} The turned vector.
 */
export const yaw = (a, deg) => {
	const t = (deg * Math.PI) / 180;
	const c = Math.cos(t);
	const s = Math.sin(t);
	return [a[0] * c + a[2] * s, a[1], -a[0] * s + a[2] * c];
};
