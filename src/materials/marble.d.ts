import type { Rng } from '../util/rng.js';
import type { Scene } from '../render/scene.js';

/** A marbled disc centred on the origin: a pool of the first colour with lobes and streaks of the rest squeezed out from the middle and swirled; seeded. */
export function marble(sc: Scene, colors: readonly string[], radius: number, seed: string, opacity?: number): string;
/** One lobe of colour from the centre out past the rim, its edges turning by `twist` radians; path data. */
export function lobe(radius: number, a0: number, width: number, twist: number, r: Rng): string;
