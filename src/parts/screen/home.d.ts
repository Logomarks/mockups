import type { Art } from '../../types.js';
import type { Scene } from '../../render/scene.js';

/** A home screen's options. */
export interface HomeScreen {
	/** Its width (1080 units is a phone's). */
	width: number;
	/** Its height. */
	height: number;
	/** The brand's app icon. */
	icon: Art;
	/** The app's name, under its icon. */
	name: string;
	/** A hex colour (a soft gradient from it) or art (`'#56677f'`). */
	wallpaper?: Art;
	/** The icon's colour behind the mark. */
	background?: string;
	/** Space round the mark, as a fraction of the icon (0: the art fills it). */
	padding?: number;
	/** Which slot the brand's app takes, 0 at the top left (5). */
	slot?: number;
	/** Seeds the placeholders. */
	seed?: string;
}

/** The placeholder apps' muted colours. */
export const MUTED: readonly string[];
/** The grid: columns, rows above the dock, and the brand's default slot. */
export const HOME: Readonly<{ columns: number; rows: number; slot: number }>;
/** A home screen with the brand's app among placeholders, in `[0, width] × [0, height]`. */
export function homeScreen(sc: Scene, o: HomeScreen): string;
