import type { Art } from '../types.js';
import type { Label } from '../parts/label.js';
import type { Material } from '../materials/vinyl.js';

/** three.js, as loaded. */
export type Three = typeof import('three');
/** A three.js canvas texture. */
export type CanvasTexture = import('three').CanvasTexture;

/** A canvas as a texture (`srgb` false for data maps). */
export function texture(THREE: Three, c: HTMLCanvasElement, srgb?: boolean): CanvasTexture;
/** The cover as a square canvas (2048 by default). */
export function coverCanvas(art: Art, size?: number): Promise<HTMLCanvasElement>;
/** A label drawn by the 2D label part (1024 by default). */
export function labelCanvas(art: Art, lb: Label, size?: number): Promise<HTMLCanvasElement>;
/** A splatter or marble body drawn by the 2D material, filling the canvas; and, for a splatter on translucent vinyl, a transmission mask (white passes light). */
export function bodyCanvas(art: Art, m: Material, seed: string, size?: number): Promise<{ color: HTMLCanvasElement; mask: HTMLCanvasElement | null }>;
/** A record face's groove maps: normal, roughness, anisotropy (along the grooves) and a shadow mask (rim and label). */
export function grooveMaps(THREE: Three, seed: string, size?: number): { normal: CanvasTexture; roughness: CanvasTexture; anisotropy: CanvasTexture; shadow: CanvasTexture };
/** The soft shadows round everything on the ground, drawn by the 2D shadow code: black, the alpha the shadow. */
export function shadowCanvas(
	art: Art,
	o: { width: number; depth: number; cx: number; records: { x: number; r: number; opacity: number }[]; light: number; strength?: number },
	scale?: number,
): Promise<HTMLCanvasElement>;
