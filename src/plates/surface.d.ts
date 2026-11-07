import type { Cylinder, Point, ScreenShape } from './format.js';

/** The surface shapes a screen can have. */
export const SCREEN_SHAPES: readonly ScreenShape[];
/** How much of a cylinder's front the art wraps round when no `span` is given, in degrees (140). */
export const DEFAULT_SPAN: number;
/** A cylinder screen's corners: where its band's edges end at either side of the span, clockwise from the top-left. */
export function cylinderCorners(c: Cylinder): Point[];
/** The map from a `width` × `height` drawing onto a cylinder or cone: x round the span by angle, y straight down. */
export function cylinderMap(c: Cylinder, width: number, height: number): (x: number, y: number) => Point;
/** A cylinder screen's true width over its height: the arc its art wraps round, over the band's height. */
export function cylinderAspect(c: Cylinder): number;
/** The map from the art onto a screen's surface (its corners' projective map, or its cylinder). */
export function surfaceMap(s: { corners: readonly Point[]; cylinder?: Cylinder }, width: number, height: number): (x: number, y: number) => Point;
/** A screen's outline in the photo, clockwise: its corners, the ellipse inscribed in them, or its cylinder's band. */
export function outline(s: { corners: readonly Point[]; shape?: ScreenShape; cylinder?: Cylinder }): Point[];
/** Whether a point is inside a polygon (even-odd). */
export function inPolygon(poly: readonly Point[], x: number, y: number): boolean;
/** A polygon pushed out from its centre by `m` pixels at each point. */
export function spread(poly: readonly Point[], m: number): Point[];
/** A quadrilateral's shortest side, in pixels. */
export function shortSide(corners: readonly Point[]): number;
