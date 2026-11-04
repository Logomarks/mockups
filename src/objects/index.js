/**
 * @module @arraypress/mockups/objects
 *
 * Every 2D object by name, so a mockup can be chosen at run time (a CMS
 * field, a query string). Each takes `{ art, ground, size, … }` and returns
 * `{ svg, width, height, object }`.
 */

import { vinyl } from './vinyl.js';

/** The objects, by name. */
export const OBJECTS = Object.freeze({ vinyl });

/**
 * A mockup by the object's name.
 *
 * @param {keyof typeof OBJECTS} name The object (`'vinyl'`).
 * @param {import('./vinyl.js').VinylOptions} options Its options.
 * @returns {import('../types.js').Mockup} The mockup.
 * @throws {TypeError} When there's no object by that name.
 */
export function mockup(name, options) {
	if (!Object.hasOwn(OBJECTS, name)) throw new TypeError(`No object "${name}" (there are ${Object.keys(OBJECTS).join(', ')})`);
	return OBJECTS[name](options);
}
