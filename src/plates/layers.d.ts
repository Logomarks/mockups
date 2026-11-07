import type { Art } from '../types.js';
import type { Scene } from '../render/scene.js';
import type { PlateScreen } from './format.js';
import type { ResolvedFinish } from './finish.js';

/** One screen's layers, to go over the photo: the art warped (onto a flat sign, an ellipse or a cylinder), shaded, glazed, grained, feathered, occluded, (for a lightbox) glowing, displaced by cloth, and finished (deboss, emboss, engrave, foil). */
export function screenLayers(
	sc: Scene,
	s: PlateScreen,
	o: { art: Art; fit: 'cover' | 'contain' | 'top'; background: string; grain: number; glow: number; photo: string; seed: string; finish: ResolvedFinish },
): string;
