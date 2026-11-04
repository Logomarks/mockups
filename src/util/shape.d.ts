/** A 2D point. */
export type Vec2 = [number, number];

/** A rounded rectangle's outline, clockwise from the top-left corner's top end (`steps` points per corner, 8). */
export function roundRect(x: number, y: number, w: number, h: number, r: number, steps?: number): Vec2[];
/** Points as closed path data. */
export function polyPath(pts: readonly Vec2[]): string;
/** The convex hull of some points. */
export function hull(pts: readonly Vec2[]): Vec2[];
/** The affine map carrying triangle `s` onto triangle `d`, as SVG's `matrix(a b c d e f)`. */
export function affine(s: readonly Vec2[], d: readonly Vec2[]): [number, number, number, number, number, number];
/** A triangle grown outwards by `m` on every side. */
export function grow(t: readonly Vec2[], m: number): Vec2[];
/** A polygon clipped to the rectangle `[x0, x1] × [y0, y1]`. */
export function clipRect(pts: readonly Vec2[], x0: number, y0: number, x1: number, y1: number): Vec2[];
