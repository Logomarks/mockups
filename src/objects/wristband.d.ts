import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { BandOption } from '../parts/wristband.js';

export { WRISTBAND, WRISTBAND_KINDS, type WristbandKind, type BandOption } from '../parts/wristband.js';

/** How to show event wristbands. */
export interface WristbandOptions {
	/** The mark, on the fabric bands' sliders and printed on the Tyvek: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** The words round each band that names none of its own (none). */
	name?: string;
	/** The bands, bottom first (`['fabric', 'fabric', 'tyvek']`). */
	bands?: BandOption[];
	/** What they lie on (`'oak'`). */
	surface?: SurfaceOption;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the bands fill, 0.2–1 (0.86). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the surface and how the bands lie (`'wristband'`). */
	seed?: string;
}

/** A wristband mockup as layered SVG. Throws a TypeError for a bad option. */
export function wristband(options: WristbandOptions): Mockup;
