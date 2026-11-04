import type { Art, Mockup, Size } from '../types.js';

/** A view from the street: straight on, at an angle, or `{ tilt, turn }` (tilt raises the camera's aim, degrees). */
export type StreetView<N extends string> = N | { tilt?: number; turn?: number };

/** How to show art on a billboard. */
export interface BillboardOptions {
	/** The poster. Required. */
	art: Art;
	/** A board on a mast against the sky (`'roadside'`, the default), or a framed poster on a brick wall (`'wall'`). */
	setting?: 'roadside' | 'wall';
	/** The light: by day (the default), at dusk, or at night with the lamps on. */
	time?: 'day' | 'dusk' | 'night';
	/** `'front'` (the default), `'angle'`, or `{ tilt, turn }`. */
	view?: StreetView<'front' | 'angle'>;
	/** The poster's width over its height (3 on a mast, 2 on a wall), 0.5–5. */
	ratio?: number;
	/** How the art fills the poster (`'cover'`). */
	fill?: 'cover' | 'contain';
	/** What shows round contained art (`'#ffffff'`). */
	background?: string;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the sun is, left (-1) to right (1) (0.4). */
	light?: number;
	/** How much of the frame the board fills, 0.2–1 (0.78 on a mast, 0.6 on a wall). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the clouds, trees and bricks (`'billboard'`). */
	seed?: string;
}

/** Each setting's board in metres, its default proportions, and where the camera stands. */
export const BILLBOARD: Readonly<Record<'roadside' | 'wall', Readonly<{ height: number; bottom: number; depth: number; frame: number; ratio: number; distance: number; eye: number }>>>;
/** The named views. */
export const BILLBOARD_VIEWS: Readonly<{ front: Readonly<{ tilt: number; turn: number }>; angle: Readonly<{ tilt: number; turn: number }> }>;
/** A roadside billboard on a mast, or a framed poster on a city wall, by day, at dusk or at night. Throws a TypeError for a bad option. */
export function billboard(options: BillboardOptions): Mockup;
