/** An SVG's size from its root element's `viewBox` (or `width` and `height`), or `null`. */
export function svgSize(svg: string): { width: number; height: number } | null;
/** An image's size from its `data:` URI (PNG, JPEG, GIF, WebP, SVG), or `null` when it can't be read (a URL). */
export function artSize(href: string): { width: number; height: number } | null;
