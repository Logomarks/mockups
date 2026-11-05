/** A run of points along an outline, and whether it closes. */
export interface Outline {
	points: [number, number][];
	closed: boolean;
}

/** A path's `d` as subpaths of points: every SVG path command, curves and arcs flattened. */
export function pathPoints(d: string): Outline[];
/** An SVG arc (endpoint form) flattened: the points after the start, to the end. */
export function arcPoints(p0: [number, number], p1: [number, number], rx: number, ry: number, rot: number, large: boolean, sweep: boolean): [number, number][];
/** Every `<path>`'s outlines in an SVG, with its viewBox (x, y, width, height). Throws a TypeError when it has no paths. */
export function svgOutlines(svg: string): { box: [number, number, number, number]; outlines: Outline[] };
/** Points resampled at an even spacing. */
export function resample(points: [number, number][], step: number, closed: boolean): [number, number][];
/** How long a run of points is. */
export function runLength(points: [number, number][], closed: boolean): number;
