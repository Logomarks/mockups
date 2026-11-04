/**
 * @module @arraypress/mockups
 *
 * Product mockups from finished artwork: the design shown on the object
 * it's printed on. Each object returns a layered SVG with the artwork
 * embedded, dependency-free; rasterise it with `./node` (sharp) or
 * `./browser` (a canvas). The three.js scenes are in `./3d`.
 */

export { vinyl, RECORD } from './objects/vinyl.js';
export { OBJECTS, mockup } from './objects/index.js';
export { GROUNDS } from './materials/ground.js';
export { FINISHES } from './materials/vinyl.js';
export { artHref } from './render/art.js';
