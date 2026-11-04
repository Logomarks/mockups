import type { Art } from '../types.js';

/** Art with `currentColor` set to `color` (SVG markup or an SVG `data:` URI); anything else is returned as it is. */
export function ink(art: Art, color: string): Art;
