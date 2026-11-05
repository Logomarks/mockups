/**
 * @module @arraypress/mockups/objects
 *
 * Every 2D object by name, so a mockup can be chosen at run time (a CMS
 * field, a query string). Each takes `{ art, ground, size, … }` and returns
 * `{ svg, width, height, object }`.
 */

import { vinyl } from './vinyl.js';
import { cd } from './cd.js';
import { cassette } from './cassette.js';
import { poster } from './poster.js';
import { card } from './card.js';
import { letterhead } from './letterhead.js';
import { ticket } from './ticket.js';
import { lanyard } from './lanyard.js';
import { wristband } from './wristband.js';
import { sticker } from './sticker.js';
import { tote } from './tote.js';
import { tee } from './tee.js';
import { hoodie } from './hoodie.js';
import { cap } from './cap.js';
import { mug } from './mug.js';
import { bag } from './bag.js';
import { box } from './box.js';
import { phone } from './phone.js';
import { laptop } from './laptop.js';
import { billboard } from './billboard.js';
import { shopfront } from './shopfront.js';
import { shelter } from './shelter.js';

/** The objects, by name. */
export const OBJECTS = Object.freeze({ vinyl, cd, cassette, poster, card, letterhead, ticket, lanyard, wristband, sticker, tote, tee, hoodie, cap, mug, bag, box, phone, laptop, billboard, shopfront, shelter });

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
