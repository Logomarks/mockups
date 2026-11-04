import type { Art } from '../types.js';
import type { Scene } from './scene.js';

/** How art fills a box: `cover` (crop evenly), `contain` (all of it, centred), `top` (fill the width, crop from the bottom). */
export type Fit = 'cover' | 'contain' | 'top';

/** The fits. */
export const FITS: readonly Fit[];
/** Art in a box, embedded once at its own aspect. `top` can spill below the box; clip it there. Throws a TypeError for an unknown fit. */
export function fitArt(sc: Scene, art: Art, box: { x: number; y: number; width: number; height: number }, fit?: Fit): string;
