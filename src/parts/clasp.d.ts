import type { Scene } from '../render/scene.js';

/** A lanyard's crimp, swivel ring and lobster clasp in mm, from the crimp's top (`top`) down to a pocket's slot (`slot`); its silhouette in black and the steel itself. */
export function clasp(sc: Scene, o: { top: number; slot: number; strap: number }): { shadow: string; body: string };
