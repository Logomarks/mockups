/**
 * @module @logomarks/mockups/3d
 *
 * The objects in 3D with three.js (a peer dependency, imported only when
 * a scene is made). Each scene is drawn once and then on demand:
 * `setView` moves the camera and re-renders, `toBlob` reads the frame. A
 * scene that moves (a drifting camera, a TV's live screen) draws its
 * frames while it's on screen, and none with reduced motion. The scenes
 * that set their own stage (a street, a hall, a station, a café table)
 * are shot through a lens: frames averaged for depth of field.
 */

export { vinylScene, VINYL_SCENE_LAYOUTS } from './vinyl.js';
export { cardScene } from './card.js';
export { boxScene } from './box.js';
export { mugScene } from './mug.js';
export { cdScene } from './cd.js';
export { tvScene, TV_KINDS, CABINETS } from './tv.js';

// reflections and screens
export { sunglassesScene, SUNGLASS_FRAMES, SUNGLASS_LENSES } from './sunglasses.js';
export { phoneScene, PHONE_SCENE_LAYOUTS, PHONE_SCREENS } from './phone.js';
export { laptopScene, LAPTOP_SCREENS } from './laptop.js';
export { keynoteScene, KEYNOTE_SCREENS } from './keynote.js';

// signs
export { lightboxScene, STATION_WALLS } from './lightbox.js';
export { neonScene, NEON_COLORS } from './neon.js';
export { windowScene, WINDOW_VINYLS } from './window.js';
export { billboardScene, HEDGES } from './billboard.js';
export { STREET_TIMES } from './streetenv.js';

// print in the studio
export { binderScene } from './binder.js';
export { bookScene } from './book.js';
export { stationeryScene } from './stationery.js';

// the restaurant
export { menuScene, MENU_LAYOUTS } from './menu.js';
export { receiptScene } from './receipt.js';
export { cupScene, CUP_LIDS } from './cup.js';
export { takeawayScene } from './takeaway.js';
export { pizzaScene } from './pizza.js';
export { chopsticksScene, CHOPSTICK_LAYOUTS } from './chopsticks.js';
export { napkinScene, NAPKIN_COLORS, NAPKIN_PRINTS } from './napkin.js';

export { LENS_SAMPLES } from './lens.js';
