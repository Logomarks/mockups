/**
 * @module @logomarks/mockups/materials/body
 *
 * What a device's shell is made of: anodised graphite, bead-blasted
 * silver, a soft white, or any colour (taken as painted metal). Each is a
 * colour and how it takes light: metals throw a bright, fairly tight
 * highlight; white is satin.
 */

import { isHex } from '../util/color.js';

/** The named shells: colour and finish. */
export const BODIES = Object.freeze({
	graphite: Object.freeze({ color: '#3a3c40', finish: Object.freeze({ ambient: 0.5, diffuse: 0.55, specular: 0.55, shine: 18 }) }),
	silver: Object.freeze({ color: '#c3c6cb', finish: Object.freeze({ ambient: 0.48, diffuse: 0.55, specular: 0.45, shine: 14 }) }),
	white: Object.freeze({ color: '#e9e7e2', finish: Object.freeze({ ambient: 0.55, diffuse: 0.5, specular: 0.18, shine: 10 }) }),
	black: Object.freeze({ color: '#1c1d20', finish: Object.freeze({ ambient: 0.55, diffuse: 0.5, specular: 0.4, shine: 22 }) }),
});

/**
 * A shell from its option.
 *
 * @param {unknown} v A name or a hex colour.
 * @param {string} [object='finish'] The object's name, for the error.
 * @returns {{ color: string, finish: import('./light.js').Finish }} Its colour and finish.
 * @throws {TypeError} For anything else.
 */
export function resolveBody(v, object = 'finish') {
	if (typeof v === 'string' && Object.hasOwn(BODIES, v)) return BODIES[/** @type {keyof typeof BODIES} */ (v)];
	if (isHex(v)) return { color: /** @type {string} */ (v), finish: BODIES.graphite.finish };
	throw new TypeError(`${object}: finish is ${Object.keys(BODIES).map((s) => `'${s}'`).join(', ')} or a hex colour (got ${JSON.stringify(v)})`);
}
