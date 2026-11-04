import type { Art } from '../types.js';
import type { CdOptions } from '../objects/cd.js';
import type { View } from './view.js';
import type { Shot } from './shot.js';

/** A 3D CD scene's options: the 2D `cd` options (the art inline: bytes, SVG or a `data:` URI), the layout and the view. */
export interface CdSceneOptions extends Omit<CdOptions, 'size' | 'grain' | 'seed' | 'shadow'> {
	/** Standing on a paper sweep, the disc behind the case (`'upright'`, the default), or lying flat (`'flat'`). */
	layout?: 'upright' | 'flat';
	/** The drawing's width in CSS pixels (the canvas's own by default). */
	width?: number;
	/** The drawing's height in CSS pixels (the canvas's own by default). */
	height?: number;
	/** Device pixels per CSS pixel (1). */
	pixelRatio?: number;
	/** Where the camera is (front on). */
	view?: View;
	/** The tone mapping's exposure (measured by default, so bare ground comes out its own colour). */
	exposure?: number;
}

/** A disc's face drawn by the 2D disc part onto a canvas (1024 square by default). */
export function discCanvas(art: Art, face: 'art' | 'silver' | Art, size?: number): Promise<HTMLCanvasElement>;
/** A CD scene on a canvas, with three.js loaded on first use; drawn once, then on demand. Rejects with a TypeError for a bad option. */
export function cdScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: CdSceneOptions): Promise<Shot>;
