import type { Art } from '../types.js';
import type { Scene } from '../render/scene.js';
import type { Fit } from '../render/fit.js';

/** Art (or a drawing) on a flat face seen in perspective. */
export interface ArtFace {
	/** The face's units to pixels, from its top-left corner. */
	map: (x: number, y: number) => [number, number];
	/** The face's width, in its units. */
	width: number;
	/** Its height. */
	height: number;
	/** The art. */
	art?: Art;
	/** How the art fills the face (`'cover'`). */
	fill?: Fit;
	/** What shows round art that doesn't fill it (`'#ffffff'`). */
	background?: string;
	/** Draws the face instead, in `[0, w] × [0, h]`. */
	draw?: (w: number, h: number) => string;
	/** The warp's largest error in pixels (0.75); a texture can take more, and draws faster. */
	tolerance?: number;
	/** The most cells along the longer side (28); fewer for a texture. */
	max?: number;
}

/** Art fitted into a drawing of the face's proportions, warped onto the face. */
export function artFace(sc: Scene, o: ArtFace): string;
