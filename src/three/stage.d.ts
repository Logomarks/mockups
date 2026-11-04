import type { Three } from './textures.js';

/** A renderer on a canvas: soft (VSM) shadows, neutral tone mapping, sRGB output, the drawing kept for `toBlob`. */
export function makeRenderer(THREE: Three, canvas: HTMLCanvasElement | OffscreenCanvas, o: { width: number; height: number; pixelRatio: number; exposure: number }): import('three').WebGLRenderer;
/** The studio: a room environment, the ground, a soft key light on the light's side and a fill. */
export function makeStage(
	THREE: Three,
	renderer: import('three').WebGLRenderer,
	Room: typeof import('three/addons/environments/RoomEnvironment.js').RoomEnvironment,
	o: { ground: string; light: number },
): { scene: import('three').Scene; dispose: () => void };
/** Sets the exposure so a point of bare ground (`at`, fractions of the frame) comes out the ground's colour. */
export function expose(renderer: import('three').WebGLRenderer, render: () => void, ground: string, at: [number, number]): void;
