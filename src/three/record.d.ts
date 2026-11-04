import type { Material } from '../materials/vinyl.js';
import type { Three, CanvasTexture } from './textures.js';

/** A 12" record's thickness as a fraction of its sleeve's side. */
export const THICKNESS: number;
/** One record lying flat, centred on the origin: faces with groove maps, labels both sides, the edge, the spindle hole. */
export function recordMesh(
	THREE: Three,
	o: {
		radius: number;
		material: Material;
		maps: { normal: CanvasTexture; roughness: CanvasTexture; anisotropy: CanvasTexture; shadow: CanvasTexture };
		label: import('three').Texture;
		body?: { color: import('three').Texture; mask: import('three').Texture | null } | null;
	},
): import('three').Group;
