import type { Art, Mockup, Size } from '../types.js';
import type { StreetView } from './billboard.js';

/** How to show a brand on a shopfront. */
export interface ShopfrontOptions {
	/** The brand's mark (an SVG drawn in `currentColor` takes `ink`). Required. */
	art: Art;
	/** The brand's name, lettered on the fascia. Required. */
	name: string;
	/** The fascia's and blade sign's colour (`'#22392f'`). */
	color?: string;
	/** The lettering's colour (`'#f4efe4'`). */
	ink?: string;
	/** The pilasters', frames' and stallriser's paint (`'#2a2e33'`). */
	joinery?: string;
	/** The bricks' colour (`'#9b5b45'`). */
	brick?: string;
	/** Whether a blade sign projects from the wall (true). */
	blade?: boolean;
	/** `'front'` (the default; a little from the left, so the blade shows), `'angle'`, or `{ tilt, turn }`. */
	view?: StreetView<'front' | 'angle'>;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the sun is, left (-1) to right (1) (-0.45). */
	light?: number;
	/** How much of the frame the shop fills, 0.2–1 (0.84). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the bricks and clouds (`'shopfront'`). */
	seed?: string;
}

/** The blade sign in metres. */
export const BLADE: Readonly<{ size: number; out: number; height: number; bracket: number }>;
/** The named views. */
export const SHOPFRONT_VIEWS: Readonly<{ front: Readonly<{ tilt: number; turn: number }>; angle: Readonly<{ tilt: number; turn: number }> }>;
/** A shopfront in a brick building: the fascia with the mark and name, a window and door, a blade sign. Throws a TypeError for a bad option. */
export function shopfront(options: ShopfrontOptions): Mockup;
