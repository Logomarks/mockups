import type { Art } from '../types.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';

/** The wall, in mm: an enamel panel, the joint between panels, the skirting's height, the frame's rail and the box's depth. */
export const STATION: Readonly<{ panel: readonly [number, number]; joint: number; skirting: number; rail: number; depth: number }>;
/** The poster's height, the composed poster's size, and the widest a poster may be, in mm. */
export const LIGHTBOX: Readonly<{ height: number; type: readonly [number, number]; widest: number }>;
/** The wall's tiles by name: cream enamel, white, green. */
export const STATION_WALLS: Readonly<{ cream: string; white: string; green: string }>;

/** A lightbox scene's options. */
export interface LightboxSceneOptions extends PrintShotOptions, LensOptions {
	/** The poster (inline: bytes, SVG or a `data:` URI), or, with `layout: 'type'`, the brand's mark. Required. */
	art: Art;
	/** `'art'` (the art fills the face) or `'type'` (a type poster composed from the mark, `name`, `headline` and `url`, its grid showing). `'type'` when a `name` is given. */
	layout?: 'art' | 'type';
	/** The brand's name, beside the mark on a type poster. */
	name?: string;
	/** A type poster's headline (`'Made for the way you move.'`). */
	headline?: string;
	/** An address at a type poster's bottom right. */
	url?: string;
	/** A type poster's colour (`'#12201f'`). */
	color?: string;
	/** A type poster's ink, for the type and the grid (`'#8fe3c6'`). */
	ink?: string;
	/** The wall's tiles: `'cream'` (the default), `'white'` or `'green'`. */
	wall?: keyof typeof STATION_WALLS;
	/** How brightly the box burns, 0–3 (1): its face, its spill on the wall and floor. */
	glow?: number;
	/** Seeds the panels' tones and grime (`'lightbox'`). */
	seed?: string;
}

/** The poster's size in mm for the art's proportions: 1016 mm high, between 0.6 and 3 times as wide. */
export function posterSize(aspect: number): [number, number];
/** The enamel panels covering a wall (mm, centred on x = 0, up from the floor): each one's centre, tone (−1–1) and tilt (radians about x and y). */
export function panelGrid(o: { width: number; height: number; seed: string }): { x: number; y: number; tone: number; tilt: [number, number] }[];

/** A backlit poster in a slim metal frame on an underground station's wall of cream enamel panels, its glow spilling onto the wall and the tiled floor. */
export function lightboxScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: LightboxSceneOptions): Promise<Shot>;
