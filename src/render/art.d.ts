import type { Art } from '../types.js';

/** An image's MIME type from its first bytes (PNG, JPEG, GIF, WebP, AVIF, SVG), or `null`. */
export function sniff(bytes: Uint8Array): string | null;
/** Bytes as base64 (Buffer in Node, btoa in a browser). */
export function base64(bytes: Uint8Array): string;
/** Artwork as an `href` for an SVG `<image>`: bytes and SVG markup become a `data:` URI, a URL is kept. Throws a TypeError for empty or unknown input. */
export function artHref(art: Art): string;
