import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { BoardOption } from '../materials/board.js';

/** How to show a box. */
export interface BoxOptions {
	/** The print on the top (the lid): image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** A print on the front (a mailer's front, a lid box's lid band): edge to edge when its proportions suit the face, otherwise whole and centred. */
	side?: Art;
	/** A print inside an open mailer's lid (the top's art by default). */
	inside?: Art;
	/** `'mailer'` (a corrugated mailer; the default) or `'lid'` (a two-piece lid box). */
	kind?: 'mailer' | 'lid';
	/** How open, 0 (closed, the default) to 1, as in `boxScene`: a mailer's lid swung up 112° at 1; a lid box's lid lifted `lift` mm at 1. `true` is 1, `false` 0. */
	open?: number | boolean;
	/** How far a fully open lid box's lid is lifted, mm, 0–200 (70). */
	lift?: number;
	/** The board: `'kraft'` (the default), `'white'`, `'black'` or a hex colour. */
	board?: BoardOption;
	/** The inside's colour (kraft a shade lighter and warmer; a white mailer kraft; otherwise the board's). */
	lining?: string;
	/** How far the box is turned to show its side, degrees, 10–60 (32). */
	turn?: number;
	/** How far above it the camera is, degrees, 10–60 (28). */
	elevation?: number;
	/** What it stands on (`'paper'`). */
	surface?: SurfaceOption;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the box fills, 0.2–1 (0.78). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the surface and the board's grain (`'box'`). */
	seed?: string;
}

/** The board colours by name. */
export const BOARDS: Readonly<{ kraft: string; white: string; black: string }>;
/** The boxes' sizes in mm: width, depth, height, wall (and a lid box's lid depth). */
export const BOXES: Readonly<{
	mailer: Readonly<{ width: number; depth: number; height: number; wall: number }>;
	lid: Readonly<{ width: number; depth: number; height: number; wall: number; lid: number }>;
}>;
/** A box mockup as layered SVG. Throws a TypeError for a bad option. */
export function box(options: BoxOptions): Mockup;
