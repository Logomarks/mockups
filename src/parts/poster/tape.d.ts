import type { Scene } from '../../render/scene.js';
import type { Rng } from '../../util/rng.js';

/** A strip's outline about its centre (px): straight sides, torn ends. */
export function stripPath(len: number, w: number, r: Rng): string;
/** A piece of masking tape (52 × 19 mm by default), torn at both ends, with its shadow. */
export function tape(sc: Scene, o: { x: number; y: number; angle: number; mm: number; seed: string; length?: number; width?: number }): string;
