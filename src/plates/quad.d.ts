import type { Point } from './format.js';

/** The homography carrying the unit square onto a quadrilateral (clockwise from the top-left), as `[a, b, c, d, e, f, g, h]`. */
export function homography(corners: readonly Point[]): [number, number, number, number, number, number, number, number];
/** The projective map from a `width` × `height` rectangle onto a quadrilateral. */
export function quadMap(corners: readonly Point[], width: number, height: number): (x: number, y: number) => Point;
/** The box round a quadrilateral, grown by `margin` (2) and held inside the photo: left, top, width, height. */
export function quadBox(corners: readonly Point[], width: number, height: number, margin?: number): [number, number, number, number];
/** Whether a point is inside a convex quadrilateral. */
export function inQuad(q: readonly Point[], x: number, y: number): boolean;
