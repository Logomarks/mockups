import type { Art } from '../types.js';

/** A box: left, top, width, height. */
export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** An artwork's width over its height, read from its header (PNG, JPEG, GIF, WebP, SVG); `fallback` (1) for a URL or an unknown format. */
export function artAspect(art: Art, fallback?: number): number;
/** The largest box of an aspect inside an area, centred across it and set at its top (or middle). */
export function fitInside(aspect: number, area: Rect, align?: 'top' | 'middle'): Rect;
