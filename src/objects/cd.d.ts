import type { Art, Ground, Mockup, Size } from '../types.js';
import type { Box } from '../util/fit.js';

/** How to show artwork on a CD. */
export interface CdOptions {
	/** The cover: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** A jewel case (142 × 125 mm, the booklet under a clear lid) or a digipak (139.7 × 124.5, printed edge to edge) (`'jewel'`). */
	packaging?: 'jewel' | 'digipak';
	/** The disc's face: printed with the cover (`'art'`), bare `'silver'`, or artwork of its own. */
	disc?: 'art' | 'silver' | Art;
	/** Where the disc comes out (`'right'`). */
	side?: 'left' | 'right';
	/** How much of the disc's diameter shows past the case, 0–0.9 (0.5); 0 hides it. */
	peek?: number;
	/** The jewel case's tray (`'black'`). */
	tray?: 'black' | 'clear';
	/** What it lies on (`'light'`). */
	ground?: Ground;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the group fills, 0.2–1 (0.86). */
	fit?: number;
	/** Film grain, 0–1 (0.2). */
	grain?: number;
	/** Seeds the grain and how the disc is turned (`'cd'`). */
	seed?: string;
}

/** The packagings. */
export const PACKAGINGS: readonly ['jewel', 'digipak'];
/** Where the case (its top left at the origin) and the disc's centre go, in mm, and the extent of both. */
export function cdLayout(packaging: 'jewel' | 'digipak', side: 'left' | 'right', peek: number): { w: number; h: number; disc: [number, number]; box: Box };
/** A CD mockup as layered SVG. Throws a TypeError for a bad option. */
export function cd(options: CdOptions): Mockup;
