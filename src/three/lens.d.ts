import type { Three } from './textures.js';

/** The default number of frames a shot averages (24). */
export const LENS_SAMPLES: number;

/** The lens options every scene with a lens takes. */
export interface LensOptions {
	/** How far out of focus the foreground and background go, 0–1 (the scene's default; 0 is all sharp). */
	blur?: number;
	/** How many frames are averaged, 1–256 (more is smoother and slower). */
	samples?: number;
}

/** A scene's lens from its options: `blur` scales the scene's widest `aperture`; `samples` the frames. Throws a TypeError for a bad value. */
export function lensOf(o: import('../util/reader.js').Reader, d: { aperture: number; blur?: number; samples?: number }): { aperture: number; samples: number };

/** Each frame's point on the unit aperture disc (a sunflower spiral) and its sub-pixel nudge (Halton, −0.5–0.5). */
export function lensSamples(n: number): { x: number; y: number; jx: number; jy: number }[];

/** A lens: draws a scene as the average of many frames, for depth of field and smooth edges. */
export interface Lens {
	/** Draws the scene to the canvas. `aperture` is the lens's radius in scene units (0: everything sharp); `focus` a point on the plane of focus. */
	draw(scene: import('three').Scene, camera: import('three').PerspectiveCamera, o?: { aperture?: number; focus?: [number, number, number] | null }): void;
	/** Frees its render targets. */
	dispose(): void;
}

/** A lens for a renderer, its targets the drawing buffer's size. */
export function makeLens(THREE: Three, renderer: import('three').WebGLRenderer, o?: { samples?: number }): Lens;
