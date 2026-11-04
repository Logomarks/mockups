import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { GarmentColor } from '../materials/fabric.js';

/** Where a T-shirt's print goes: `'center'` (a full front print), `'chest'` (a smaller one), `'left-chest'` (a small logo over the heart), or `'back'` (the shirt shown from behind). */
export type TeePlacement = 'center' | 'chest' | 'left-chest' | 'back';

/** How to show a print on a T-shirt. */
export interface TeeOptions {
	/** The print: image bytes, SVG markup, a `data:` URI or a URL. Its own aspect is kept. Required. */
	art: Art;
	/** Where it goes (`'center'`). */
	placement?: TeePlacement;
	/** The shirt's colour: a name or a hex colour (`'white'`). */
	color?: GarmentColor;
	/** Prints a one-colour artwork (a mark) in this colour instead of its own. */
	ink?: string;
	/** The print's size, as a share of the placement's area, 0.2–1.5 (1). */
	scale?: number;
	/** What the shirt lies on (`'concrete'`). */
	surface?: SurfaceOption;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the shirt fills, 0.2–1 (0.86). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the folds and how the shirt is laid (`'tee'`). */
	seed?: string;
}

/** The placements and the area each may fill, in mm from the centre of the neck line. */
export const TEE_PLACEMENTS: Readonly<Record<TeePlacement, Readonly<{ x: number; y: number; w: number; h: number }>>>;
/** A flat T-shirt's measurements in mm (a men's L). */
export const TEE: Readonly<{ chest: number; length: number; shoulder: number; sleeve: number; opening: number; neck: number }>;
/** The T-shirt's outline in mm, and the left sleeve's opening; `seed` adds a few mm of untidiness. */
export function teeOutline(seed?: string): { d: string; poly: [number, number][]; sleeve: { top: [number, number]; bottom: [number, number]; dir: [number, number] } };
/** A T-shirt mockup as layered SVG. Throws a TypeError for a bad option. */
export function tee(options: TeeOptions): Mockup;
