import type { Art } from '../types.js';

/** What a 3D screen can show: a canvas, video, image or bitmap, or artwork. */
export type ScreenSource = HTMLCanvasElement | OffscreenCanvas | HTMLVideoElement | HTMLImageElement | ImageBitmap | Art;

/** A screen's live texture. */
export interface ScreenTexture {
	texture: import('three').Texture;
	/** Reads the source again (a canvas; a video updates itself, a picture never changes). */
	update(): void;
	/** The screen's light: its mean colour (its brightest channel 1) and how bright it is, 0–1. */
	light(): { color: [number, number, number]; level: number };
}

/** A screen texture from what it shows. Rejects with a TypeError when there's nothing. */
export function screenTexture(THREE: typeof import('three'), source: ScreenSource): Promise<ScreenTexture>;
