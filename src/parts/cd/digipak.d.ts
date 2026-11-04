import type { Scene, PlaceArt } from '../../render/scene.js';

/** A digipak's size, in mm (139.7 × 124.5). */
export const DIGIPAK: Readonly<{ width: number; height: number }>;
/** A digipak front on, printed edge to edge, its board edge and spine fold, with its shadow. */
export function digipak(sc: Scene, o: { cx: number; cy: number; mm: number; art: PlaceArt; light: number; shadow: number }): string;
