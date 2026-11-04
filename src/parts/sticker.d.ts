import type { Scene, PlaceArt } from '../render/scene.js';

/** The shapes a sticker can be cut to. */
export type StickerShape = 'circle' | 'rounded' | 'contour';

/** A sticker's art and cut, in pixels. */
export interface StickerSpec {
	/** Draws the art into a box. */
	place: PlaceArt;
	/** The art's width. */
	w: number;
	/** The art's height. */
	h: number;
	/** Its cut. */
	shape: StickerShape;
	/** The white border round the art. */
	border: number;
	/** A rounded sticker's corner radius (0). */
	radius?: number;
	/** Where the light is, left (-1) to right (1): its sheen leans that way. */
	light: number;
}

/** A sticker defined once: its silhouette and face as ids in the defs, its sheen, and its half-extent. */
export interface StickerDef {
	/** The silhouette (white, the cut shape). */
	sil: string;
	/** The face: the white border and the art. */
	face: string;
	/** The sheen layer, masked to the sticker. */
	sheen: string;
	/** Half its larger side, border included. */
	extent: number;
}

/** Where and how a sticker is drawn. */
export interface StickerPlace {
	x: number;
	y: number;
	/** Its turn, in degrees (0). */
	angle?: number;
	/** Pixels per mm. */
	mm: number;
	/** Where the light is. */
	light: number;
	/** How far it's off the surface, 0–3 (0.1). */
	lift?: number;
	/** How dark its shadows are; 0 leaves them out (1). */
	shadow?: number;
	/** A peeled corner: the direction it's peeled towards (degrees, in the sticker's frame) and how much of it is lifted (0.05–0.6). */
	peel?: { direction: number; depth: number } | null;
}

/** The shapes a sticker can be cut to. */
export const STICKER_SHAPES: readonly StickerShape[];
/** A sticker's art, silhouette and face, defined once. */
export function defineSticker(sc: Scene, o: StickerSpec): StickerDef;
/** A silhouette painted one colour (keeping its alpha), as a `<use>`. */
export function tinted(sc: Scene, id: string, color: string, attrs?: Record<string, string | number>): string;
/** A sticker drawn: shadows, raised edge, face, sheen, and a peeled corner folded back. */
export function drawSticker(sc: Scene, def: StickerDef, o: StickerPlace): string;
/** A kiss-cut slot on a sticker sheet's liner. */
export function slot(sc: Scene, def: StickerDef, o: { x: number; y: number; angle?: number; mm: number; liner: string }): string;
