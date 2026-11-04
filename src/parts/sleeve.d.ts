import type { Scene } from '../render/scene.js';

/** A printed sleeve, front on: the artwork, a paper sheen and lit edges. */
export function sleeve(sc: Scene, o: { x: number; y: number; size: number; light: number; sheen?: number }): string;
