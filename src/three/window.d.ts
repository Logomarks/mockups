import type { Art } from '../types.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';
import type { StreetTime } from './streetenv.js';

/** The vinyls by name: white, and gold leaf. */
export const WINDOW_VINYLS: Readonly<{ white: string; gold: string }>;
/** The window, in mm: the pane, the frame's width and depth, the sill's height, and the lettering's widest. */
export const SHOP_WINDOW: Readonly<{ pane: readonly [number, number]; frame: number; depth: number; sill: number; lettering: number }>;

/** A window scene's options. */
export interface WindowSceneOptions extends PrintShotOptions, LensOptions {
	/** The brand's mark (inline: bytes, SVG or a `data:` URI). Required. */
	art: Art;
	/** The brand's name, cut under the mark. */
	name?: string;
	/** `'white'` (matte vinyl, the default), `'gold'` (gilt: the street in its metal) or hex. */
	vinyl?: keyof typeof WINDOW_VINYLS | string;
	/** The joinery's paint (`'#1e2a25'`). */
	color?: string;
	/** The street's light: `'day'` (the default), `'golden'` or `'dusk'`. */
	time?: StreetTime;
	/** The front round the window: `'brick'` (the default), `'plaster'` or hex. */
	wall?: 'brick' | 'plaster' | string;
	/** How strongly the glass reflects the street, 0–3 (1). */
	glare?: number;
	/** Seeds the street, the terrace across it and the café (`'window'`). */
	seed?: string;
}

/** The brand in vinyl on a shop window: the glass reflecting the sunlit terrace across the road, a dim café out of focus behind the lettering, painted timber joinery in a brick front. */
export function windowScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: WindowSceneOptions): Promise<Shot>;
