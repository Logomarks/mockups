import type { Art, Ground, Mockup, Size } from '../types.js';
import type { Fit } from '../render/fit.js';
import type { BodyName } from '../materials/body.js';

/** A view: a named one, or a tilt from straight down and a turn about the vertical, in degrees. */
export type DeviceView = 'front' | 'angle' | { tilt?: number; turn?: number };

/** How to show art on a phone. */
export interface PhoneOptions {
	/** The art (`screen: 'art'`), the app's icon (`'home'`) or the post's image (`'feed'`). Required. */
	art: Art;
	/** What the screen shows: the art, a home screen with the brand as an app, or the brand's post in a feed (`'art'`). */
	screen?: 'art' | 'home' | 'feed';
	/** The brand's name: the app's label, the post's byline. Required for `'home'` and `'feed'`. */
	name?: string;
	/** The post's avatar (`'feed'`; the art). Pass it small: `loadArt(file, { size: 256 })`. */
	avatar?: Art;
	/** The line under the post's name (`'@'` and the name, slugged). */
	handle?: string;
	/** The home screen's wallpaper: a hex colour (a soft gradient from it) or art (`'#56677f'`). */
	wallpaper?: Art;
	/** The app icon's colour behind the mark. */
	iconBackground?: string;
	/** Space round the mark on the icon, as a fraction of it (0: the art fills it). */
	iconPadding?: number;
	/** The feed's theme (`'light'`). */
	theme?: 'light' | 'dark';
	/** How the art fills the screen (`'cover'`). */
	fill?: Fit;
	/** The shell (`'graphite'`), or a hex colour. */
	finish?: BodyName | `#${string}`;
	/** Straight down (`'front'`, the default), at a slight angle (`'angle'`), or `{ tilt, turn }`. */
	view?: DeviceView;
	/** What it lies on (`'light'`). */
	ground?: Ground;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How strong the glass's reflections are, 0–2 (1). */
	glass?: number;
	/** How much of the frame the phone fills, 0.2–1 (0.82). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the placeholders (`'phone'`). */
	seed?: string;
}

/** A phone's body in millimetres. */
export const PHONE: Readonly<{ width: number; height: number; radius: number; depth: number; bezel: number; screenRadius: number; hole: number }>;
/** The named views. */
export const PHONE_VIEWS: Readonly<{ front: Readonly<{ tilt: number; turn: number }>; angle: Readonly<{ tilt: number; turn: number }> }>;
/** A generic phone lying on a surface, its screen showing art, a home screen or a feed post. Throws a TypeError for a bad option. */
export function phone(options: PhoneOptions): Mockup;
