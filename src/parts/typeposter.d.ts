import type { Art } from '../types.js';
import type { Scene } from '../render/scene.js';

/** A book serif, for headlines. */
export const SERIF: string;
/** The type poster's grid, as shares of its height. */
export const TYPE_GRID: Readonly<{ margin: number; rule: number; foot: number }>;

/** What a type poster says, and in which colours. */
export interface TypePosterSpec {
	/** The brand's mark (one drawn in `currentColor` takes `ink`). */
	mark: Art;
	/** The brand's name, beside the mark. */
	name?: string;
	/** The headline, set large across the top. */
	headline: string;
	/** An address, at the bottom right. */
	url?: string;
	/** The poster's colour. */
	color: string;
	/** The type's and the rules' colour. */
	ink: string;
}

/** A headline broken into lines that fit a measure. */
export function breakLines(words: string, size: number, width: number): string[];
/** A type poster: the headline, the lockup, the address, and the layout's grid drawn as thin rules. */
export function typePoster(sc: Scene, o: TypePosterSpec & { width: number; height: number }): string;
