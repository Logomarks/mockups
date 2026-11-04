import type { Reader } from '../util/reader.js';
import type { View } from './view.js';
import type { ShotOptions } from './shot.js';

/** The options every 3D print scene takes beside its own. */
export interface PrintShotOptions {
	/** The drawing's width in CSS pixels (the canvas's own). */
	width?: number;
	/** The drawing's height in CSS pixels (the canvas's own). */
	height?: number;
	/** Device pixels per CSS pixel (1). */
	pixelRatio?: number;
	/** Where the camera is (merged over the scene's default view). */
	view?: View;
	/** The tone mapping's exposure (measured by default, so bare ground comes out its own colour). */
	exposure?: number;
	/** How much of the frame the group fills, 0.2–1. */
	fit?: number;
}

/** How a print scene is shot, from its options and its own defaults. Throws a TypeError for a bad size, view or exposure. */
export function shotOf(o: Reader, d: { ground: string; light: number; layout: 'flat' | 'upright'; fit: number; view: View }): ShotOptions;
