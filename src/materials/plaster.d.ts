import type { Scene } from '../render/scene.js';

/** The filter lighting a plaster wall's bumps (white flat, darker where they turn from the light), for a multiply layer; its `url(#…)`. */
export function plasterFilter(sc: Scene, o: { mm: number; light: number; seed: string; depth?: number }): string;
/** A painted plaster wall filling `[0, width] × [0, height]`: the paint, uneven patches, the lit relief and the light's fall-off. */
export function plasterWall(sc: Scene, o: { width: number; height: number; mm: number; color: string; light: number; seed: string }): string;
