import type { Pixels } from './detect.js';
import type { PlateKind, Point } from './format.js';

/** The maps for one screen, over its box. */
export interface SignMaps {
	/** RGB shading, row by row. */
	shading: Uint8Array;
	/** RGB light over the surface (glass's reflections, or glare), or `null` when there's none. */
	reflection: Uint8Array | null;
	/** A grey occluder mask (white in front), or `null` when nothing is. */
	mask: Uint8Array | null;
	/** The photo's grain, as a standard deviation (0–255). */
	noise: number;
}

/** A weighted, roughly Gaussian blur (three box passes of radius `r`); `weight` leaves pixels out with 0. */
export function smooth(v: Float32Array, weight: Float32Array | null, w: number, h: number, r: number): Float32Array;
/** A 0/1 mask closed (grown by `r`, then shrunk back), so speckled finds on one object join into a solid one. */
export function close(m: Uint8Array, w: number, h: number, r: number): Uint8Array;
/** The photo's grain (a standard deviation, 0–255), from its flattest 16 × 16 blocks: for a sign clipped to white, whose own grain is lost. */
export function photoNoise(px: Pixels): number;
/** The shading, reflections, occluders and grain of a blank sign, over its box. `dark` (0.55) is how much darker than the sign round it a pixel is to count as in front; `given` is an occluder mask already known (the box's size), left out of the measuring and added to what's found; `outline` the sign's shape when it isn't its corners; `stock` keeps the photo's light as it is (a coloured stock), not lifted to white. */
export function signMaps(px: Pixels, corners: readonly Point[], box: readonly [number, number, number, number], kind: PlateKind, o?: { occluders?: boolean; dark?: number; given?: Uint8Array | null; outline?: Point[] | null; stock?: boolean }): SignMaps;
