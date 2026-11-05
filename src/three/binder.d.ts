import type { Art } from '../types.js';
import type { BrandOptions } from '../util/brand.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';

/** A binder, in mm: its cover's width and height, its thickness, its board, and its edges' radius. */
export const BINDER: Readonly<{ width: number; height: number; thickness: number; board: number; radius: number }>;

/** A binder scene's options. */
export interface BinderSceneOptions extends PrintShotOptions, LensOptions, BrandOptions {
	/** The mark (inline: bytes, SVG or a `data:` URI). Required. */
	art: Art;
	/** How many binders, 1–6 (4). */
	count?: number;
	/** A title on each cover and spine, beside the volume's number. */
	title?: string;
	/** The paper sweep's colour (`'#bfcdd6'`). */
	ground?: string;
	/** Where the key light is, left (-1) to right (1) (0.6); the shadow falls the other way. */
	light?: number;
	/** Seeds the board's tooth (`'binder'`). */
	seed?: string;
}

/** Each binder's centre along the row (mm, z towards the camera), back to front. */
export function binderRow(count: number, gap?: number): number[];
/** A binder's top: the covers' and spine's edges, the pages set between. An SVG document, `px` (6) per mm. */
export function edgeSvg(color: string, px?: number): string;
/** Binders standing in a row on a paper sweep, in 3D: covers and spines composed from the brand, one hard shadow. Rejects with a TypeError for a bad option. */
export function binderScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: BinderSceneOptions): Promise<Shot>;
