import type { Art, Ground, Mockup, Size } from '../types.js';
import type { Box } from '../util/fit.js';
import type { ShellSpec } from '../parts/cassette/shell.js';

/** How to show artwork on a cassette. */
export interface CassetteOptions {
	/** The cover: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** The shell's plastic (`'black'`). */
	shell?: ShellSpec;
	/** The shell's label: a band of the cover (`'crop'`, through its quietest window when `loadArt` measured it), `'blur'`, `'plain'`, or artwork of its own. */
	label?: 'crop' | 'blur' | 'plain' | Art;
	/** The label's paper (`'#f3f1ec'`). */
	paper?: `#${string}`;
	/** The title on the J-card and the label (none). */
	title?: string;
	/** Which side of the case the tape lies (`'right'`). */
	side?: 'left' | 'right';
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
	/** Seeds the grain (`'cassette'`). */
	seed?: string;
}

/** Where the case and the tape go (each one's top left, in mm) and the extent of both. */
export function cassetteLayout(side: 'left' | 'right'): { box: [number, number]; tape: [number, number]; extent: Box };
/** A cassette mockup as layered SVG. Throws a TypeError for a bad option. */
export function cassette(options: CassetteOptions): Mockup;
