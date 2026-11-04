import type { Scene } from '../render/scene.js';

/** A badge pocket's outline in mm with its slot cut through (even-odd), and the slot's centre and size. */
export function pocketShape(w: number, h: number): { d: string; slot: { x: number; y: number; w: number; h: number } };
/** A clear PVC pocket in mm, centred on the origin, to draw over what it holds (`lip`: the empty band at its top, mm). */
export function pocket(sc: Scene, o: { w: number; h: number; lip: number; light: number }): string;
