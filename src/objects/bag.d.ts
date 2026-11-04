import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';

/** How to show a paper bag. */
export interface BagOptions {
	/** The print on the front: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** The paper: `'kraft'` (the default), `'white'`, `'black'` or a hex colour. */
	paper?: 'kraft' | 'white' | 'black' | `#${string}`;
	/** The rope handles' colour (cream on kraft, near black on white, charcoal on black). */
	rope?: string;
	/** The print's size in mm (the side of a square of the same area), 20–250 (150). */
	printSize?: number;
	/** The print's aspect, width over height, 0.2–5 (1). */
	aspect?: number;
	/** How far the bag is turned to show its side, degrees, 10–60 (30). */
	turn?: number;
	/** What it stands on (`'concrete'`). */
	surface?: SurfaceOption;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the bag fills, 0.2–1 (0.8). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the surface and the paper's puckering (`'bag'`). */
	seed?: string;
}

/** The paper colours by name. */
export const BAG_PAPERS: Readonly<{ kraft: string; white: string; black: string }>;
/** A medium bag's size in mm: width, height, gusset depth, and the turned-over top. */
export const BAG: Readonly<{ width: number; height: number; depth: number; fold: number }>;
/** A paper bag mockup as layered SVG. Throws a TypeError for a bad option. */
export function bag(options: BagOptions): Mockup;
