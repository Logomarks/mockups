import type { Brand } from '../util/brand.js';

/** A volume's number as printed: `'01'`. */
export function volume(n: number): string;

/** A cover composed from the brand: the mark small at the top, a title and volume, a grid of dots, the name large along the bottom. Returns an SVG document `size × px` pixels. */
export function coverSvg(brand: Brand, o: { size: [number, number]; title?: string; volume?: number; px?: number; dots?: boolean }): string;

/** A spine composed from the brand: the name running down it, the mark at its foot, the title and volume at its head. Returns an SVG document `size × px` pixels. */
export function spineSvg(brand: Brand, o: { size: [number, number]; title?: string; volume?: number; px?: number }): string;
