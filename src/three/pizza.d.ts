import type { Art } from '../types.js';
import type { BoxSceneOptions } from './box.js';
import type { Shot } from './shot.js';

/** A pizza box scene's options: the box's own (bar `kind`, `print` and `side`), and the lid's print. */
export interface PizzaSceneOptions extends Omit<BoxSceneOptions, 'kind' | 'print' | 'side'> {
	/** The mark (one drawn in `currentColor` takes `ink`). */
	art: Art;
	/** The name, set under the mark. */
	name?: string;
	/** The lid's one ink (near-black on kraft, red on white, off-white on black). */
	ink?: string;
	/** Whether a thin roundel rings the lockup (true). */
	roundel?: boolean;
}

/** The lid's print as SVG (1000 square): the lockup in the middle inside a roundel, in one ink, clear round it. */
export function pizzaLid(o: { mark: Art; name: string; ink: string; roundel?: boolean }): string;
/** A closed pizza box (`boxScene`'s `'pizza'` kind) with its lid printed in one ink, through a lens. Rejects with a TypeError for a bad option. */
export function pizzaScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: PizzaSceneOptions): Promise<Shot>;
