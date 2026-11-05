import type { Art } from '../types.js';
import type { BrandOptions } from '../util/brand.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';

/** The book and its slipcase, in mm. */
export const BOOK: Readonly<{ width: number; height: number; thickness: number; board: number; overhang: number; wall: number; notch: number }>;
/** Where the book and the case lie (centres in mm, z towards the camera) and their turn (degrees). */
export const BOOK_LAYOUT: Readonly<{ book: Readonly<{ x: number; z: number; turn: number }>; slipcase: Readonly<{ x: number; z: number; turn: number }> }>;

/** A book scene's options. */
export interface BookSceneOptions extends PrintShotOptions, LensOptions, BrandOptions {
	/** The mark, debossed into the cloth and printed on the case (inline: bytes, SVG or a `data:` URI). Required. */
	art: Art;
	/** The cloth's colour (the brand's colour, deepened). */
	cloth?: string;
	/** The acrylic's tint (`'#5fc9b2'`). */
	tint?: string;
	/** The ground's colour (`'#a8cbcf'`). */
	ground?: string;
	/** The deboss's size, a share of the board's width, 0.1–0.9 (0.5). */
	scale?: number;
	/** Where the light is, left (-1) to right (1) (0.4). */
	light?: number;
	/** Seeds the weave (`'book'`). */
	seed?: string;
}

/** The front board's maps at its size: the cloth's colour (the deboss a shade darker, its walls shaded and lit), its height (the weave, the mark pressed down) and roughness. */
export function clothCanvases(mark: HTMLImageElement, o: { cloth: string; seed: string; size?: number; scale?: number }): { color: HTMLCanvasElement; height: HTMLCanvasElement; rough: HTMLCanvasElement };
/** The slipcase's print: the lockup in white along its top edge. An SVG document, `px` (8) per mm. */
export function slipcaseSvg(brand: import('../util/brand.js').Brand, size: [number, number], px?: number): string;
/** A dim room with one tall window, as a panorama, where a level face seen from the camera (`turn`, `tilt` in degrees) reflects. */
export function windowCanvas(turn: number, tilt: number): HTMLCanvasElement;
/** A clothbound book with the mark debossed, beside its tinted acrylic slipcase, in 3D. Rejects with a TypeError for a bad option. */
export function bookScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: BookSceneOptions): Promise<Shot>;
