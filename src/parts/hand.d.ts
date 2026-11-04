import type { Scene } from '../render/scene.js';
import type { Skin } from '../materials/skin.js';

/** A hand holding a flat thing by its lower edge. */
export interface HandPart {
	/** The grip point on the held thing's lower edge, x in pixels. */
	x: number;
	/** The grip point, y in pixels. */
	y: number;
	/** The held thing's turn, in degrees (0: its lower edge level, the hand below). */
	angle?: number;
	/** Pixels per millimetre. */
	mm: number;
	/** Which hand (`'right'`, coming from the lower right). */
	side?: 'right' | 'left';
	/** The skin and its shading colours. */
	skin: Skin;
	/** Where the light is, left (-1) to right (1). */
	light: number;
	/** How dark its shadows are (1). */
	shadow?: number;
	/** How far above the surface it is, in the units `flatShadow`'s lift uses (3). */
	lift?: number;
}

/** A hand in three layers: its shadow on the surface, the palm and fingers (behind the held thing), and the thumb (in front). */
export function hand(sc: Scene, o: HandPart): { shadow: string; under: string; over: string };
