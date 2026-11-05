import type { Art } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';
import type { StreetTime } from './streetenv.js';
import type { Three } from './textures.js';

/** The frame's finishes by name: glossy black, crystal grey, warm brown. */
export const SUNGLASS_FRAMES: Readonly<{ black: string; smoke: string; havana: string }>;
/** The lenses: dark smoke glass, or a mirror coating. */
export const SUNGLASS_LENSES: readonly ['smoke', 'mirror'];
/** The glasses, in mm: a lens's half-width and half-height, the rim (top, sides, bottom), the bridge, the frame's depth, the temples' length, and the lenses' curve (radius). */
export const GLASSES: Readonly<{ a: number; b: number; top: number; side: number; bottom: number; bridge: number; depth: number; temple: number; curve: number }>;

/** A sunglasses scene's options. */
export interface SunglassesSceneOptions extends PrintShotOptions, LensOptions {
	/** What the lenses reflect: a poster, a cover, any artwork (inline: bytes, SVG or a `data:` URI). Required. */
	art: Art;
	/** The street's light: `'day'` (the default), `'golden'` or `'dusk'`. */
	time?: StreetTime;
	/** `'smoke'` (dark glass, the default) or `'mirror'` (a mirror coating, brighter). */
	lens?: (typeof SUNGLASS_LENSES)[number];
	/** `'black'` (the default), `'smoke'`, `'havana'` or hex. */
	frame?: keyof typeof SUNGLASS_FRAMES | string;
	/** The ledge they rest on (`'concrete'`). */
	surface?: SurfaceOption;
	/** Seeds the street and the ledge (`'sunglasses'`). */
	seed?: string;
}

/** How far a point on a lens (or its rim), `x` across and `y` up in mm from the lens's centre, sits behind the centre: the lens is a sphere's cap. */
export function sag(x: number, y: number): number;
/** A lens's outline at angle `t` (radians), in mm: x outward to the temple's side, y up. */
export function lensPoint(t: number): [number, number];
/** The outline sampled evenly, each point (mm) with its outward normal. */
export function lensOutline(steps: number): { p: [number, number]; n: [number, number] }[];
/** The glasses resting on the ground (y = 0): their group, width and height, the point to look at and the near lens's centre. */
export function glassesMesh(
	THREE: Three,
	Rounded: typeof import('three/addons/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry,
	o: { acetate: import('three').Material; glass: import('three').Material; u: number },
): { group: import('three').Group; width: number; height: number; center: [number, number, number]; focus: [number, number, number] };

/** A pair of sunglasses resting on a ledge, the artwork reflected in their curved dark lenses (a poster in the street behind the camera), the street blurred behind them. */
export function sunglassesScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: SunglassesSceneOptions): Promise<Shot>;
