import type { Art } from '../types.js';
import type { BrandOptions } from '../util/brand.js';
import type { StockName } from '../materials/paper.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';

/** The exposure under which the studio's lamps print a sheet its own colour (1.12). */
export const STATIONERY_EXPOSURE: number;
/** Each piece's size and thickness, mm. */
export const PIECES: Readonly<Record<'letter' | 'envelope' | 'front' | 'back', Readonly<{ width: number; height: number; thickness: number }>>>;

/** A stationery scene's options. */
export interface StationerySceneOptions extends PrintShotOptions, LensOptions, BrandOptions {
	/** The mark (inline: bytes, SVG or a `data:` URI). Required. */
	art: Art;
	/** The letterhead's print file (A4); composed from the brand when left out. */
	letter?: Art;
	/** The business card's front print file (85 × 55 mm); composed when left out. */
	card?: Art;
	/** The business card's back print file; composed when left out. */
	back?: Art;
	/** The bleed the print files carry round the trim, mm (0). */
	bleed?: number;
	/** The ground's colour (the brand's colour, deepened). */
	ground?: string;
	/** The letterhead's and envelope's stock (`'uncoated'`); cards are matte. */
	stock?: StockName;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** Seeds the paper's tooth (`'stationery'`). */
	seed?: string;
}

/** Where the pieces lie, mm about the set's centre: the letterhead left, the envelope and the card's front and back in a column on the right. */
export function stationeryGrid(gutter?: number): { piece: 'letter' | 'envelope' | 'front' | 'back'; x: number; z: number }[];
/** A letterhead, envelope and business card laid flat on a solid colour, in 3D. Rejects with a TypeError for a bad option. */
export function stationeryScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: StationerySceneOptions): Promise<Shot>;
