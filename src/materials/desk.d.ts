import type { Ground } from '../types.js';
import type { Scene } from '../render/scene.js';

/** A textured surface's name. */
export type Texture = 'concrete' | 'oak' | 'linen' | 'paper' | 'slate' | 'cutting-mat' | 'knit';

/** What a print lies on: a texture, a texture in a colour of its own, or a plain ground. */
export type SurfaceOption = Texture | { texture: Texture; color?: string } | Ground;

/** A surface resolved. */
export interface Surface {
	/** Its texture, or `null` for a plain ground. */
	texture: Texture | null;
	/** Its colour. */
	color: string;
	/** How much it darkens towards the corners, 0–1. */
	vignette: number;
	/** Whether it reads dark. */
	dark: boolean;
	/** How deep shadows are drawn on it (1 on a light surface). */
	shadow: number;
}

/** The textured surfaces' colours. */
export const SURFACES: Readonly<Record<Texture, Readonly<{ color: string }>>>;
/** A surface from its option (`fallback` when there's none, `'concrete'`). Throws a TypeError for anything else, naming the option `name` (`'surface'`). */
export function resolveSurface(s?: SurfaceOption, fallback?: SurfaceOption, name?: string): Surface;
/** The surface filling the frame; textures are scaled by `mm`, pixels per millimetre. */
export function surfaceLayer(sc: Scene, s: Surface, o: { light: number; seed: string; mm: number }): string;
export { mottle, speckTile } from './noise.js';
/** The fall of window light across the frame, from the light's side. */
export function falloff(sc: Scene, light: number, amount: number): string;
