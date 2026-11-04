import type { Scene } from './scene.js';

/** A drawing warped onto a surface seen in perspective. */
export interface WarpOptions {
	/** The id of the drawing in the defs, drawn in `[0, width] × [0, height]`. */
	content: string;
	/** The drawing's width. */
	width: number;
	/** Its height. */
	height: number;
	/** Where each of its points lands, in pixels. */
	map: (x: number, y: number) => [number, number];
	/** The largest error allowed, in pixels (0.75). */
	tolerance?: number;
	/** The most cells along the longer side (28). */
	max?: number;
}

/** The fewest cells across and down for a piecewise-affine warp to stay within `tolerance` pixels. */
export function cells(map: (x: number, y: number) => [number, number], w: number, h: number, tolerance: number, max: number): [number, number];
/** The drawing cut into triangles (half a pixel's overlap), each filled with it as a pattern carried by the affine map that fits its corners. */
export function warp(sc: Scene, o: WarpOptions): string;
