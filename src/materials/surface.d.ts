import type { Scene } from '../render/scene.js';
import type { Material } from './vinyl.js';

/** Where things are on a record's face, as fractions of its radius. */
export const RADII: Readonly<{ label: number; hole: number; leadIn: number; bevel: number }>;

/** The tracks' gradient stops: offset (0–1 of the radius), colour and opacity; seeded. `depth` scales how strongly the grooves show; `px` is the radius in pixels (the grooves vary every couple of pixels). */
export function trackStops(seed: string, dark: boolean, depth?: number, px?: number): [number, string, number][];

/** The light on a record's face (clipped to the disc), and the halo just outside a clear one. */
export function surface(sc: Scene, o: { r: number; material: Material; dark: boolean; light: number; seed: string }): { face: string; halo: string };
