import type { Art } from '../types.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';
import type { Three } from './textures.js';
import type { BodyName } from '../materials/body.js';

/** The shots: a macro of the top corner, or two phones on a tiled wall. */
export type PhoneSceneLayout = 'corner' | 'pair';
/** What the pair's screens show: the brand's page and its menu (from the mark), or the art and `back` as screenshots. */
export type PhoneScreen = 'ui' | 'art';

/** A phone scene's options. */
export interface PhoneSceneOptions extends PrintShotOptions, LensOptions {
	/** The brand's mark (inline: bytes, SVG or a `data:` URI; one drawn in `currentColor` takes `ink`), or with `screen: 'art'` the first screenshot. Required. */
	art: Art;
	/** The second screenshot of a pair (it sets `screen: 'art'`). */
	back?: Art;
	/** `'corner'` (the default) or `'pair'`. */
	layout?: PhoneSceneLayout;
	/** The pair's screens: `'ui'` (the default without `back`) or `'art'`. */
	screen?: PhoneScreen;
	/** How screenshots fill a screen: `'cover'` (the default) or `'top'` (the width filled, read from the top). */
	fill?: 'cover' | 'top';
	/** The brand's name: its app's label, its page's header and headline (`'Brand'`). */
	name?: string;
	/** The brand's colour: its app's tile and its page's header bar (`'#1f5c4c'`). */
	color?: string;
	/** The mark's ink on its tile (near-white or near-black, by the colour). */
	ink?: string;
	/** The surface under the corner (a deep shade of `color`), or the pair's tiles (`'#f2b134'`). */
	background?: string;
	/** The home screen's wallpaper (near-black). */
	wallpaper?: string;
	/** The frame: `'graphite'` (the corner's default), `'silver'` (the pair's), `'white'`, `'black'` or hex. */
	finish?: BodyName | string;
	/** Seeds the copy (`'phone'`). */
	seed?: string;
}

/** The shots. */
export const PHONE_SCENE_LAYOUTS: readonly PhoneSceneLayout[];
/** What the pair's screens show. */
export const PHONE_SCREENS: readonly PhoneScreen[];
/** The pair's wall tiles, in mm: width, height, grout, depth. */
export const TILE: Readonly<{ width: number; height: number; grout: number; depth: number }>;

/** Where the brand's app icon's centre is on the phone's face, in mm from its centre (y up). */
export function iconPoint(): [number, number];
/** A wall's tiles, centred on the origin, row by row: each centre (mm) and its shade (−1–1), the same every time. */
export function tileGrid(o: { width: number; height: number }): { x: number; y: number; shade: number }[];
/** The phone's face: black glass, and the screen drawn by `draw` inside its bezel and rounded corners. Browser only. */
export function faceCanvas(draw: (sc: import('../render/scene.js').Scene, w: number, h: number) => string, key: string): Promise<HTMLCanvasElement>;
/** A phone standing, its screen facing +z, centred on the origin. */
export function phoneMesh(
	THREE: Three,
	Rounded: typeof import('three/addons/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry,
	o: { face: import('three').Texture; metal: import('three').Material; u: number },
): import('three').Group;
/** A phone on a canvas: a macro of its corner with the brand's app in focus, or two phones before a tiled wall. */
export function phoneScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: PhoneSceneOptions): Promise<Shot>;
