/** A grid of heights, row by row. */
export interface Field {
	/** Its width, in cells. */
	readonly w: number;
	/** Its height, in cells. */
	readonly h: number;
	/** The heights. */
	readonly v: Float32Array;
}

/** Fractal noise to add to a field. */
export interface NoiseOptions {
	/** The seed. */
	seed: string;
	/** How many lattice cells span the field's width (4). */
	scale?: number;
	/** How many octaves (3). */
	octaves?: number;
	/** The first octave's amplitude (1). */
	amp?: number;
	/** How much longer features are across and down (`[1, 1]`). */
	stretch?: [number, number];
	/** Each octave's amplitude over the last's (0.5). */
	gain?: number;
}

/** How a field is lit. */
export interface ShadeOptions {
	/** Where the light is, left (-1) to right (1); it's always up the frame (0.35). */
	light?: number;
	/** How steep the heights read (1). */
	relief?: number;
	/** How dark a slope turned away may go, 0–1 (0.5). */
	dark?: number;
	/** How bright a slope facing the light may go, 0–1 (0.3). */
	bright?: number;
	/** A curve on the shading, above 1 to keep small slopes faint (1). */
	gamma?: number;
}

/** A field of zeros (at least 2 × 2). */
export function field(w: number, h: number): Field;
/** Seeded lattice noise at a point, -1 to 1. */
export function noise2(x: number, y: number, seed: number): number;
/** Adds fractal noise. */
export function fbm(f: Field, o: NoiseOptions): Field;
/** Adds a soft ridge along a segment (ends and width as fractions), tapering at its ends. */
export function ridge(f: Field, a: [number, number], b: [number, number], width: number, height: number, taper?: number): Field;
/** Adds a smooth round bump. */
export function bump(f: Field, c: [number, number], radius: number, height: number): Field;
/** Blurs in place, close to a Gaussian of this radius in cells. */
export function blur(f: Field, r: number): Field;
/** The heights as a grey PNG `data:` URI round mid-grey (a displacement map). */
export function heightPng(f: Field, gain?: number): string;
/** The heights lit, as a PNG `data:` URI: black on slopes turned away, white on slopes facing the light, clear on the flat. */
export function shadePng(f: Field, o: ShadeOptions): string;
/** A grey-and-alpha PNG `data:` URI from a function of each cell (both 0–1). */
export function greyPng(w: number, h: number, fn: (x: number, y: number) => [number, number]): string;
