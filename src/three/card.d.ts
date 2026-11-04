import type { Art } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { StockName } from '../materials/paper.js';
import type { PrintShotOptions } from './printshot.js';
import type { Shot } from './shot.js';

/** How the cards are laid out in 3D (the 2D layouts). */
export type CardSceneLayout = 'flat' | 'pair' | 'stack' | 'fan';

/** A 3D card scene's options: the 2D `card` options (art inline: bytes, SVG or a `data:` URI) less `size` and `grain`, and the shot. */
export interface CardSceneOptions extends PrintShotOptions {
	/** The front. Required. */
	art: Art;
	/** The back. */
	back?: Art;
	/** `'flat'` (the default without a back), `'pair'` (the default with one), `'stack'` or `'fan'`. */
	layout?: CardSceneLayout;
	/** What the cards lie on (`'concrete'`). */
	surface?: SurfaceOption;
	/** The board (`'matte'`); `'gloss'` gets a clearcoat. */
	stock?: StockName;
	/** A painted edge's colour; it makes the board 1 mm thick unless `thickness` says otherwise. */
	edge?: string;
	/** The board's thickness in mm, 0.1–3 (0.45; 1 with an edge). */
	thickness?: number;
	/** The corners' radius in mm, 0–10 (0). */
	radius?: number;
	/** The bleed the art carries round the trim, in mm (0). */
	bleed?: number;
	/** How many cards a stack or fan has, 2–40 (10; a fan 5). */
	count?: number;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the contact shadows are, 0–3 (1). */
	shadow?: number;
	/** Seeds the desk and the stack (`'card'`). */
	seed?: string;
}

/** Where one card lies in 3D, in mm: centre (z towards the camera), height of its underside, turn (degrees), side up, lift. */
export interface CardPose {
	x: number;
	y: number;
	z: number;
	angle: number;
	side: 'front' | 'back';
	lift: number;
}

/** The layouts a 3D card scene takes. */
export const CARD_SCENE_LAYOUTS: readonly CardSceneLayout[];
/** Where each card lies in 3D, back to front, centred on the origin, and the layout's width and depth in mm. */
export function cardPoses(layout: CardSceneLayout, twoSided: boolean, count: number, seed: string, thickness: number): { cards: CardPose[]; width: number; depth: number };
/** A rounded rectangle as a three.js shape, centred on the origin. */
export function roundedShape(THREE: typeof import('three'), w: number, h: number, r: number): import('three').Shape;
/** One card (scene units): an extruded edge and printed faces, lying with its underside at y = 0. */
export function cardMesh(
	THREE: typeof import('three'),
	o: { w: number; h: number; t: number; r: number; top: import('three').Material; bottom: import('three').Material; edge: import('three').Material },
): import('three').Group;
/** Business cards in 3D on a canvas, three.js loaded on first use; drawn once, then on demand. Rejects with a TypeError for a bad option. */
export function cardScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: CardSceneOptions): Promise<Shot>;
