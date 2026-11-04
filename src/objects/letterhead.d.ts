import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { StockName } from '../materials/paper.js';

/** How the stationery is laid out. */
export type LetterheadLayout = 'flat' | 'envelope' | 'set';

/** How to show a letterhead. */
export interface LetterheadOptions {
	/** The letterhead, A4: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** `'flat'` (the sheet alone; the default), `'envelope'` (with a DL envelope) or `'set'` (letter, envelope and business cards). */
	layout?: LetterheadLayout;
	/** A logo (square) printed top-left on the envelope. */
	logo?: Art;
	/** The business card's front, for `'set'` (required there). */
	card?: Art;
	/** The business card's back, for `'set'`. */
	back?: Art;
	/** The envelope's paper colour (the stock's). */
	envelope?: string;
	/** What it lies on (`'oak'`). */
	surface?: SurfaceOption;
	/** The letter's paper (`'uncoated'`). */
	stock?: StockName;
	/** The bleed the letter's and card's art carry round the trim, in mm (0; files from `@arraypress/covers` carry 3). */
	bleed?: number;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the layout fills, 0.2–1 (0.78 flat, 0.88 otherwise). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the surface (`'letterhead'`). */
	seed?: string;
}

/** Where one piece of stationery lies, in mm from the layout's centre. */
export interface LetterheadPlacement {
	piece: 'letter' | 'envelope' | 'front' | 'back';
	x: number;
	y: number;
	/** Its turn, in degrees. */
	angle: number;
}

/** A4 in mm: 210 × 297. */
export const A4: Readonly<{ width: number; height: number }>;
/** The layouts. */
export const LETTERHEAD_LAYOUTS: readonly LetterheadLayout[];
/** Where each piece goes, back to front. */
export function letterheadPlacements(layout: LetterheadLayout): LetterheadPlacement[];
/** A letterhead mockup as layered SVG. Throws a TypeError for a bad option (and for `'set'` without `card`). */
export function letterhead(options: LetterheadOptions): Mockup;
