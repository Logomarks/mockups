import type { TableSceneOptions } from './tabletop.js';
import type { Shot } from './shot.js';

/** The napkins' colours by name. */
export type NapkinColor = 'white' | 'kraft' | 'black' | 'blush';

/** A napkin scene's options. */
export interface NapkinSceneOptions extends TableSceneOptions {
	/** The napkins: `'white'` (the default), `'kraft'`, `'black'`, `'blush'` or a hex colour. */
	color?: NapkinColor | string;
	/** The print's one ink (near-black; off-white on black napkins). */
	ink?: string;
	/** `'centre'` (the default, large in the middle) or `'corner'` (small in the open corner). */
	print?: 'centre' | 'corner';
	/** The name, set under the mark. */
	name?: string;
	/** How many in the stack, 1–60 (16). */
	count?: number;
}

/** A folded cocktail napkin in mm: its side, its folded thickness, and its embossed border's inset and width. */
export const NAPKIN: Readonly<{ side: number; thick: number; inset: number; border: number }>;
/** The napkins' colours by name. */
export const NAPKIN_COLORS: Readonly<Record<NapkinColor, string>>;
/** Where the print sits. */
export const NAPKIN_PRINTS: readonly ['centre', 'corner'];
/** Each napkin in a stack, bottom first: its centre (mm; y its underside) and turn (degrees), nudged by the seed. */
export function napkinStack(count: number, seed: string): { x: number; y: number; z: number; turn: number }[];
/** A napkin's face (colour, crepe mottle, the print) and its relief (crepe and the embossed border) as canvases. */
export function napkinFace(o: { color: string; print: HTMLCanvasElement | null; seed: string; px?: number }): { color: HTMLCanvasElement; bump: HTMLCanvasElement };
/** A napkin as soft tissue: full in the middle, thinning to rounded edges, gently waved. */
export function napkinGeometry(THREE: typeof import('three'), u: number, seed: string): import('three').BoxGeometry;
/** A stack of folded paper napkins, the brand printed on the top one, in 3D on a canvas. Rejects with a TypeError for a bad option. */
export function napkinScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: NapkinSceneOptions): Promise<Shot>;
