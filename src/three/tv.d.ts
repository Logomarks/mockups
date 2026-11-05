import type { View } from './view.js';
import type { Shot } from './shot.js';
import type { ScreenSource } from './screen.js';
import type { CrtLook } from './crt.js';

/** The kind of set: an old CRT on legs, or a flat panel on a foot. */
export type TvKind = 'crt' | 'flat';

/** A TV scene's options. */
export interface TvSceneOptions {
	/** What the screen shows, live: a canvas (read every frame, so a shader or effect drawn into it plays), a video (as it plays), an image or bitmap, or artwork (bytes, SVG, a `data:` URI or a URL). Required. */
	screen: ScreenSource;
	/** `'crt'` (the default) or `'flat'`. */
	kind?: TvKind;
	/** The set's body: `'wood'` (veneer; a CRT's default), `'cream'`, `'black'` (a flat TV's default) or a hex colour. */
	cabinet?: 'wood' | 'cream' | 'black' | `#${string}`;
	/** The tube's look: `true` (all of it; a CRT's default), `false` (the picture as it is; a flat TV's default) or `{ curve, scanlines, bloom, roll, noise }`, each 0–1. */
	crt?: boolean | CrtLook;
	/** The room's dark (`'#050506'`). */
	ground?: string;
	/** The colour of the light the screen throws (by default sampled from what it shows, now and then). */
	glow?: string;
	/** Where the camera is (turned 35° to the set's left, raised 12°, a 32° lens), merged over that. */
	view?: View;
	/** The camera wanders slowly round its view (`true`, the default), not at all (`false`), or how far, 0–1. */
	drift?: boolean | number;
	/** Frames a second (30). */
	fps?: number;
	/** The drawing's width in CSS pixels (the canvas's own by default). */
	width?: number;
	/** The drawing's height in CSS pixels (the canvas's own by default). */
	height?: number;
	/** Device pixels per CSS pixel (1). */
	pixelRatio?: number;
	/** The tone mapping's exposure (1; filmic). */
	exposure?: number;
	/** How much of the frame the set fills, 0.2–1 (0.85). */
	fit?: number;
}

/** A drawn TV scene: the shot's handle, and a way to change what's on screen. */
export interface TvScene extends Shot {
	/** Shows something else (the old texture is freed). */
	setScreen(source: ScreenSource): Promise<void>;
}

/** The kinds of set. */
export const TV_KINDS: readonly TvKind[];
/** The cabinets by name. */
export const CABINETS: Readonly<{ wood: string; cream: string; black: string }>;
/** A TV in a dark room on a canvas, its screen live; three.js loaded on first use. Frames are drawn while it's on screen, and none with reduced motion (one still frame). Rejects with a TypeError for a bad option. */
export function tvScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: TvSceneOptions): Promise<TvScene>;
