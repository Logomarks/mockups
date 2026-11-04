import type { Scene, PlaceArt } from '../render/scene.js';
import type { Stock } from '../materials/paper.js';

/** A flat printed sheet, in pixels. */
export interface SheetPart {
	/** Its centre, x. */
	cx: number;
	/** Its centre, y. */
	cy: number;
	/** Its width. */
	w: number;
	/** Its height. */
	h: number;
	/** Its turn, in degrees (0). */
	angle?: number;
	/** Its corners' radius (0). */
	radius?: number;
	/** Its outline as path data centred on the origin, in place of the rounded rectangle. */
	d?: string;
	/** The art, drawn into the sheet's box (`-w/2, -h/2, w, h`) and cut to its outline. */
	art?: PlaceArt | null;
	/** Markup drawn over the art, under the finish, in the sheet's own frame (centred on the origin). */
	overlay?: string;
	/** The stock. */
	stock: Stock;
	/** The paper's colour where there's no art (the stock's). */
	color?: string;
	/** Its edge's colour (the paper's, a shade darker; a painted edge's colour). */
	edge?: string | null;
	/** Pixels per millimetre. */
	mm: number;
	/** Where the light is, left (-1) to right (1). */
	light: number;
	/** How thick it is, in pixels: the band of edge shown below it (0). */
	thickness?: number;
	/** How far it's off the surface, 0–3 (0.25). */
	lift?: number;
	/** How dark its shadows are (1). */
	shadow?: number;
	/** Whether to draw the stock's finish (true); a sheet that's mostly hidden can leave it out. */
	finish?: boolean;
	/** Seeds the paper's tooth. */
	seed?: number;
}

/** A rounded rectangle as path data, centred on the origin. */
export function outline(w: number, h: number, r?: number): string;
/** The three soft shadows a flat thing casts, in screen space (away from the light, spreading with `lift`). */
export function flatShadow(sc: Scene, o: { d: string; cx: number; cy: number; angle?: number; mm: number; light: number; lift?: number; strength?: number }): string;
/** A sheet and its shadows. */
export function sheet(sc: Scene, o: SheetPart): string;
