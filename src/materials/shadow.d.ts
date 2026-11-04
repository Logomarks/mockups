import type { Scene } from '../render/scene.js';

/** How shadows fall in a mockup. */
export interface Light {
	/** Where the light is, left (-1) to right (1); shadows fall the other way. */
	x: number;
	/** How dark shadows are (1 is natural). */
	strength: number;
	/** The scale shadows are measured in (the sleeve's side, in pixels). */
	unit: number;
}

/** What casts a shadow: its silhouette (translucent parts drawn faint), and where it stands on the floor (`null` when it lies flat). */
export interface Caster {
	shape: (fill: string) => string;
	foot: { x: number; bottom: number; width: number } | null;
	/** How far it stands off what's behind it, relative to a record on the ground (1): smaller is a tighter, fainter shadow. */
	lift?: number;
}

/** A tight contact shadow, a wide ambient one, and a pool on the floor (when it stands), to draw just before the object. */
export function castShadow(sc: Scene, light: Light, o: Caster): string;
