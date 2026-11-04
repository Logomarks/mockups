import type { Scene, PlaceArt } from '../../render/scene.js';

/** A moulding's name. */
export type FrameName = 'black' | 'white' | 'wood';
/** The mouldings: face colour and shine. */
export const FRAMES: Readonly<Record<FrameName, Readonly<{ color: string; shine: number }>>>;
/** The moulding's face width, in mm (20). */
export const MOULDING: number;
/** A framed print about its centre: mitred moulding shaded side by side, a mat with a lit bevel, the print, inner shadows and the glass. */
export function framed(sc: Scene, o: { cx: number; cy: number; w: number; h: number; mat: number; mm: number; frame: FrameName; art: PlaceArt; light: number; seed: string }): string;
