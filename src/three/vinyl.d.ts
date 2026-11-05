import type { Art } from '../types.js';
import type { VinylOptions } from '../objects/vinyl.js';
import type { InkPrint, PrintOption } from '../materials/ink.js';
import type { View } from './view.js';
import type { Shot } from './shot.js';

/** How the records and sleeve are laid out in 3D. */
export type VinylSceneLayout = 'upright' | 'flat' | 'scatter';

/** A printed card that goes with the record: an insert, a signed card, a download code. */
export type VinylProp =
	| Art
	| {
			/** Its print. Required. */
			art: Art;
			/** Its width in mm (0.62 of the sleeve's side). */
			width?: number;
			/** Its height in mm (0.84 of its width). */
			height?: number;
			/** The bleed its print carries, in mm (0). */
			bleed?: number;
			/** How it's printed (the sleeve's `print`). */
			print?: PrintOption;
	  };

/** A 3D vinyl scene's options: the 2D `vinyl` options (the art inline: bytes, SVG or a `data:` URI), the record's size, the layout, props, the light, the view and the drift. */
export interface VinylSceneOptions extends Omit<VinylOptions, 'size' | 'sheen' | 'grain' | 'light'> {
	/** The record: `'12in'` (the default) or `'7in'` (a single by default, its label and speed a 7"'s). */
	size?: '12in' | '7in';
	/** Standing on a paper sweep, the records behind the sleeve (`'upright'`, the default); lying flat on the ground (`'flat'`); or tipped out of the sleeve, the records beside it and the props in front (`'scatter'`). */
	layout?: VinylSceneLayout;
	/** Printed cards that go with it: lying over the sleeve (`'flat'`), in front (`'scatter'`), or propped against it (`'upright'`). */
	props?: VinylProp[];
	/** `'studio'` (a soft key and fill, the default), `'flash'` (a phone's hard flash beside the lens, crisp shadows, a low window light raking across), or a number: the studio key's place, left (-1) to right (1) (0.35). */
	light?: 'studio' | 'flash' | number;
	/** The camera wanders slowly round its view: `true`, or how far, 0–1. Frames are drawn only while the canvas is on screen, and not at all with reduced motion. */
	drift?: boolean | number;
	/** The drawing's width in CSS pixels (the canvas's own by default). */
	width?: number;
	/** The drawing's height in CSS pixels (the canvas's own by default). */
	height?: number;
	/** Device pixels per CSS pixel (1). */
	pixelRatio?: number;
	/** Where the camera is (front on: level for `'upright'`, straight down lying). */
	view?: View;
	/** The tone mapping's exposure (by default it's measured under the studio's light, so bare ground comes out the ground's colour; 1 under the flash). */
	exposure?: number;
	/** Frames a second while it drifts (30). */
	fps?: number;
}

/** A prop, resolved: its print, size in sleeve units, bleed, and ink. */
export interface Prop {
	art: Art;
	w: number;
	h: number;
	bleed: number;
	print: InkPrint | null;
}

/** Where things lie when tipped out of the sleeve. */
export interface Scatter {
	at: { sleeve: Spot; records: Spot[]; props: Spot[] };
	width: number;
	depth: number;
}

/** A thing's centre in sleeve units (x across, z towards the camera) and its turn in degrees. */
export interface Spot {
	x: number;
	z: number;
	angle: number;
}

/** A drawn 3D vinyl scene. */
export type VinylScene = Shot;

/** The layouts. */
export const VINYL_SCENE_LAYOUTS: readonly VinylSceneLayout[];
/** A vinyl scene on a canvas, with three.js loaded on first use; drawn once, then on demand (and frame by frame while it drifts). Rejects with a TypeError for a bad option. */
export function vinylScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: VinylSceneOptions): Promise<VinylScene>;
/** Where things lie when tipped out of the sleeve, centred on the origin. */
export function scatter(count: number, R: number, props: { w: number; h: number }[]): Scatter;
/** The light from its option: where it is, and whether it's the studio's or a flash. Throws a TypeError for anything else. */
export function resolveLight(v?: unknown): { light: number; lighting: 'studio' | 'flash' };
/** How far the camera drifts, 0–1, from `true`, `false` or a number. Throws a TypeError for anything else. */
export function resolveDrift(v: unknown): number;
/** The props from their option, sized in sleeve units; they share the sleeve's `print` unless they say otherwise. */
export function resolveProps(v: unknown, dims: { sleeve: number }, print: InkPrint | null): Prop[];
