import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { PrintOption } from '../materials/ink.js';
import type { VinylSpec } from '../materials/vinyl.js';
import type { LabelsOption } from '../parts/label.js';

/** How to show artwork on vinyl. */
export interface VinylOptions {
	/** The cover: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** One record or two (`'double'`). */
	format?: 'single' | 'double';
	/** Where the records peek out: `'both'` (a double's default), `'left'` or `'right'` (a single's default; a double fans both out on that side). */
	side?: 'both' | 'left' | 'right';
	/** What the records are pressed in (`'clear'`); a pair gives each record its own. */
	vinyl?: VinylSpec | [VinylSpec, VinylSpec];
	/** The centre labels (`'auto'`: crops of the cover, A dark and B light). */
	labels?: LabelsOption;
	/** What it lies on (`'light'`): a plain ground (`'light'`, `'dark'`, hex, `{ color, vignette }`) or a surface (`'oak'`, `'slate'`, `'linen'`, `'knit'`… or `{ texture, color }`). */
	ground?: SurfaceOption;
	/** How the sleeve is printed: `'full'` (the art as it is; the default) or `{ ink, paper }` (in one ink on coloured stock: the art's darks take the ink, so a photo prints as a monotone). */
	print?: PrintOption;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** How much of a record's diameter shows past the sleeve, 0.1–0.9 (0.53). */
	peek?: number;
	/** Where the light is, left (-1) to right (1); shadows fall the other way (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame's width the group fills, 0.2–1 (0.89). */
	fit?: number;
	/** How strong the sleeve's paper sheen is (1). */
	sheen?: number;
	/** Film grain over the frame, 0–1 (0.2); 0 for none. */
	grain?: number;
	/** Words for the ring of type on the labels. */
	title?: string;
	/** Seeds the tracks, splatter and marble (`'vinyl'`). */
	seed?: string;
}

/** A 12" record's diameter as a fraction of its sleeve's side: 0.965. */
export const RECORD: number;
/** Where each record goes, back to front: its side, how much shows, and its label (0 for A). */
export function placements(format: 'single' | 'double', side: 'both' | 'left' | 'right', peek: number): { dir: -1 | 1; peek: number; label: 0 | 1 }[];
/** A vinyl mockup as layered SVG. Throws a TypeError for a bad option. */
export function vinyl(options: VinylOptions): Mockup;
/** The record sizes in mm (the sleeve's side, the record's and label's diameters, its thickness) and their speed. */
export const VINYL_SIZES: Readonly<Record<'12in' | '7in', Readonly<{ sleeve: number; record: number; label: number; thickness: number; speed: string }>>>;
