import type { Art } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { PrintShotOptions } from './printshot.js';
import type { Shot } from './shot.js';

/** How the print sits: `'auto'` (wide art wraps, other art is a front piece), a piece on the `'front'`, on `'both'` sides, or a `'wrap'` round to the handle. */
export type MugPrint = 'auto' | 'front' | 'both' | 'wrap';

/** A 3D mug scene's options. */
export interface MugSceneOptions extends PrintShotOptions {
	/** The print (inline: bytes, SVG or a `data:` URI). Required. */
	art: Art;
	/** How it sits (`'auto'`). */
	print?: MugPrint;
	/** One mug (`'single'`) or a `'pair'`, the second turned to show its back. */
	layout?: 'single' | 'pair';
	/** Which side the handle is on, seen from the front (`'right'`). */
	handle?: 'left' | 'right';
	/** The glaze's colour (`'#f6f5f1'`). */
	color?: string;
	/** The inside and rim's colour (the glaze's). */
	inside?: string;
	/** What it stands on (`'light'`: a seamless sweep); a texture lays a desk on the floor. */
	surface?: SurfaceOption;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the contact shadow is, 0–3 (1). */
	shadow?: number;
	/** Degrees to turn the mugs on their own axes (0); positive carries the front off to the right, away from a right-hand handle. They turn with the camera's `view.turn`, so the print faces the camera; spin them to show the handle (-70 with it on the right) or the back. */
	spin?: number;
	/** Seeds the desk (`'mug'`). */
	seed?: string;
}

/** An 11 oz mug in mm: outer radius 41, height 95, the printed band from 4 to 92.5, a 3.4 mm wall. */
export const MUG: Readonly<{ radius: number; height: number; band: readonly [number, number]; wall: number }>;
/** The print options. */
export const MUG_PRINTS: readonly MugPrint[];
/** How a print sits, from its proportions (width over height). */
export function printMode(print: MugPrint, aspect: number): 'front' | 'both' | 'wrap';
/** Where the art goes on the printed band, in mm from its left edge (the mug's back) and top; the front is the band's middle. */
export function decalBoxes(mode: 'front' | 'both' | 'wrap', aspect: number, handle: 'left' | 'right'): { x: number; y: number; w: number; h: number }[];
/** The printed band as a canvas (8 px per mm): the glaze's colour with the art laid on it. */
export function decalCanvas(art: Art, o: { mode: 'front' | 'both' | 'wrap'; aspect: number; handle: 'left' | 'right'; color: string; px?: number }): Promise<HTMLCanvasElement>;
/** One mug (scene units): footed base, printed wall, rim and inside, handle; standing on y = 0, its front towards +z. */
export function mugMesh(
	THREE: typeof import('three'),
	o: { glaze: import('three').Material; inner: import('three').Material; printed: import('three').Material; handle: 'left' | 'right' },
): import('three').Group;
/** A glossy, clearcoated ceramic glaze (with a print on it, or not). */
export function glazeMaterial(THREE: typeof import('three'), color: string, map?: import('three').Texture | null): import('three').MeshPhysicalMaterial;
/** A mug in 3D on a canvas, three.js loaded on first use; drawn once, then on demand. Rejects with a TypeError for a bad option. */
export function mugScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: MugSceneOptions): Promise<Shot>;
