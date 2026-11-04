import type { Art, Mockup } from '../types.js';
import type { Plate } from './format.js';

/** How to show art in a plate. */
export interface PlateOptions {
	/** The art: one for every screen, or one per screen (repeated when short). Required. */
	art: Art | Art[];
	/** How the art fills each sign: `'cover'` (the default, cropped evenly), `'contain'` (whole), or `'top'` (filling the width, cropped from the bottom: a web page on a display). */
	fit?: 'cover' | 'contain' | 'top';
	/** What shows round contained art (`'#ffffff'`). */
	background?: string;
	/** The grain over the art, as a multiple of the photo's own, 0–3 (1). */
	grain?: number;
	/** A lightbox's glow, 0–1 (the plate's). */
	glow?: number;
	/** Seeds the grain (the plate's name). */
	seed?: string;
}

/** Art composited into a loaded plate's screens, at the photo's size. Throws a TypeError for a bad plate or option. */
export function plate(plate: Plate, options: PlateOptions): Mockup;
