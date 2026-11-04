import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';

/** How the mugs are shown. */
export type MugLayout = 'single' | 'pair';

/** How to show a mug. */
export interface MugOptions {
	/** The print: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** A second print on the back, half way round (shown by the second mug of a pair). */
	back?: Art;
	/** `'single'` (one mug) or `'pair'` (two, handles outwards: the front, and the back). */
	layout?: MugLayout;
	/** `'front'` (the art centred on the front; the default) or `'wrap'` (the art round the whole mug, 235 × 76 mm). */
	print?: 'front' | 'wrap';
	/** The front print's aspect, width over height, 0.2–5 (1). */
	aspect?: number;
	/** The print's height in mm, 10–76 (64; a wrap 76). */
	printHeight?: number;
	/** The glaze's colour (`'#f6f5f1'`). */
	color?: string;
	/** The inside's colour (the glaze's). */
	inside?: string;
	/** Which side a single mug's handle is on (`'right'`). */
	handle?: 'left' | 'right';
	/** Turns a single mug, in degrees, -180–180 (0: the print's centre faces the camera). */
	turn?: number;
	/** How glossy the glaze is, 0–2 (1). */
	gloss?: number;
	/** What it stands on (`'oak'`). */
	surface?: SurfaceOption;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the mugs fill, 0.2–1 (0.62; a pair 0.86). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the surface (`'mug'`). */
	seed?: string;
}

/** The layouts. */
export const MUG_LAYOUTS: readonly MugLayout[];
/** A mug mockup as layered SVG. Throws a TypeError for a bad option. */
export function mug(options: MugOptions): Mockup;
