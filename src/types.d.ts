// Shared types for @arraypress/mockups.

/** Finished artwork: image bytes (PNG, JPEG, WebP, GIF, AVIF or SVG), SVG markup, a `data:` URI or a URL. */
export type Art = string | Uint8Array | ArrayBuffer;

/** The output's size in pixels: one number for a square, or both sides. */
export type Size = number | { width: number; height: number };

/** A named ground: a light grey seamless (`#e6e6e6`) or a near-black one (`#161618`). */
export type GroundName = 'light' | 'dark';

/** A ground in full. */
export interface GroundOptions {
	/** Its colour, hex. */
	color: string;
	/** How much it darkens towards the corners, 0–1 (0; 0.25 on `dark`). */
	vignette?: number;
}

/** What the objects stand on: a name, a hex colour, or the colour with a vignette. */
export type Ground = GroundName | `#${string}` | GroundOptions;

/** A rendered 2D mockup. */
export interface Mockup {
	/** The layered SVG document, with the artwork embedded. */
	svg: string;
	/** Its width in pixels. */
	width: number;
	/** Its height in pixels. */
	height: number;
	/** Which object it shows (`'vinyl'`). */
	object: string;
}

/** A crop window on the artwork, as fractions of its side: its centre and its size. */
export interface Crop {
	x: number;
	y: number;
	size: number;
}
