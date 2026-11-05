/**
 * @module @logomarks/mockups/3d
 *
 * The objects in 3D with three.js (a peer dependency, imported only when
 * a scene is made). Each scene is drawn once and then on demand:
 * `setView` moves the camera and re-renders, `toBlob` reads the frame. A
 * scene that moves (a drifting camera, a TV's live screen) draws its
 * frames while it's on screen, and none with reduced motion.
 */

export { vinylScene, VINYL_SCENE_LAYOUTS } from './vinyl.js';
export { cardScene } from './card.js';
export { boxScene } from './box.js';
export { mugScene } from './mug.js';
export { cdScene } from './cd.js';
export { tvScene, TV_KINDS, CABINETS } from './tv.js';
