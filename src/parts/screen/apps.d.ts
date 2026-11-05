import type { Art } from '../../types.js';
import type { Scene } from '../../render/scene.js';

/** A glyph's name. */
export type Glyph = 'wave' | 'lines' | 'ring' | 'dots' | 'half' | 'grid' | 'arcs' | 'plus' | 'bars' | 'diamond';

/** A generic app: its tile's colour and its abstract glyph (white, or dark on a light tile). */
export interface App {
	readonly color: string;
	readonly glyph: Glyph;
}

/** A close home screen's options. */
export interface AppsScreen {
	/** Its width (1080 units is a phone's). */
	width: number;
	/** Its height. */
	height: number;
	/** The brand's mark, on its app's tile (one drawn in `currentColor` takes `ink`). */
	mark: Art;
	/** The brand's app's name. */
	name: string;
	/** The brand's tile. */
	color: string;
	/** The mark's ink on it. */
	ink: string;
	/** The wallpaper's colour (a soft gradient from it); the type is white on a dark one, near-black on a light one. */
	wallpaper: string;
	/** The time in the status bar (`'9:41'`). */
	time?: string;
	/** The camera hole's radius, in the screen's units (0: none). */
	hole?: number;
}

/** The generic apps, in order after the brand's. */
export const APPS: readonly App[];
/** The glyphs' names. */
export const GLYPHS: readonly Glyph[];
/** A glyph in a 100-unit box. */
export function glyph(name: Glyph, ink: string): string;
/** A generic app's tile with its glyph. */
export function appTile(sc: Scene, app: App, box: { x: number; y: number; size: number }): string;
/** A home screen with the brand's app first among generic apps (abstract glyphs, their names soft bars), in `[0, width] × [0, height]`. */
export function appsScreen(sc: Scene, o: AppsScreen): string;
