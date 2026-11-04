import type { Scene } from '../render/scene.js';

/** A deep blue veil over everything drawn so far (0.72 dark). */
export function nightVeil(sc: Scene, depth?: number): string;
/** A glow round a large light source: blurred copies of its shape (draw before the source). */
export function glow(sc: Scene, shape: string, radius: number, strength?: number): string;
/** A small light: a bright core in a radial halo of radius `r` pixels. */
export function lamp(sc: Scene, x: number, y: number, r: number, color?: string): string;
