import type { Art } from '../types.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';
import type { SplashStyle } from '../parts/screen/splash.js';

/** A keynote's options. */
export interface KeynoteSceneOptions extends PrintShotOptions, LensOptions {
	/** The brand's mark (inline; one drawn in `currentColor` takes `ink`), or with `screen: 'art'` the slide. Required. */
	art: Art;
	/** `'splash'` (the lockup on the brand's colour, the default) or `'art'` (a slide, cover-fitted). */
	screen?: 'splash' | 'art';
	/** The name beside the mark (none: the mark alone). */
	name?: string;
	/** The screen's colour (`'#2f9e4f'`). */
	color?: string;
	/** The lockup's ink (near-white or near-black, by the colour). */
	ink?: string;
	/** The uplights' colour on the wall (`color`). */
	wash?: string;
	/** The screen's field: `'stage'` (washed paler at both sides, the default), `'glow'` or `'corner'`. */
	style?: SplashStyle;
	/** The mark's height, a share of the screen's (0.24). */
	scale?: number;
	/** Seeds the audience (`'keynote'`). */
	seed?: string;
}

/** The hall, in metres: the screen (width, height, its bottom's height), the stage (width, depth, height), and the audience's first and last rows' distance from the wall. */
export const HALL: Readonly<{ screen: number; screenHeight: number; screenBottom: number; stage: number; stageDepth: number; stageHeight: number; rows: readonly [number, number] }>;
/** What the screen shows. */
export const KEYNOTE_SCREENS: readonly ['splash', 'art'];
/** The audience, front row first: each person's place (metres), head size and height, and lean; the same for the same seed. */
export function audience(seed: string): { x: number; z: number; head: number; height: number; lean: number }[];
/** A keynote on a canvas: the brand on a big screen over a stage, seen from behind the audience in a dark hall, washed in the brand's colour. */
export function keynoteScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: KeynoteSceneOptions): Promise<Shot>;
