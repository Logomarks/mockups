import type { Art } from '../types.js';
import type { Scene, PlaceArt } from '../render/scene.js';

/** How to place a print file so its trim (mm) fills a box, its bleed (mm per side, 0) falling outside it. */
export function trimmed(sc: Scene, art: Art, o: { trim: [number, number]; bleed?: number }): PlaceArt;
