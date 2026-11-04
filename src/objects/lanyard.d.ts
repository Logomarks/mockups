import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { StockName } from '../materials/paper.js';

/** How to show a lanyard pass. */
export interface LanyardOptions {
	/** The pass, A6 portrait: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** The name printed along the strap, repeated (none). */
	name?: string;
	/** The strap's colour (`'#1b1c1f'`). */
	strap?: string;
	/** The name's colour (light on a dark strap, dark on a light one). */
	ink?: string;
	/** The whole lanyard's turn, in degrees, -45–45 (-6). */
	angle?: number;
	/** What it lies on (`'linen'`). */
	surface?: SurfaceOption;
	/** The pass's card (`'matte'`). */
	stock?: StockName;
	/** The bleed the art carries round the trim, in mm (0; files from `@arraypress/covers` carry 3). */
	bleed?: number;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the pocket and clip fill, 0.2–1 (0.86). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the surface (`'lanyard'`). */
	seed?: string;
}

/** The pass (A6, 4 mm corners), its pocket and the strap's width, in mm. */
export const PASS: Readonly<{ width: number; height: number; radius: number; pocket: Readonly<{ width: number; height: number }>; strap: number }>;
/** The strap's two strands' spines in mm round the pocket's centre, from the crimp's top (`top`) up and away. */
export function strands(top: number): [number, number][][];
/** A lanyard mockup as layered SVG. Throws a TypeError for a bad option. */
export function lanyard(options: LanyardOptions): Mockup;
