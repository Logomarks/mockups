/** A mockup's SVG with each SVG `<image>` rasterised at its drawn size (librsvg stretches SVG images drawn under a rotation). */
export function flattenSvgImages(svg: string, sharp: typeof import('sharp').default): Promise<string>;
