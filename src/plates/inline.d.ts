import type { Art } from '../types.js';

/** Art's SVG markup, when it is SVG (markup or a `data:` URI), else `null`. */
export function svgMarkup(art: Art): string | null;
/** SVG markup as a nested `<svg>` filling a box from the origin, `cover` (cropped evenly), `contain` (whole, centred) or `top` (cropped from the bottom). */
export function placeSvg(markup: string, box: { width: number; height: number }, fit: 'cover' | 'contain' | 'top'): string;
