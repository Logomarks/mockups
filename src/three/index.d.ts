import type { VinylOptions } from '../objects/vinyl.js';
import type { View } from './view.js';

export type { View } from './view.js';

/** A 3D vinyl scene's options: the 2D `vinyl` options (the art inline: bytes, SVG or a `data:` URI), and the view. */
export interface VinylSceneOptions extends Omit<VinylOptions, 'size' | 'sheen' | 'grain'> {
	/** The drawing's width in CSS pixels (the canvas's own by default). */
	width?: number;
	/** The drawing's height in CSS pixels (the canvas's own by default). */
	height?: number;
	/** Device pixels per CSS pixel (1). */
	pixelRatio?: number;
	/** Where the camera is (straight on). */
	view?: View;
	/** The tone mapping's exposure (by default it's measured, so bare ground comes out the ground's colour). */
	exposure?: number;
}

/** A drawn 3D vinyl scene. */
export interface VinylScene {
	/** The canvas it draws on. */
	readonly canvas: HTMLCanvasElement | OffscreenCanvas;
	/** Draws the frame again. */
	render(): void;
	/** Moves the camera (merged over the current view) and draws. */
	setView(view: View): void;
	/** The frame as an image Blob (`'image/png'` by default). */
	toBlob(type?: string, quality?: number): Promise<Blob>;
	/** Frees the GPU resources and the renderer. */
	dispose(): void;
}

/** A vinyl scene on a canvas, with three.js loaded on first use; drawn once, then on demand. Rejects with a TypeError for a bad option. */
export function vinylScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: VinylSceneOptions): Promise<VinylScene>;
