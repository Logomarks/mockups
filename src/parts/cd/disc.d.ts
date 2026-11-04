import type { Scene, PlaceArt } from '../../render/scene.js';

/** Where things are on a disc, radii in mm: the edge (60), the hole (7.5), the clear hub (11), the mirror band (23), the print (58.5). */
export const DISC: Readonly<{ radius: number; hole: number; hub: number; mirror: number; print: number }>;
/** A disc face up about its centre: bare silver with a rainbow either side of its highlight, or printed with a satin coat. */
export function disc(sc: Scene, o: { cx: number; cy: number; mm: number; print: PlaceArt | null; light: number; turn?: number }): string;
/** A disc's silhouette (even-odd path data, the hole open), for its shadow. */
export function discOutline(cx: number, cy: number, mm: number): string;
