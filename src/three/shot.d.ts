import type { Three } from './textures.js';
import type { View } from './view.js';

/** A drawn 3D scene. */
export interface Shot {
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

/** How a scene is shot. */
export interface ShotOptions {
	ground: { color: string };
	light: number;
	layout: 'flat' | 'upright';
	width?: number;
	height?: number;
	pixelRatio?: number;
	exposure?: number;
	fit?: number;
	view?: View;
}

/** What a scene's builder resolves to: the group's size (width and height standing, width and depth lying) and the point to look at. */
export interface Group {
	width: number;
	height: number;
	center: [number, number, number];
}

/** A scene on a canvas: three.js loaded, the studio and camera set up, the builder's meshes added, the exposure measured, drawn once. */
export function shoot(
	canvas: HTMLCanvasElement | OffscreenCanvas,
	o: ShotOptions,
	build: (THREE: Three, scene: import('three').Scene, keep: <T extends { dispose(): void }>(t: T) => T) => Promise<Group>,
): Promise<Shot>;
