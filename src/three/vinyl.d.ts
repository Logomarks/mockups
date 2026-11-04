import type { VinylOptions } from '../objects/vinyl.js';
import type { View } from './view.js';
import type { Shot } from './shot.js';

/** A 3D vinyl scene's options: the 2D `vinyl` options (the art inline: bytes, SVG or a `data:` URI), the layout and the view. */
export interface VinylSceneOptions extends Omit<VinylOptions, 'size' | 'sheen' | 'grain'> {
	/** Standing on a paper sweep, the records behind the sleeve (`'upright'`, the default), or lying flat on the ground (`'flat'`). */
	layout?: 'upright' | 'flat';
	/** The drawing's width in CSS pixels (the canvas's own by default). */
	width?: number;
	/** The drawing's height in CSS pixels (the canvas's own by default). */
	height?: number;
	/** Device pixels per CSS pixel (1). */
	pixelRatio?: number;
	/** Where the camera is (front on: level for `'upright'`, straight down for `'flat'`). */
	view?: View;
	/** The tone mapping's exposure (by default it's measured, so bare ground comes out the ground's colour). */
	exposure?: number;
}

/** A drawn 3D vinyl scene. */
export type VinylScene = Shot;

/** A vinyl scene on a canvas, with three.js loaded on first use; drawn once, then on demand. Rejects with a TypeError for a bad option. */
export function vinylScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: VinylSceneOptions): Promise<VinylScene>;
