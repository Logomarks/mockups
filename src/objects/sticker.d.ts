import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { StickerShape } from '../parts/sticker.js';

/** Where the sticker is shown. */
export type StickerLayout = 'laptop' | 'bottle' | 'sheet';

/** How to show a sticker. */
export interface StickerOptions {
	/** The sticker's art: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** More stickers: on a sheet they fill the other slots, on a laptop up to two go beside the first. */
	extra?: Art[];
	/** `'laptop'` (on a closed laptop's lid; the default), `'bottle'` (wrapped round a water bottle) or `'sheet'` (kiss-cut on a sheet, one part peeled). */
	layout?: StickerLayout;
	/** The cut: `'circle'` (the default), `'rounded'` (a rounded square) or `'contour'` (round the art's own outline, for art on a clear ground). */
	shape?: StickerShape;
	/** The art's size in mm, inside the border, 10–200 (64; on a bottle 56, on a sheet 54). */
	diameter?: number;
	/** The white border, mm, 0–12 (2.5). */
	border?: number;
	/** The bleed the art carries round its cut, mm (0; `@arraypress/covers` stickers carry 2). */
	bleed?: number;
	/** The laptop lid: `'silver'` (the default), `'graphite'` or a hex colour. */
	lid?: 'silver' | 'graphite' | `#${string}`;
	/** The bottle's powder coat (`'#2e4a3f'`). */
	color?: string;
	/** Turns the bottle, in degrees (0). */
	turn?: number;
	/** What it lies or stands on (a laptop `'oak'`, a bottle `'concrete'`, a sheet `'linen'`). */
	surface?: SurfaceOption;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the scene fills (a laptop 1, cropping the lid round the sticker; otherwise 0.86). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the surface (`'sticker'`). */
	seed?: string;
}

/** The layouts. */
export const STICKER_LAYOUTS: readonly StickerLayout[];
/** The lid colours by name. */
export const LIDS: Readonly<{ silver: string; graphite: string }>;
/** A sticker mockup as layered SVG. Throws a TypeError for a bad option. */
export function sticker(options: StickerOptions): Mockup;
