import type { Scene } from '../render/scene.js';

/** The grain tile (160 px, seeded) as a PNG `data:` URI. */
export function grainTile(seed: string): string;
/** Film grain over the frame (`amount` 0–1; nothing at 0). */
export function grainLayer(sc: Scene, amount: number, seed: string): string;
