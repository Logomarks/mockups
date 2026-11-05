/**
 * @module @logomarks/mockups/materials/light
 *
 * Light on the faces of things drawn in perspective: where the key light
 * is (from the `light` option every object takes), and the colour a face
 * of some material comes out under it: ambient fill, Lambert diffuse and a
 * Blinn-Phong highlight, worked in linear light so the falloff looks
 * photographic rather than flat.
 */

import { rgb, hex } from '../util/color.js';
import { unit, add, dot, sub } from '../util/vec.js';
import { clamp } from '../util/num.js';

/**
 * How a surface takes light.
 *
 * @typedef {object} Finish
 * @property {number} [ambient=0.42] How much of the fill light it shows.
 * @property {number} [diffuse=0.62] How much of the key light.
 * @property {number} [specular=0] How bright its highlight is.
 * @property {number} [shine=24] How tight the highlight is (higher is glossier).
 */

/**
 * The key light's direction, towards the light.
 *
 * @param {number} x Where it is, left (-1) to right (1).
 * @param {number} [height=1] How high it is (relative to its distance in front).
 * @returns {import('../util/vec.js').Vec3} A unit vector.
 */
export const keyLight = (x, height = 1) => unit([clamp(x, -1, 1) * 0.9, height, 0.75]);

/** sRGB (0–1) to linear light. */
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
/** Linear light to sRGB (0–1). */
const srgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/**
 * A colour under the light.
 *
 * @param {string} color The surface's colour, hex.
 * @param {import('../util/vec.js').Vec3} normal Its normal (unit).
 * @param {object} o The light.
 * @param {import('../util/vec.js').Vec3} o.light Towards the key light (unit).
 * @param {import('../util/vec.js').Vec3} o.point Where the surface is.
 * @param {import('../util/vec.js').Vec3} o.eye Where the camera is.
 * @param {Finish} [finish] How the surface takes light.
 * @returns {string} The lit colour, hex.
 */
export function lit(color, normal, { light, point, eye }, { ambient = 0.42, diffuse = 0.62, specular = 0, shine = 24 } = {}) {
	const toEye = unit(sub(eye, point));
	const d = Math.max(0, dot(normal, light));
	// a soft wrap so faces turned just away still pick up some light, as they do in a room
	const wrap = Math.max(0, (dot(normal, light) + 0.35) / 1.35) * 0.25;
	const s = specular ? specular * Math.max(0, dot(normal, unit(add(light, toEye)))) ** shine : 0;
	const k = ambient + diffuse * (d * 0.8 + wrap);
	return hex(rgb(color).map((v) => srgb(clamp(lin(v / 255) * k + s)) * 255));
}
