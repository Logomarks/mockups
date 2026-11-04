import type { Ground, GroundOptions } from '../types.js';
import type { Scene } from '../render/scene.js';

/** A ground resolved: its colour, vignette, whether it's dark, and how deep shadows are drawn on it. */
export interface ResolvedGround {
	color: string;
	vignette: number;
	dark: boolean;
	shadow: number;
}

/** The named grounds: `light` (`#e6e6e6`) and `dark` (`#161618`). */
export const GROUNDS: Readonly<Record<'light' | 'dark', Readonly<Required<GroundOptions>>>>;
/** A ground from its option (default `'light'`). Throws a TypeError for anything else. */
export function resolveGround(g?: Ground): ResolvedGround;
/** The ground's layers: its colour and the vignette. */
export function groundLayer(sc: Scene, g: ResolvedGround): string;
