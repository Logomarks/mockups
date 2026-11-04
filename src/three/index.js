/**
 * @module @arraypress/mockups/3d
 *
 * The objects in 3D with three.js (a peer dependency, imported only when
 * a scene is made). Each scene is drawn once and then on demand:
 * `setView` moves the camera and re-renders, `toBlob` reads the frame.
 */

export { vinylScene } from './vinyl.js';
export { cardScene } from './card.js';
export { boxScene } from './box.js';
export { mugScene } from './mug.js';
export { cdScene } from './cd.js';
