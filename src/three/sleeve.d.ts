import type { Three } from './textures.js';

/** A sleeve lying flat, one unit square, the cover on top; a gatefold for a double, or `depth` thick. */
export function sleeveMesh(THREE: Three, cover: import('three').Texture, format: 'single' | 'double', depth?: number): import('three').Mesh;
