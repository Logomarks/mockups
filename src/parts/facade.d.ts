import type { Art } from '../types.js';
import type { Scene } from '../render/scene.js';

/** The shopfront's parts, in metres. */
export const SHOP: Readonly<{ width: number; height: number; pilaster: number; fascia: readonly [number, number]; cornice: number; sill: number; door: number }>;
/** A shopfront drawn flat (pilasters, fascia with the mark and raised name, cornice, window, door, stallriser), in `[0, width] × [0, height]` scaled by `scale` units per metre. */
export function facade(sc: Scene, o: { scale: number; name: string; mark?: Art; decal?: Art; color: string; ink: string; joinery: string; light: number }): string;
/** A pane of shop glass: the interior (warm pools of light when `lit`), the sky, the buildings across the street and a streak, reflected. */
export function pane(sc: Scene, o: { x0: number; x1: number; y0: number; y1: number; k: number; light: number; ids: { glass: string; sky: string; warm: string }; lit?: boolean }): string;
/** The floor above a shop: `count` (3) sash windows with lintels and sills, in `[0, width] × [0, height]` scaled by `scale`. */
export function upperFloor(sc: Scene, o: { scale: number; width: number; height: number; light: number; count?: number }): string;
