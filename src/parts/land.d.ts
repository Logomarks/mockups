import type { Scene } from '../render/scene.js';

/** A field from a hazy horizon to darker grass in front, with two soft rows of distant trees. */
export function land(sc: Scene, o: { horizon: number; haze?: string; seed?: string }): string;
