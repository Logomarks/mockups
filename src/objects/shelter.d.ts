import type { Art, Mockup, Size } from '../types.js';
import type { StreetView } from './billboard.js';

/** How to show a poster in a bus shelter. */
export interface ShelterOptions {
	/** The poster (a 6-sheet, about 2:3). Required. */
	art: Art;
	/** By day (the default), or at night with the lightbox glowing. */
	time?: 'day' | 'night';
	/** `'angle'` (the default), `'front'` (square to the poster), or `{ tilt, turn }`. */
	view?: StreetView<'angle' | 'front'>;
	/** How the art fills the poster (`'cover'`). */
	fill?: 'cover' | 'contain';
	/** What shows round contained art (`'#ffffff'`). */
	background?: string;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the sun is, left (-1) to right (1) (-0.4). */
	light?: number;
	/** How much of the frame the shelter fills, 0.2–1 (0.8). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the sky and the buildings (`'shelter'`). */
	seed?: string;
}

/** The shelter and its lightbox, in metres. */
export const SHELTER: Readonly<{ length: number; depth: number; height: number; box: Readonly<{ width: number; height: number; depth: number; frame: number; foot: number }> }>;
/** The named views. */
export const SHELTER_VIEWS: Readonly<{ angle: Readonly<{ tilt: number; turn: number }>; front: Readonly<{ tilt: number; turn: number }> }>;
/** A glass bus shelter with a backlit poster at its end, by day or glowing at night. Throws a TypeError for a bad option. */
export function shelter(options: ShelterOptions): Mockup;
