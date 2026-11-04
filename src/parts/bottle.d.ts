import type { Scene } from '../render/scene.js';

/** A bottle, in pixels (its print's placement in mm). */
export interface BottlePart {
	/** Its axis, x. */
	cx: number;
	/** Where its foot's centre is, y. */
	base: number;
	/** Pixels per mm. */
	mm: number;
	/** The powder coat's colour. */
	color: string;
	/** Where the light is, left (-1) to right (1). */
	light: number;
	/** How dark its shadows are (1). */
	shadow?: number;
	/** The cap's colour (`'#1b1b1d'`). */
	cap?: string;
	/** A print wrapped round the body: a `<g>` id in the defs (drawn flat, centred on x = 0, its top at y = 0), the height of its centre above the foot and its own height in mm, and the bottle's turn. */
	print?: { content: string; center: number; height: number; turn?: number } | null;
	/** The view's elevation in degrees (10). */
	elevation?: number;
}

/** A 750 ml bottle's measurements in mm. */
export const BOTTLE: Readonly<{ diameter: number; shoulder: number; neck: number; neckAt: number; cap: number; height: number }>;
/** A bottle and its shadows. */
export function bottle(sc: Scene, o: BottlePart): string;
