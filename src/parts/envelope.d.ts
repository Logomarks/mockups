import type { Scene, PlaceArt } from '../render/scene.js';

/** A DL envelope's size in mm: 220 × 110. */
export const DL: Readonly<{ width: number; height: number }>;
/** An envelope's front centred on the origin (paper layers showing through, the pocket's swell, a logo top-left), to draw over its paper. */
export function envelopeFace(sc: Scene, o: { w: number; h: number; mm: number; logo?: PlaceArt | null; logoSize?: number }): string;
