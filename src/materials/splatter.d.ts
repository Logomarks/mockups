import type { Scene } from '../render/scene.js';
import type { Rng } from '../util/rng.js';

/** A closed smooth blob round a centre, as path data. */
export function blob(x: number, y: number, s: number, r: Rng, wobble?: number): string;
/** The splatter over a record's body, centred on the origin; seeded. */
export function splatter(sc: Scene, colors: readonly string[], radius: number, seed: string): string;
