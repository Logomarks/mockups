import type { Scene } from '../render/scene.js';

/** A cutting mat's grid, numbers, guides, scores and speckle, drawn over its colour at true size (`mm` pixels per millimetre). */
export function cuttingMat(sc: Scene, color: string, seed: string, mm: number): string;
