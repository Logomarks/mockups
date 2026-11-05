import type { Scene } from '../render/scene.js';
import type { InkPrint } from '../materials/ink.js';

/** A printed sleeve, front on: the artwork (in full colour, or `print` in one ink on coloured stock), a paper sheen and lit edges. */
export function sleeve(sc: Scene, o: { x: number; y: number; size: number; light: number; sheen?: number; print?: InkPrint | null }): string;
