import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { GarmentColor } from '../materials/fabric.js';

/** How to show a print on a tote bag. */
export interface ToteOptions {
	/** The print: image bytes, SVG markup, a `data:` URI or a URL. Its own aspect is kept. Required. */
	art: Art;
	/** The canvas's colour: a name or a hex colour (`'natural'`). */
	color?: GarmentColor;
	/** Prints a one-colour artwork (a mark) in this colour instead of its own. */
	ink?: string;
	/** The print's size, as a share of the print area (280 × 300 mm), 0.2–1.2 (1). */
	scale?: number;
	/** What the bag lies on (`'oak'`). */
	surface?: SurfaceOption;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the bag and its handles fill, 0.2–1 (0.84). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the creases (`'tote'`). */
	seed?: string;
}

/** A tote's measurements in mm. */
export const TOTE: Readonly<{ width: number; height: number; hem: number; strap: number; spread: number; loop: number }>;
/** The print area on the front, in mm from the middle of the mouth. */
export const TOTE_PRINT: Readonly<{ x: number; y: number; w: number; h: number }>;
/** A tote bag mockup as layered SVG. Throws a TypeError for a bad option. */
export function tote(options: ToteOptions): Mockup;
