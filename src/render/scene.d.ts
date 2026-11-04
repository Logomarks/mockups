import type { Art } from '../types.js';
import type { AttrValue } from './svg.js';

/** The artwork's box in user units (1000): a part scales it to its own size. */
export const ART: number;

/** A 2D mockup's document, built back to front. */
export interface Scene {
	/** Its width in pixels. */
	readonly width: number;
	/** Its height in pixels. */
	readonly height: number;
	/** The artwork's id: a 1000 × 1000 `<image>` in the defs (cover-fitted). */
	readonly art: string;
	/** A fresh id under the document's prefix. */
	id(name: string): string;
	/** Adds markup to the `<defs>`. */
	def(markup: string): void;
	/** Adds layers on top of what's there; falsy entries are skipped. */
	add(...markup: (string | false | null | undefined)[]): void;
	/** A Gaussian blur filter of this deviation (made once, then reused), as `url(#id)`. */
	blur(sigma: number): string;
	/** The artwork placed in a box, as a `<use>`. */
	useArt(x: number, y: number, w: number, h: number, attrs?: Record<string, AttrValue>): string;
	/** The whole document. */
	svg(): string;
}

/** A new document of this size, with the artwork defined once. Its ids come from a hash of `key` and the art, so they're stable. */
export function scene(o: { width: number; height: number; art: Art; key?: string }): Scene;
