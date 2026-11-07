import type { Art } from '../types.js';

/** How a halftone print is made. */
export interface HalftonePrintOptions {
	/** The ink, a hex colour (`'#161616'`). */
	ink?: string;
	/** The print's canvas, in pixels (1200 × 1200); the art is fitted whole. */
	width?: number;
	height?: number;
	/** The dot pitch, a length `halftoneFade` reads (`'1.4vmin'`, or pixels). */
	cell?: string | number;
	/** Where along the fade the dots begin (0.3) and where the ink has gone (0.92), 0 at the middle, 1 at the edges' middles. */
	start?: number;
	end?: number;
	/** The dot (`'dot'`, `'square'`, `'diamond'`) and the screen (`'diamond'`, turned 45°, or `'square'`). */
	shape?: 'dot' | 'square' | 'diamond';
	grid?: 'diamond' | 'square';
	/** Which way it fades out (`'radial'`: towards every edge). */
	direction?: 'radial' | 'up' | 'down' | 'left' | 'right';
	/** Dot sizes varied and a few strays, 0–1 (0.15). */
	jitter?: number;
	/** Seeds the jitter. */
	seed?: string | number;
	/** sharp, in Node (the dots are drawn on pixels). */
	sharp?: unknown;
}

/** A halftone print: the art in one ink, solid in the middle and fading out through a dot screen towards its edges (`@logomarks/image-effects`' `halftoneFade`). Resolves to an SVG to pass to `plate()` as `art`. */
export function halftonePrint(art: Art, options?: HalftonePrintOptions): Promise<string>;
