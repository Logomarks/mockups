import type { Art } from '../types.js';
import type { Scene } from '../render/scene.js';
import type { PlateScreen } from './format.js';

/** One screen's layers, to go over the photo: the art warped, shaded, glazed, grained, feathered, occluded and (for a lightbox) glowing. */
export function screenLayers(
	sc: Scene,
	s: PlateScreen,
	o: { art: Art; fit: 'cover' | 'contain' | 'top'; background: string; grain: number; glow: number; photo: string; seed: string },
): string;
