import type { Scene } from '../render/scene.js';

/** Broad light-and-dark mottling over the frame, from noise drawn small (`cells` across its longer side). */
export function mottle(sc: Scene, seed: string, cells: number, amount: number, octaves?: number): string;
/** A seamless tile of fine light and dark specks from turbulence, as a fill (`url(#…)`). */
export function speckTile(
	sc: Scene,
	o: { size: number; freq: [number, number]; octaves: number; dark: number; light: number; cut?: number; seed?: number; type?: 'fractalNoise' | 'turbulence' },
): string;
