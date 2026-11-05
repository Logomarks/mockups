import type { Art } from '../../types.js';
import type { Scene } from '../../render/scene.js';

/** A splash's field: a glow across from the top, light falling in from both sides (a stage's screen), or a deep corner. */
export type SplashStyle = 'glow' | 'stage' | 'corner';

/** A brand splash's options. */
export interface Splash {
	/** Its width. */
	width: number;
	/** Its height. */
	height: number;
	/** The brand's mark (one drawn in `currentColor` takes `ink`). */
	mark: Art;
	/** The name beside it (none: the mark alone). */
	name?: string;
	/** The field's colour. */
	color: string;
	/** The lockup's ink (near-white on a dark or mid colour, near-black on a light one). */
	ink?: string;
	/** `'glow'` (the default), `'stage'` or `'corner'`. */
	style?: SplashStyle;
	/** The mark's height, as a share of the screen's (0.3). */
	scale?: number;
}

/** The fields. */
export const SPLASH_STYLES: readonly SplashStyle[];
/** A screen given over to the brand: a soft field of its colour, its lockup in the middle, in `[0, width] × [0, height]`. */
export function splashScreen(sc: Scene, o: Splash): string;
