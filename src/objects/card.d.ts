import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { StockName } from '../materials/paper.js';
import type { SkinOption } from '../materials/skin.js';

/** How the cards are laid out. */
export type CardLayout = 'flat' | 'pair' | 'stack' | 'fan' | 'hand';

/** How to show a business card. */
export interface CardOptions {
	/** The front: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** The back. */
	back?: Art;
	/** `'flat'` (one card; the default without a back), `'pair'` (front and back; the default with one), `'stack'` (a stack and a back beside it), `'fan'`, or `'hand'` (held). */
	layout?: CardLayout;
	/** What the cards lie on (`'concrete'`). */
	surface?: SurfaceOption;
	/** The board (`'matte'`). */
	stock?: StockName;
	/** A painted edge's colour; it makes the board 1 mm thick unless `thickness` says otherwise. */
	edge?: string;
	/** The board's thickness in mm, 0–3 (0.45; 1 with an edge). */
	thickness?: number;
	/** The corners' radius in mm, 0–10 (0). */
	radius?: number;
	/** The bleed the art carries round the trim, in mm (0; files from `@arraypress/covers` carry 3). */
	bleed?: number;
	/** The holding hand's skin, for `'hand'`: `'porcelain'`, `'light'`, `'medium'` (the default), `'tan'`, `'brown'`, `'deep'` or a hex colour. */
	skin?: SkinOption;
	/** Which hand holds it, for `'hand'` (`'right'`). */
	hand?: 'right' | 'left';
	/** How many cards a stack or fan has, 2–40 (10; a fan 5). */
	count?: number;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the cards fill, 0.2–1 (0.62 for one card, 0.8 otherwise). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the surface and the stack's untidiness (`'card'`). */
	seed?: string;
}

/** Where one card lies, in mm from the layout's centre. */
export interface CardPlacement {
	x: number;
	y: number;
	/** Its turn, in degrees. */
	angle: number;
	side: 'front' | 'back';
	/** How far it's off the desk, 0–3. */
	lift: number;
	/** Its layer in a stack (0 at the bottom). */
	layer: number;
}

/** A business card's size in mm: 85 × 55. */
export const CARD: Readonly<{ width: number; height: number }>;
/** The layouts. */
export const CARD_LAYOUTS: readonly CardLayout[];
/** Where each card goes, back to front. */
export function cardPlacements(layout: CardLayout, twoSided: boolean, count: number, seed: string): CardPlacement[];
/** A business card mockup as layered SVG. Throws a TypeError for a bad option. */
export function card(options: CardOptions): Mockup;
