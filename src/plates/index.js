/**
 * @module @logomarks/mockups/plates
 *
 * Photo plates: real photos with screens in them, and the compositor that
 * puts art into those screens as if it had been printed there. Loading a
 * plate (and making one) is the runtime's: `loadPlate` and `makePlate` come
 * from `./node`, `loadPlate` from `./browser`.
 */

export { plate } from './compose.js';
export { PLATE_KINDS, KIND_LOOKS, checkPlate } from './format.js';
export { quadMap } from './quad.js';
