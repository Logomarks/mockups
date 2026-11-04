import type { Scene } from '../render/scene.js';
import type { Surface } from '../materials/desk.js';

/** The surface, foreshortened up the frame by `squash` (0.45), filling it. */
export function tabletop(sc: Scene, surf: Surface, o: { light: number; seed: string; mm: number; squash?: number }): string;
/** The contact line and pool of shadow round an upright object's elliptical foot. */
export function footShadow(sc: Scene, o: { cx: number; cy: number; rx: number; ry: number; mm: number; light: number; strength?: number; height?: number }): string;
