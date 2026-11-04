/** A seeded generator: `next()` gives a float in `[0, 1)`, `range(lo, hi)` one in `[lo, hi)`. */
export interface Rng {
	next(): number;
	range(lo: number, hi: number): number;
}

/** A string hashed to a 32-bit unsigned integer (cyrb53, folded). */
export function hash(str: string, salt?: number): number;
/** A seeded sfc32 generator; the same seed always gives the same sequence. */
export function rng(seed: string): Rng;
