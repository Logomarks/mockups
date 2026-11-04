/// <reference types="node" />
import type { Mockup } from '../types.js';

export * from '../index.js';

/** How to encode a rendered mockup. */
export interface ImageOutput {
	/** `'png'` (default), `'webp'`, `'jpeg'` or `'avif'`. */
	format?: 'png' | 'webp' | 'jpeg' | 'avif';
	/** Quality for the lossy formats (90). */
	quality?: number;
	/** A width to scale to (the mockup's own by default). */
	width?: number;
}

/** Loads the photographed board textures (done on import; false without sharp). */
export function loadTextures(): Promise<boolean>;
/** A mockup (or SVG markup) rasterised by sharp. Rejects when sharp isn't installed. */
export function renderImage(input: Mockup | string, output?: ImageOutput): Promise<Buffer>;
/** Artwork from a path, URL, `data:` URI, SVG markup or bytes, as a `data:` URI scaled down to `size` (1600). */
export function loadArt(input: string | Uint8Array | ArrayBuffer, o?: { size?: number; quality?: number }): Promise<string>;
