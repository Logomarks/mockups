import type { Scene } from '../render/scene.js';

/** A one-ink print: the ink, and the stock it's printed on. */
export interface InkPrint {
	ink: string;
	paper: string;
}

/** How art is printed: `'full'` (as it is, in full colour) or in one ink on coloured stock (`paper`, a warm white by default). */
export type PrintOption = 'full' | { ink: string; paper?: string };

/** A print finish from its option, or `null` for full colour. Throws a TypeError for anything else. */
export function resolvePrint(v: unknown, object: string): InkPrint | null;
/** A one-ink print as an SVG filter (`url(#…)`): the art's darks in the ink, its lights clear. */
export function inkFilter(sc: Scene, p: InkPrint): string;
/** A one-ink print on a canvas's pixels, in place: the stock, with the ink as deep as the art is dark. */
export function inkCanvas(canvas: HTMLCanvasElement, p: InkPrint): HTMLCanvasElement;
