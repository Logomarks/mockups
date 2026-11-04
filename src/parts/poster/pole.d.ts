import type { Scene, PlaceArt } from '../../render/scene.js';

/** The pole's diameter, mm (240, a timber utility pole). */
export const POLE: number;
/** Where the flyers go round the pole, back to front (the newest last): along the curve and down it (mm), how faded, how torn, how many staples. */
export function flyerLayout(count: number, w: number, h: number, seed: string): { s: number; y: number; fade: number; wear: number; staples: number }[];
/** A timber pole with flyers wrapped round it, the newest on top and older ones faded and torn under it, shaded as a cylinder. */
export function pole(
	sc: Scene,
	o: { cx: number; cy: number; top: number; bottom: number; w: number; h: number; mm: number; art: PlaceArt; count: number; light: number; seed: string },
): string;
