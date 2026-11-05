import type { Art } from '../types.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';
import type { SplashStyle } from '../parts/screen/splash.js';
import type { BodyName } from '../materials/body.js';

/** A dark-room laptop's options. */
export interface LaptopSceneOptions extends PrintShotOptions, LensOptions {
	/** The brand's mark (inline; one drawn in `currentColor` takes `ink`), or with `screen: 'art'` the picture on screen. Required. */
	art: Art;
	/** `'splash'` (the lockup on the brand's colour, the default) or `'art'`. */
	screen?: 'splash' | 'art';
	/** The name beside the mark (none: the mark alone). */
	name?: string;
	/** The screen's colour (`'#4a3bd2'`). */
	color?: string;
	/** The lockup's ink (near-white or near-black, by the colour). */
	ink?: string;
	/** The screen's field: `'corner'` (deep in a corner, the default), `'glow'` or `'stage'`. */
	style?: SplashStyle;
	/** The mark's height, a share of the screen's (0.2). */
	scale?: number;
	/** The room's dark (`'#121213'`). */
	ground?: string;
	/** The laptop: `'black'` (the default), `'graphite'`, `'silver'`, `'white'` or hex. */
	finish?: BodyName | string;
}

/** What the screen shows. */
export const LAPTOP_SCREENS: readonly ['splash', 'art'];
/** The screen on the open lid, in mm: the hinge, the lid's lean past upright (radians), and the screen's centre, width and height. */
export function laptopScreen(): { hinge: [number, number, number]; lean: number; center: [number, number, number]; width: number; height: number };
/** A laptop on a dark shelf on a canvas, its screen the brand's lockup on a soft field of its colour and the room's only light. */
export function laptopScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: LaptopSceneOptions): Promise<Shot>;
