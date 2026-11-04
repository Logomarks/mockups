import type { Field } from '../util/field.js';
import type { Box } from '../util/fit.js';

/** How a cloth's field is made. */
export interface ClothOptions {
	/** A cell's side in mm (5). */
	cell?: number;
	/** How far in from the outline the cloth rises to its full height, in mm (20). */
	edge?: number;
	/** How high it rises (1). */
	pillow?: number;
	/** How uneven it lies (0.25). */
	rumple?: number;
	/** The seed. */
	seed: string;
}

/** A cloth's height field, and how to add folds to it in mm. */
export interface Cloth {
	readonly field: Field;
	/** The extent it covers, in mm. */
	readonly box: Box;
	/** Adds a fold from `a` to `b` (mm), `width` mm either side, `height` high (negative: a crease), fading over `taper` of each end. */
	fold(a: [number, number], b: [number, number], width: number, height: number, taper?: number): void;
	/** Adds a jersey wrinkle from `a` to `b` (mm): a crisp crest, a steep side a third of `width` and a soft side `width` mm long on `side` (1: left going from `a` to `b`). */
	wrinkle(a: [number, number], b: [number, number], width: number, height: number, side?: 1 | -1): void;
	/** Adds the line of an old fold from `a` to `b` (mm), wavering up to `waver` mm off the straight, seeded by the cloth's seed. */
	foldLine(a: [number, number], b: [number, number], width: number, height: number, waver?: number): void;
	/** Blurs the folds together (radius in cells), keeping the outside flat. */
	soften(r?: number): void;
}

/** A cloth's height field over its extent: a pillow inside the outline (mm), plus unevenness. */
export function cloth(poly: [number, number][], box: Box, o: ClothOptions): Cloth;
/** How far a point is inside a polygon: positive inside, negative outside. */
export function signedDistance(poly: [number, number][], x: number, y: number): number;
/** The folds lit from the light, as a PNG `data:` URI to lay over the garment. */
export function shadeMap(c: Cloth, light: number, o?: { relief?: number; dark?: number; bright?: number }): string;
/** The warp the folds put in a print: x offset in the grey, y in the alpha; `peak` is the steepest slope carried. */
export function warpMap(c: Cloth): { href: string; peak: number };
