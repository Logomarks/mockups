import type { TableSceneOptions } from './tabletop.js';
import type { BoardOption } from '../materials/board.js';
import type { Shot } from './shot.js';

/** A chopsticks scene's options. */
export interface ChopsticksSceneOptions extends TableSceneOptions {
	/** The sleeve's paper: `'white'` (the default), `'kraft'`, `'black'` or a hex colour. */
	paper?: BoardOption;
	/** The print's one ink (near-black; off-white on black). */
	ink?: string;
	/** The sticks' wood (`'#d9bc8f'`). */
	wood?: string;
	/** The name, set beside the mark along the sleeve. */
	name?: string;
	/** `'single'` (the default) or `'pair'` (two side by side). */
	layout?: 'single' | 'pair';
}

/** A sleeve and its sticks in mm: the sleeve's length, width and height, how far the sticks poke out, their length, and their tops' and tips' side. */
export const CHOPSTICKS: Readonly<{ length: number; width: number; height: number; out: number; stick: number; top: number; tip: number }>;
/** The layouts. */
export const CHOPSTICK_LAYOUTS: readonly ['single', 'pair'];
/** The sleeve's cross-section at a point along it (0 open end, 1 folded end) and an angle round it (0 the top): across and up, mm. */
export function sleeveSection(along: number, around: number): [number, number];
/** Where each sleeve lies (centre in mm, turn in degrees), the same for the same seed. */
export function chopstickPoses(layout: 'single' | 'pair', seed: string): { x: number; z: number; turn: number }[];
/** Chopsticks in a printed paper sleeve, in 3D on a canvas. Rejects with a TypeError for a bad option. */
export function chopsticksScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: ChopsticksSceneOptions): Promise<Shot>;
