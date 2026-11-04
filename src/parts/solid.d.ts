/** A 3-vector. */
export type Vec3 = [number, number, number];

/** An orthographic camera: world points and directions into view space (x right, y down the frame, z towards the viewer). */
export interface Ortho {
	point(p: Vec3): Vec3;
	dir(d: Vec3): Vec3;
}

/** A grid over a region of the frame with a depth test; each cell keeps two values from the nearest sample. */
export interface Splat {
	readonly w: number;
	readonly h: number;
	readonly box: { x: number; y: number; w: number; h: number };
	/** Puts a sample at a point of the frame, if it's nearer than what the cell holds. */
	put(x: number, y: number, z: number, a: number, b?: number): void;
	/** Fills cells no sample reached from their neighbours. */
	fill(): void;
	readonly a: Float32Array;
	readonly b: Float32Array;
	/** Where each cell's sample landed, x. */
	readonly sx: Float32Array;
	/** Where each cell's sample landed, y. */
	readonly sy: Float32Array;
	readonly depth: Float32Array;
}

/** An orthographic camera turned `turn` degrees about the vertical and looking down from `tilt` degrees. */
export function ortho(turn: number, tilt: number): Ortho;
/** A surface's point and unit normal at a parameter (by finite differences), the normal flipped to `outward`. */
export function sample(f: (u: number, v: number) => Vec3, u: number, v: number, outward?: 1 | -1): { p: Vec3; nrm: Vec3 };
/** The convex hull of points, counter-clockwise. */
export function hull(pts: [number, number][]): [number, number][];
/** A polygon as path data. */
export function polyPath(pts: [number, number][], closed?: boolean): string;
/** A grid over a region of the frame, cells `cell` view units square. */
export function splat(box: { x: number; y: number; w: number; h: number }, cell: number): Splat;
/** The splatted lighting (`a`, 0–1) as a shade map: black below `base`, white above it. */
export function shadeOf(s: Splat, o: { base: number; dark: number; bright: number }): string;
/** The splatted art coordinates (`a`, `b`, 0–1) as a two-channel displacement map wrapping art drawn flat in `art` onto the surface, and the scale to use it at. */
export function warpOf(s: Splat, art: { x: number; y: number; w: number; h: number }): { href: string; scale: number };
