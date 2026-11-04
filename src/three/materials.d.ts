import type { Material } from '../materials/vinyl.js';
import type { Three, CanvasTexture } from './textures.js';

/** A record face's physical material: transmission for clear and tinted vinyl, gloss for solid, a texture for splatter and marble; groove maps on all. */
export function vinylMaterial(
	THREE: Three,
	m: Material,
	maps: { normal: CanvasTexture; roughness: CanvasTexture; anisotropy: CanvasTexture; shadow: CanvasTexture },
	body?: { color: import('three').Texture; mask: import('three').Texture | null } | null,
): import('three').MeshPhysicalMaterial;
/** Printed paper: a little rough, a faint sheen. */
export function paperMaterial(THREE: Three, map?: import('three').Texture | null, color?: string): import('three').MeshPhysicalMaterial;
