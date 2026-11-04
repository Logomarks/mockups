import type { Art, Mockup, Size } from '../types.js';
import type { WallSpec } from '../materials/wall.js';
import type { FrameName } from '../parts/poster/frame.js';

/** An A-series sheet. */
export type PaperName = 'A1' | 'A2' | 'A3' | 'A4' | 'A5';
/** How a poster goes up. */
export type Mount = 'tape' | 'wheatpaste' | 'pole' | 'frame';

/** How to show artwork as a poster. */
export interface PosterOptions {
	/** The poster: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** Taped at the corners (`'tape'`), `'wheatpaste'`d (creased, torn, taking the wall's texture), flyposted round a `'pole'`, or in a `'frame'`. */
	mount?: Mount;
	/** The sheet, for its size (A2 taped, A1 pasted, A4 on a pole, A3 framed). */
	paper?: PaperName;
	/** The print's proportions: the art's own (`'art'`), or the sheet's, the art cropped to fill it (`'paper'`). */
	aspect?: 'art' | 'paper';
	/** The wall: `'plaster'` (the default; `'brick'` behind a pole), `'brick'`, or a hex colour (painted plaster). */
	wall?: WallSpec;
	/** The frame's moulding (`'black'`). */
	frame?: FrameName;
	/** The mat's border as a share of the print's shorter side, 0–0.3 (0.12); 0 for none. */
	mat?: number;
	/** How many flyers on a pole, 1–6 (3). */
	count?: number;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the poster fills, 0.2–1 (by mount: 0.66 taped, 0.74 pasted, 0.82 on a pole, 0.7 framed). */
	fit?: number;
	/** Film grain, 0–1 (0.2). */
	grain?: number;
	/** Seeds the wall, the tears, creases and flyers (`'poster'`). */
	seed?: string;
}

/** A-series sheets, width × height in mm. */
export const PAPERS: Readonly<Record<PaperName, readonly [number, number]>>;
/** How a poster goes up. */
export const MOUNTS: readonly ['tape', 'wheatpaste', 'pole', 'frame'];
/** The print's size in mm: these proportions (width over height) with the sheet's long side. */
export function printSize(paper: PaperName, aspect: number): [number, number];
/** A poster mockup as layered SVG. Throws a TypeError for a bad option. */
export function poster(options: PosterOptions): Mockup;
