import type { Scene } from '../render/scene.js';

/** A marbled disc centred on the origin: bands of the colours swirled by turbulence; seeded. */
export function marble(sc: Scene, colors: readonly string[], radius: number, seed: string, opacity?: number): string;
