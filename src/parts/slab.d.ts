import type { Vec3 } from '../util/vec.js';
import type { Vec2 } from '../util/shape.js';
import type { View } from '../util/camera.js';
import type { Finish } from '../materials/light.js';

/** Where a slab is: its front face's centre and its axes (unit vectors). */
export interface Frame {
	/** The front face's centre. */
	o: Vec3;
	/** Across the face, left to right. */
	u: Vec3;
	/** Down the face, top to bottom. */
	v: Vec3;
	/** Out of the face. */
	n: Vec3;
}

/** A slab, drawn. */
export interface Slab {
	/** Its visible side facets, lit. */
	sides: string;
	/** The bevel highlight along its front edge. */
	edge: string;
	/** Its front outline in pixels. */
	front: Vec2[];
	/** Its back outline in pixels. */
	back: Vec2[];
	/** Whether the front faces the camera. */
	frontFaces: boolean;
	/** The face the camera sees, as path data. */
	path: string;
	/** Front-face units (from its top-left) to pixels. */
	map: (x: number, y: number) => [number, number];
	/** Back-face units (from its top-left, seen from the front) to pixels. */
	backMap: (x: number, y: number) => [number, number];
	/** A rounded rectangle inset on the front face, in pixels. */
	outline: (inset: number, radius: number) => Vec2[];
}

/** A rounded side's cross-section: bands of `[from, to, tilt]` (the depth's fractions, front to back, and how far each leans to the front, degrees). */
export const ROUNDED: readonly (readonly [number, number, number])[];
/** A rounded slab in perspective: lit side facets and a bevel highlight `bevel` pixels wide (1); the caller fills the face. */
export function slab(view: View, o: { frame: Frame; width: number; height: number; radius: number; depth: number; color: string; finish?: Finish; light: Vec3; bevel?: number; profile?: readonly (readonly [number, number, number])[] }): Slab;
