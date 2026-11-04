import type { Art } from '../types.js';

/** Reads one object's options; every read throws a TypeError naming the object and option when the value is the wrong kind. */
export interface Reader {
	/** The option as it was passed. */
	raw(name: string): unknown;
	/** A finite number, held in `lo`–`hi`, or the default. */
	num(name: string, fallback: number, lo?: number, hi?: number): number;
	/** One of the words in `list`, or the default. */
	oneOf<T extends string>(name: string, fallback: T, list: readonly T[]): T;
	/** A hex colour, or the default. */
	color<T extends string | null>(name: string, fallback: T): string | T;
	/** A string, or the default. */
	text(name: string, fallback: string): string;
	/** A boolean, or the default. */
	bool(name: string, fallback: boolean): boolean;
}

/** A reader for an object's options. Throws a TypeError when they aren't an object or have no `art`. */
export function reader(object: string, options: unknown): Reader;
/** A short, stable signature of an artwork, for a document's key. */
export function artKey(art: Art | undefined | null): string;
