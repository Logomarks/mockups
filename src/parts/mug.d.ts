import type { Scene } from '../render/scene.js';

/** One mug, in pixels. */
export interface MugPart {
	/** Its axis, x. */
	cx: number;
	/** Where its foot's centre is, y. */
	base: number;
	/** Pixels per mm. */
	mm: number;
	/** The glaze's colour. */
	color: string;
	/** The inside's colour. */
	inside: string;
	/** Which side the handle is on. */
	handle: 'left' | 'right';
	/** Where the light is, left (-1) to right (1). */
	light: number;
	/** The print: its height in mm, and how to draw it unrolled (x the arc from the front's centre, in px; its top at 0). */
	print: { height: number; draw: (mm: number, height: number) => string };
	/** Which way it's turned, in degrees: the arc at this angle faces the camera (0). */
	turn?: number;
	/** How glossy the glaze is (1). */
	gloss?: number;
	/** How dark its shadows are (1). */
	shadow?: number;
	/** The view's elevation in degrees (12). */
	elevation?: number;
}

/** An 11 oz mug in mm: diameter, height, wall, the print area's height, and the gap a wrap leaves at the handle. */
export const MUG: Readonly<{ diameter: number; height: number; wall: number; print: number; gap: number }>;
/** A mug and its shadows. */
export function mug(sc: Scene, o: MugPart): string;
