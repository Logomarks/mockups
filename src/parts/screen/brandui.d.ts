import type { Art } from '../../types.js';
import type { Scene } from '../../render/scene.js';

/** The page, or the page with its menu open. */
export type BrandUiState = 'page' | 'menu';

/** A brand page's options. */
export interface BrandUi {
	/** Its width (1080 units is a phone's). */
	width: number;
	/** Its height. */
	height: number;
	/** The brand's mark (set in light ink on the header bar). */
	mark: Art;
	/** The brand's name: in the header and the headline. */
	name: string;
	/** The header bar's colour (a light colour gives a near-black bar). */
	color: string;
	/** `'page'` (the default) or `'menu'`. */
	state?: BrandUiState;
	/** Seeds the copy's bars. */
	seed?: string;
}

/** The states. */
export const BRAND_UI_STATES: readonly BrandUiState[];
/** The menu's items. */
export const MENU: readonly string[];
/** The brand's small site on a phone: header bar with its lockup, headline, copy as soft bars and a button; or its menu open over it. In `[0, width] × [0, height]`. */
export function brandUi(sc: Scene, o: BrandUi): string;
