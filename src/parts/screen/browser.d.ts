import type { Art } from '../../types.js';
import type { Scene } from '../../render/scene.js';
import type { Fit } from '../../render/fit.js';

/** A browser window's options. */
export interface BrowserWindow {
	/** Its width (1600 units is a laptop's). */
	width: number;
	/** Its height. */
	height: number;
	/** The page. */
	page: Art;
	/** The address shown. */
	domain: string;
	/** The tab's title (the domain). */
	title?: string;
	/** The tab's icon (a plain globe). */
	icon?: Art;
	/** How the page fills the window (`'top'`). */
	fill?: Fit;
	/** The window's theme (`'light'`). */
	theme?: 'light' | 'dark';
}

/** A generic browser window (one tab, plain controls, the domain in the address field) over the page, in `[0, width] × [0, height]`. */
export function browserWindow(sc: Scene, o: BrowserWindow): string;
