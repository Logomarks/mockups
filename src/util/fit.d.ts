/** An extent: left, top, right, bottom. */
export interface Box {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
}

/** A layout fitted into a frame. */
export interface Fitted {
	/** Pixels per millimetre. */
	mm: number;
	/** Where a point in millimetres lands, in pixels. */
	at(x: number, y: number): [number, number];
}

/** The scale and offset that fit a box in mm into `fit` of a frame in pixels, centred. */
export function fitBox(box: Box, frame: { width: number; height: number }, fit: number): Fitted;
/** The extent of a rectangle turned about its centre (degrees). */
export function turnedBox(cx: number, cy: number, w: number, h: number, angle: number): Box;
/** The box round several boxes. */
export function union(boxes: Box[]): Box;
