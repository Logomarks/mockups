import type { Scene } from '../render/scene.js';

/** A rope along a path, in the path's own frame. */
export interface RopePart {
	/** The path it follows. */
	d: string;
	/** Its thickness. */
	width: number;
	/** Its colour. */
	color: string;
	/** Where the light is, left (-1) to right (1). */
	light: number;
	/** How much darker it's drawn (a rope in shadow, behind the bag), 0–1 (0). */
	shade?: number;
	/** The panel its shadow falls on (from 0, 0), or `null` for no shadow. */
	clip?: { width: number; height: number } | null;
	/** Scales the shadow's softness (1). */
	blurUnit?: number;
}

/** A twisted rope along a path, and its shadow on the panel behind. */
export function rope(sc: Scene, o: RopePart): string;
