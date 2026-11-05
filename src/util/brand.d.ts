import type { Art } from '../types.js';
import type { Reader } from './reader.js';

/** The brand a composed print is set from. */
export interface Brand {
	/** The mark (one drawn in `currentColor` takes the ink it's printed in). */
	mark: Art;
	/** The name ('' leaves it out). */
	name: string;
	/** The brand's colour. */
	color: string;
	/** The ink that reads on the colour. */
	ink: string;
	/** The paper's colour. */
	paper: string;
}

/** The brand options every composing scene takes. */
export interface BrandOptions {
	/** The brand's name, set beside or under the mark. */
	name?: string;
	/** The brand's colour (hex). */
	color?: string;
	/** The ink on the brand's colour (near-black or warm white, whichever reads, by default). */
	ink?: string;
	/** The paper's colour. */
	paper?: string;
}

/** Near-black on a light colour, warm white on a dark one. */
export function inkOn(color: string): string;
/** The brand from a scene's options (`art` is the mark; `name`, `color`, `ink`, `paper`). */
export function brandOf(o: Reader, d: { color: string; paper?: string }): Brand;
