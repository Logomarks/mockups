import type { Art, Ground, Mockup, Size } from '../types.js';
import type { Fit } from '../render/fit.js';
import type { BodyName } from '../materials/body.js';

/** How to show a page on a laptop. */
export interface LaptopOptions {
	/** The page. Required. */
	art: Art;
	/** The address in the browser's field (`'hollowfern.example'`). Required. */
	domain: string;
	/** The tab's title (the domain). */
	title?: string;
	/** The tab's icon (a plain globe). Pass it small: `loadArt(file, { size: 128 })`. */
	icon?: Art;
	/** How the page fills the window (`'top'`: read from the top). */
	fill?: Fit;
	/** The browser's theme (`'light'`). */
	theme?: 'light' | 'dark';
	/** The shell (`'silver'`), or a hex colour. */
	finish?: BodyName | `#${string}`;
	/** Three-quarters (`'angle'`, the default), straight on (`'front'`), or `{ tilt, turn }` (tilt is the camera's height in degrees). */
	view?: 'angle' | 'front' | { tilt?: number; turn?: number };
	/** The desk (`'light'`). */
	ground?: Ground;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How strong the screen's reflections are, 0–2 (1). */
	glass?: number;
	/** How much of the frame it fills, 0.2–1 (0.84). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds it (`'laptop'`). */
	seed?: string;
}

/** A laptop's body in millimetres, and how far past upright the lid leans. */
export const LAPTOP: Readonly<{ width: number; depth: number; base: number; lid: number; shell: number; side: number; top: number; radius: number; lean: number }>;
/** The named views. */
export const LAPTOP_VIEWS: Readonly<{ angle: Readonly<{ tilt: number; turn: number }>; front: Readonly<{ tilt: number; turn: number }> }>;
/** A generic laptop on a desk, a browser on its screen showing the domain and the page. Throws a TypeError for a bad option. */
export function laptop(options: LaptopOptions): Mockup;

