import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { GarmentColor } from '../materials/fabric.js';

/** Where a hoodie's print goes: `'chest'` (above the pocket), `'left-chest'` (a small logo), or `'back'` (the hoodie shown from behind). */
export type HoodiePlacement = 'chest' | 'left-chest' | 'back';

/** How to show a print on a hoodie. */
export interface HoodieOptions {
	/** The print: image bytes, SVG markup, a `data:` URI or a URL. Its own aspect is kept. Required. */
	art: Art;
	/** Where it goes (`'chest'`). */
	placement?: HoodiePlacement;
	/** The fleece's colour: a name or a hex colour (`'heather'`). */
	color?: GarmentColor;
	/** The drawcords' colour (the fleece's). */
	cord?: string;
	/** Prints a one-colour artwork (a mark) in this colour instead of its own. */
	ink?: string;
	/** The print's size, as a share of the placement's area, 0.2–1.5 (1). */
	scale?: number;
	/** What the hoodie lies on (`'concrete'`). */
	surface?: SurfaceOption;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the hoodie fills, 0.2–1 (0.9). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the folds, the cords and how it's laid (`'hoodie'`). */
	seed?: string;
}

/** The placements and the area each may fill, in mm from the centre of the neck line. */
export const HOODIE_PLACEMENTS: Readonly<Record<HoodiePlacement, Readonly<{ x: number; y: number; w: number; h: number }>>>;
/** A flat hoodie's measurements in mm (a men's L). */
export const HOODIE: Readonly<{ chest: number; length: number; sleeve: number; cuff: number; band: number; hood: number }>;
/** The hoodie's outline in mm (body, sleeves, hood laid back), and the left cuff's end; `seed` adds a few mm of untidiness. */
export function hoodieOutline(seed?: string): { d: string; poly: [number, number][]; cuff: { outer: [number, number]; inner: [number, number] } };
/** A hoodie mockup as layered SVG. Throws a TypeError for a bad option. */
export function hoodie(options: HoodieOptions): Mockup;
