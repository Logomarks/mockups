import type { Scene, PlaceArt } from '../../render/scene.js';

/** A J-card's front panel and spine, in mm (65 × 101.6, spine 12.7). */
export const JCARD: Readonly<{ width: number; height: number; spine: number }>;
/** A J-card's front from a square cover: the cover on top, a band of its colours below with the title. 65 × 101.6, about its top left. */
export function jcard(sc: Scene, art: PlaceArt, title: string): string;
/** A type size that fits words in a width, at most `max`. */
export function fitType(words: string, width: number, max: number): number;
