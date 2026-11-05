import type { Three } from './textures.js';

/** A renderer on a canvas: soft (VSM) shadows, neutral tone mapping, sRGB output, the drawing kept for `toBlob`. */
export function makeRenderer(THREE: Three, canvas: HTMLCanvasElement | OffscreenCanvas, o: { width: number; height: number; pixelRatio: number; exposure: number }): import('three').WebGLRenderer;
/** How a scene is lit: the studio (a soft key on the light's side and a fill), a phone's flash beside the lens, or a dark room. */
export type Lighting = 'studio' | 'flash' | 'dark';

/** How the stage is set. */
export interface StageOptions {
	/** The ground's colour. */
	ground: string;
	/** Where the light is, left (-1) to right (1). */
	light: number;
	/** Lying on the ground (`'flat'`, the default) or standing on a paper sweep (`'upright'`). */
	layout?: 'flat' | 'upright';
	/** `'studio'` (the default), `'flash'` or `'dark'`. */
	lighting?: Lighting;
	/** A drawn surface the sweep is printed with (`span`: how many scene units the canvas covers), mirrored round to cover it. */
	backdrop?: { canvas: HTMLCanvasElement; span: number } | null;
}

/** The stage. */
export interface Stage {
	scene: import('three').Scene;
	/** Keeps the flash beside the camera, aimed at `target` (nothing for the other lightings). */
	follow(camera: import('three').Camera, target: [number, number, number]): void;
	/** Frees its environment. */
	dispose(): void;
}

/** The studio: a room environment, the ground (or a sweep, for things standing), and the lighting's lights. */
export function makeStage(THREE: Three, renderer: import('three').WebGLRenderer, Room: typeof import('three/addons/environments/RoomEnvironment.js').RoomEnvironment, o: StageOptions): Stage;
/** Sets the exposure so a point of bare ground (`at`, fractions of the frame) comes out the ground's colour. */
export function expose(renderer: import('three').WebGLRenderer, render: () => void, ground: string, at: [number, number]): void;
