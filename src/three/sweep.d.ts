import type { Three } from './textures.js';

/** A seamless paper sweep: a floor (y = 0) curving up through a cove into a wall behind, plain or printed with `map` (UVs in world units). */
export function sweepMesh(THREE: Three, o: { color: string; back?: number; cove?: number; front?: number; rise?: number; width?: number; map?: import('three').Texture | null }): import('three').Mesh;
