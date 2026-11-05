import type { Art } from '../types.js';
import type { BrandOptions } from '../util/brand.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { StockName } from '../materials/paper.js';
import type { MenuSection } from '../parts/menu.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';

/** The layouts: one card lying (`'card'`), or a tri-fold standing open (`'folded'`). */
export const MENU_LAYOUTS: readonly ['card', 'folded'];
/** How far each fold of the tri-fold is opened from flat, degrees (56). */
export const FOLD: number;

/** A menu scene's options. */
export interface MenuSceneOptions extends PrintShotOptions, LensOptions, BrandOptions {
	/** The mark (inline: bytes, SVG or a `data:` URI). Required. */
	art: Art;
	/** `'card'` (the default) or `'folded'`. */
	layout?: (typeof MENU_LAYOUTS)[number];
	/** The courses (placeholders by default). */
	sections?: MenuSection[];
	/** A print file instead: the card (230 × 330 mm), or the tri-fold's inside spread (297 × 210 mm). */
	print?: Art;
	/** The bleed the print file carries, mm (0). */
	bleed?: number;
	/** The table (`'oak'`). */
	surface?: SurfaceOption;
	/** The stock (`'uncoated'`). */
	stock?: StockName;
	/** Where the light is, left (-1) to right (1) (0.4). */
	light?: number;
	/** Seeds the table and the tooth (`'menu'`). */
	seed?: string;
}

/** Where the tri-fold's panels stand: each one's centre (mm, z towards the camera) and turn (degrees), a zigzag centred on the origin. */
export function zigzag(fold?: number): { x: number; z: number; turn: number }[];
/** A menu on a table, in 3D: a card lying askew, or a tri-fold standing open. Rejects with a TypeError for a bad option. */
export function menuScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: MenuSceneOptions): Promise<Shot>;
