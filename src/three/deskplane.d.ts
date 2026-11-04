import type { Surface, Texture } from '../materials/desk.js';

/** Something lying on the desk, for its contact shadow: centre (mm; z towards the camera), size (mm), turn (degrees), corner radius (mm), lift (0–3). */
export interface Footprint {
	x: number;
	z: number;
	w: number;
	d: number;
	angle?: number;
	radius?: number;
	lift?: number;
}

/** A drawn desk. */
export interface DeskCanvas {
	canvas: HTMLCanvasElement;
	/** Its mean colour, hex. */
	color: string;
	/** How many mm it spans. */
	span: number;
}

/** Millimetres in one scene unit: 100. */
export const UNIT: number;
/** A desk surface drawn into a canvas (`px` square, 2048) spanning `span` mm, and its mean colour. */
export function deskCanvas(surf: Surface, o: { span: number; light: number; seed: string; px?: number }): Promise<DeskCanvas>;
/** The desk as a matte plane at y = 0, taking shadows: the drawing in the middle, mirrored round it to cover `reach` (3, odd) times its span. */
export function deskMesh(THREE: typeof import('three'), desk: { canvas: HTMLCanvasElement; span: number }, texture: Texture | null, reach?: number): import('three').Mesh;
/** The 2D flat shadows under footprints, on a clear plane just over the desk. */
export function contactMesh(THREE: typeof import('three'), o: { feet: Footprint[]; light: number; strength?: number; px?: number }): Promise<import('three').Mesh>;
