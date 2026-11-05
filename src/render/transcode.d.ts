/** A mockup's SVG with each WebP and AVIF image re-encoded as JPEG (opaque) or PNG (see-through): librsvg draws neither. */
export function transcodeImages(svg: string, sharp: typeof import('sharp').default): Promise<string>;
