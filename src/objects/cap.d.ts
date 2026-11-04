import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { GarmentColor } from '../materials/fabric.js';

/** Where the camera is: three-quarters from the front (showing the cap's left side, or its right), or straight on. */
export type CapView = 'three-quarter' | 'three-quarter-left' | 'front';

/** How to show artwork on a cap. */
export interface CapOptions {
	/** The artwork for the front panels: image bytes, SVG markup, a `data:` URI or a URL. Its own aspect is kept. Required. */
	art: Art;
	/** The twill's colour: a name or a hex colour (`'black'`). */
	color?: GarmentColor;
	/** The visor's colour, when it differs (the crown's). */
	brim?: string;
	/** `'embroidered'` (raised satin thread; the default) or `'printed'`. */
	finish?: 'embroidered' | 'printed';
	/** Stitches or prints a one-colour artwork (a mark) in this colour instead of its own. */
	ink?: string;
	/** The artwork's size, as a share of the largest front embroidery (100 × 56 mm), 0.2–1.2 (1). */
	scale?: number;
	/** Where the camera is (`'three-quarter'`). */
	view?: CapView;
	/** What the cap sits on (`'concrete'`). */
	surface?: SurfaceOption;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the cap fills, 0.2–1 (0.66). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the surface (`'cap'`). */
	seed?: string;
}

/** A cap's measurements in mm: the crown's base, its height, the visor's length, the largest front embroidery. */
export const CAP: Readonly<{ width: number; depth: number; crown: number; brim: number; logo: Readonly<{ w: number; h: number }> }>;
/** The named views, in degrees about the vertical and down from the horizon. */
export const CAP_VIEWS: Readonly<Record<CapView, Readonly<{ turn: number; tilt: number }>>>;
/** A point on the crown, `t` radians round from the front and `p` down from the top (π/2 at the base), in mm (x right, y up, z to the front). */
export function crownAt(t: number, p: number): [number, number, number];
/** A point on the visor's top, `t` radians round the base from the front and `s` out from the base (0) to the edge (1), in mm. */
export function brimAt(t: number, s: number): [number, number, number];
/** A cap mockup as layered SVG. Throws a TypeError for a bad option. */
export function cap(options: CapOptions): Mockup;
