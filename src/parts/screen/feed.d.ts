import type { Art } from '../../types.js';
import type { Scene } from '../../render/scene.js';

/** A feed post's options. */
export interface FeedScreen {
	/** Its width (1080 units is a phone's). */
	width: number;
	/** Its height. */
	height: number;
	/** The post's image, at its own proportions from 4:5 to 1.91:1. */
	post: Art;
	/** The brand's avatar. */
	avatar: Art;
	/** The brand's name. */
	name: string;
	/** The line under the name (`'@'` and the name, slugged). */
	handle?: string;
	/** Light or dark (`'light'`). */
	theme?: 'light' | 'dark';
	/** Seeds the placeholders. */
	seed?: string;
}

/** A generic feed post: byline, image, action chips, placeholder caption, tab bar, in `[0, width] × [0, height]`. */
export function feedScreen(sc: Scene, o: FeedScreen): string;
