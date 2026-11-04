import type { Crop } from '../types.js';

/** The side of the grey copy `loadArt` measures (128). */
export const PROBE: number;
/** The quietest square windows of a grey image (lowest mean Laplacian edge strength), quietest first, each apart from the last. */
export function quietCrops(grey: ArrayLike<number>, w: number, h: number, o?: { size?: number; count?: number }): Crop[];
/** Remembers an artwork's quiet windows by its `data:` URI (the last 32 are kept). */
export function remember(href: string, crops: Crop[]): void;
/** An artwork's quiet windows, if it was measured; `null` otherwise. */
export function recall(href: string): Crop[] | null;
