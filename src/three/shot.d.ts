import type { Three } from './textures.js';
import type { View } from './view.js';
import type { Lighting } from './stage.js';

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
	/** `'studio'` (the default), `'flash'` or `'dark'`. */
	lighting?: Lighting;
	/** A drawn surface the sweep is printed with, for things standing on a textured ground (`span`: scene units the canvas covers). */
	backdrop?: { canvas: HTMLCanvasElement; span: number } | null;
	/** `'neutral'` (the default) or `'aces'` (filmic, for a dark room). */
	toneMapping?: 'neutral' | 'aces';
	width?: number;
	height?: number;
	pixelRatio?: number;
	exposure?: number;
	fit?: number;
	view?: View;
	/** How far the camera wanders, 0–1 (0: it doesn't). */
	drift?: number;
	/** Frames a second while it moves (30). */
	fps?: number;
}

/** What a scene's builder resolves to: the group's size (width and height standing, width and depth lying), the point to look at, and what changes each frame (`t` in seconds). */
export interface Group {
	width: number;
	height: number;
	center: [number, number, number];
	tick?: (t: number) => void;
}

/** A scene on a canvas: three.js loaded, the stage and camera set up, the builder's meshes added, the exposure measured, drawn once, then frame by frame if it moves. */
export function shoot(
	canvas: HTMLCanvasElement | OffscreenCanvas,
	o: ShotOptions,
	build: (THREE: Three, scene: import('three').Scene, keep: <T extends { dispose(): void }>(t: T) => T) => Promise<Group>,
): Promise<Shot>;
