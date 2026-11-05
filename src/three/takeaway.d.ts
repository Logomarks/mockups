import type { Art } from '../types.js';
import type { TableSceneOptions } from './tabletop.js';
import type { BoardOption } from '../materials/board.js';
import type { Shot } from './shot.js';

/** A takeaway bag scene's options. */
export interface TakeawaySceneOptions extends TableSceneOptions {
	/** The bag's paper: `'kraft'` (the default; the photographed kraft), `'white'`, `'black'` or a hex colour. */
	paper?: BoardOption;
	/** The seal sticker's colour (`'#1c1a17'`). */
	seal?: string;
	/** The mark's ink on the seal (`'#f4f1ea'`). */
	ink?: string;
}

/** The bag in mm: width, depth (gusset), height to its folded top, how far the gussets pleat in (low down, and at the top edge), the folded flap, and the seal's diameter. */
export const TAKEAWAY: Readonly<{ width: number; depth: number; height: number; pleat: readonly [number, number]; flap: number; seal: number }>;
/** How far a gusset's centre crease pleats in at a height (mm): a little all the way up, deepest at the top edge. */
export function pleat(y: number): number;
/** The seal's print: a disc of its colour with the mark in its ink, clear outside. */
export function sealCanvas(mark: Art, o: { color: string; ink: string; px?: number }): Promise<HTMLCanvasElement>;
/** A sheet of paper between four corners (mm), bowed out along its normal and softly wrinkled, its UVs spanning it. */
export function sheet(THREE: typeof import('three'), c: [number, number, number][], o: { bulge?: number; wrinkle?: number; seed?: number; mat: import('three').Material; u: number }): import('three').Mesh;
/** A kraft takeaway bag folded over and sealed with a round sticker, in 3D on a canvas. Rejects with a TypeError for a bad option. */
export function takeawayScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: TakeawaySceneOptions): Promise<Shot>;
