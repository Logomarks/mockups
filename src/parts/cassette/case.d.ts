import type { Scene, PlaceArt } from '../../render/scene.js';

/** A cassette case's size, in mm, standing with its hinge on the left (70 × 109). */
export const CASE: Readonly<{ width: number; height: number }>;
/** A cassette case front on: the J-card under its clear lid, the spine round the hinge, the knuckles, ribs and catch, the glare. */
export function tapeCase(sc: Scene, o: { x: number; y: number; mm: number; art: PlaceArt; title: string; light: number }): string;
