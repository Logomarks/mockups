/** A point or direction in the world, in mm: x right, y up, z towards the camera. */
export type Point3 = [number, number, number];

/** An axonometric projection. */
export interface Axo {
	/** Pixels per mm. */
	readonly mm: number;
	/** A world point in pixels. */
	at(x: number, y: number, z: number): [number, number];
	/** A world direction's image in pixels (no origin). */
	lin(x: number, y: number, z: number): [number, number];
	/** The SVG `matrix(…)` that maps a face's own frame (one unit along `u`, one along `v`, from `o`) onto the picture. */
	matrix(o: Point3, u: Point3, v: Point3): string;
	/** A polygon through world points, as path data (closed unless `close` is false). */
	path(points: Point3[], close?: boolean): string;
	/** How squarely a face with this outward normal faces the camera, -1 to 1. */
	facing(normal: Point3): number;
}

/** An axonometric view: turned `turn` degrees (positive shows the right side), `elevation` degrees from above, `mm` pixels per mm, the world origin at `origin`. */
export function axo(o: { turn: number; elevation: number; mm?: number; origin?: [number, number] }): Axo;
