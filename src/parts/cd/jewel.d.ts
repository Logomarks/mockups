import type { Scene, PlaceArt } from '../../render/scene.js';

/** A jewel case's size, the booklet's square in it and the hinge's width, in mm. */
export const JEWEL: Readonly<{ width: number; height: number; booklet: Readonly<{ x: number; y: number; size: number }>; hinge: number }>;
/** A jewel case front on (142 × 125 mm): the tray, the booklet under the lid, the hinge, the plastic's edges and glare. */
export function jewel(sc: Scene, o: { x: number; y: number; mm: number; booklet: PlaceArt; tray: 'black' | 'clear'; ground: string; light: number }): string;
