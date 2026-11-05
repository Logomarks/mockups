import type { Art } from '../types.js';
import type { Scene } from '../render/scene.js';

/** A lockup: the mark, and the name beside it (`'row'`) or under it (`'stack'`). */
export interface LockupSpec {
	/** The mark (one drawn in `currentColor` takes `ink`). */
	mark: Art;
	/** The name; left out, the mark stands alone. */
	name?: string;
	/** The ink. */
	ink: string;
	/** The mark's height (the most it may be, for `lockupIn`). */
	size: number;
	/** `'row'` (the default) or `'stack'`. */
	layout?: 'row' | 'stack';
	/** The name's weight (500). */
	weight?: number;
}

/** How wide a line of the system sans runs, roughly. */
export function typeWidth(words: string, size: number, spacing?: number): number;
/** A lockup's width and height. */
export function lockupSize(o: Pick<LockupSpec, 'name' | 'size' | 'layout'>): { width: number; height: number };
/** A lockup as large as fits a box, centred in it (or at its start). */
export function lockupIn(sc: Scene, o: LockupSpec & { x: number; y: number; width: number; height: number; align?: 'start' | 'middle' }): string;
/** A lockup at a point (its top-left). */
export function lockup(sc: Scene, o: LockupSpec & { x: number; y: number }): string;
