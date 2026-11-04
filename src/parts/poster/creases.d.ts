import type { Scene } from '../../render/scene.js';

/** Creases, edge wrinkles, air bubbles and glue-darkened edges over a pasted sheet, about its centre. */
export function creases(sc: Scene, o: { w: number; h: number; mm: number; edge: string; light: number; seed: string }): string;
