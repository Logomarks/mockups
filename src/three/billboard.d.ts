import type { Art } from '../types.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';

/** The site, in mm: the hedge's width, height and depth, the board's width, the gap above the hedge, and a leaf's length. */
export const HEDGE: Readonly<{ width: number; height: number; depth: number; board: number; gap: number; leaf: number }>;
/** The hedges by name, each its leaves' greens. */
export const HEDGES: Readonly<{ laurel: readonly string[]; box: readonly string[]; yew: readonly string[] }>;

/** A billboard scene's options. */
export interface BillboardSceneOptions extends PrintShotOptions, LensOptions {
	/** The poster (inline: bytes, SVG or a `data:` URI); its proportions set the board's, 2:1 to 3:1. Required. */
	art: Art;
	/** The hedge: `'laurel'` (the default), `'box'` or `'yew'`. */
	hedge?: keyof typeof HEDGES;
	/** How thickly the leaves grow, 0.3–2 (1). */
	density?: number;
	/** Where the sun is, left (−1) to right (1) (−0.5). */
	light?: number;
	/** Seeds the leaves and the sky (`'billboard'`). */
	seed?: string;
}

/** The board's width and height in mm for the art's proportions. */
export function boardSize(aspect: number): [number, number];
/** The hedge's leaves (mm; x across, y up, z out of the front face): each one's centre, the way it faces, its turn, and how deep it sits (0–1). */
export function hedgeLeaves(o: { width: number; height: number; depth: number; leaf: number; seed: string; density?: number }): { p: [number, number, number]; n: [number, number, number]; spin: number; depth: number }[];

/** A billboard over a clipped hedge, seen from the street below against a clear summer sky: the hedge real leaves, tens of thousands, shading one another. */
export function billboardScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: BillboardSceneOptions): Promise<Shot>;
