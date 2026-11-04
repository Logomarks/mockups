import type { Point } from './format.js';

/** A photo's pixels: RGB, row by row. */
export interface Pixels {
	data: Uint8Array;
	width: number;
	height: number;
}

/** A line: a point on it and its direction. */
export interface Line {
	point: Point;
	dir: Point;
}

/** A blank sign found in a photo. */
export interface FoundSign {
	/** Its corners, clockwise from the top-left. */
	corners: Point[];
	/** How fully its region fills those corners, 0–1. */
	fill: number;
	/** Its area in pixels. */
	area: number;
}

/** Luminance (Rec. 709, 0–255) of each pixel. */
export function luminance(px: Pixels): Float32Array;
/** The value below which a fraction `q` of some values fall. */
export function quantile(values: ArrayLike<number>, q: number): number;
/** The connected regions of a 0/1 mask, largest first, each at least `minArea` pixels. */
export function regions(mask: Uint8Array, width: number, height: number, minArea: number): Int32Array[];
/** The line through some points, by total least squares. */
export function fitLine(pts: readonly Point[]): Line;
/** Where two lines cross, or `null` when they're parallel. */
export function cross(a: Line, b: Line): Point | null;
/** The area of a polygon. */
export function area(q: readonly Point[]): number;
/** A region's outline as a quadrilateral, clockwise from the top-left, or `null`. */
export function quadOf(region: Int32Array, mask: Uint8Array, width: number): Point[] | null;
/** The blank signs in a photo, best first: `near` keeps only the one holding that point; `minArea` (0.004) is a fraction of the photo. */
export function findSigns(px: Pixels, o?: { near?: Point; minArea?: number }): FoundSign[];
/** A rectangle's true width over its height, from the quadrilateral a camera saw it as (the lens solved from the perspective, or a 35 mm one assumed). */
export function quadAspect(corners: readonly Point[], width: number, height: number): number;
