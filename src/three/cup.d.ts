import type { TableSceneOptions } from './tabletop.js';
import type { BoardOption } from '../materials/board.js';
import type { Shot } from './shot.js';

/** A cup scene's options. */
export interface CupSceneOptions extends TableSceneOptions {
	/** The cup's paper (`'#f4f3ef'`). */
	color?: string;
	/** The lid's plastic: `'white'` (the default), `'black'` or a hex colour. */
	lid?: 'white' | 'black' | string;
	/** The sleeve's board: `'kraft'` (the default; the photographed kraft), `'white'`, `'black'` or a hex colour. */
	sleeve?: BoardOption;
	/** The sleeve's print's one ink (near-black; off-white on black). */
	ink?: string;
	/** The name, set beside the mark. */
	name?: string;
}

/** A 12 oz cup in mm: the base's and rim's radius, its height, the rolled rim's radius, and the sleeve's bottom and top. */
export const CUP: Readonly<{ base: number; rim: number; height: number; roll: number; sleeve: readonly [number, number] }>;
/** The lids' plastics by name. */
export const CUP_LIDS: Readonly<{ white: string; black: string }>;
/** The cup wall's outer radius at a height (mm). */
export function cupRadius(y: number): number;
/** The cup's lathe profile (radius, height in mm): the recessed base, the tapered wall, the rolled rim. */
export function cupProfile(): [number, number][];
/** The sip lid's lathe profile (radius, height in mm): skirt, deck, drinking ring and dome. */
export function lidProfile(): [number, number][];
/** A takeaway cup with a printed board sleeve, in 3D on a canvas. Rejects with a TypeError for a bad option. */
export function cupScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: CupSceneOptions): Promise<Shot>;
