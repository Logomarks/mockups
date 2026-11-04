import type { Three } from './textures.js';

/** A soft contact shadow under a footprint (a box's, or a disc's on its edge when `round`), on a plane just above the floor. */
export function footShadow(THREE: Three, o: { width: number; depth: number; soft?: number; strength?: number; round?: boolean }): import('three').Mesh;
