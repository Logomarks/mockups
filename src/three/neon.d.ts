import type { Art } from '../types.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';

/** Neon colours by name. */
export const NEON_COLORS: Readonly<{ pink: string; red: string; orange: string; yellow: string; green: string; blue: string; white: string }>;
/** The sign, in mm: the mark's width, the tube's diameter, its standoff from the wall, and the standoffs' spacing. */
export const NEON: Readonly<{ size: number; tube: number; standoff: number; spacing: number }>;

/** A neon scene's options. */
export interface NeonSceneOptions extends PrintShotOptions, LensOptions {
	/** The mark as SVG (markup, a `data:` URI or bytes): the tubes follow its outlines. Required. */
	art: Art;
	/** The neon's colour: a name from `NEON_COLORS` or hex (`'pink'`). */
	color?: keyof typeof NEON_COLORS | string;
	/** The wall: `'brick'` (the default), `'plaster'` or hex (painted plaster). */
	wall?: 'brick' | 'plaster' | string;
	/** The mark's width in mm, 200–3000 (700). */
	size?: number;
	/** How brightly it burns, 0–3 (1): the tubes, their light on the wall, their bloom. */
	glow?: number;
	/** Seeds the wall (`'neon'`). */
	seed?: string;
}

/** The tubes a mark is bent into, in mm round the sign's centre (y up): each outline long enough to bend, resampled and smoothed. Throws a TypeError when the SVG has no paths. */
export function neonTubes(svg: string, o?: { size?: number; tube?: number }): { points: [number, number][]; closed: boolean }[];
/** Points spread evenly along tubes, `spacing` mm apart. */
export function alongTubes(tubes: { points: [number, number][]; closed: boolean }[], spacing: number): [number, number][];
/** Art as SVG markup, or null for a raster. */
export function svgMarkup(art: Art): string | null;

/** A neon sign on a wall in a dim room: the mark bent in glass tube along its outlines, burning with a pale core, its light raking the bricks round it and blooming in the air. */
export function neonScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: NeonSceneOptions): Promise<Shot>;
