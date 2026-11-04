import type { Scene } from '../render/scene.js';

/** A cylinder and the print to wrap round it, in pixels. */
export interface WrapPart {
	/** Its axis, x. */
	cx: number;
	/** Where the print's top edge crosses the axis (at the cylinder's back, before the sag). */
	top: number;
	/** Its radius. */
	r: number;
	/** The half-depth of its ellipse as seen (r × the sine of the view's elevation). */
	ry: number;
	/** The id of a `<g>` in the defs: the print unrolled, x the arc length from the front's centre (0), y down from its top. */
	content: string;
	/** How tall the print is. */
	height: number;
	/** Turns the cylinder, in degrees: the arc at this angle faces the camera (0). */
	turn?: number;
	/** How many strips the visible half is cut into (72). */
	strips?: number;
}

/** A flat print wrapped round the front of a cylinder, as strips. */
export function wrap(sc: Scene, o: WrapPart): string;
/** A filter (`url(#…)`) bending flat art, drawn centred on the axis in the band `top`–`top + height`, round the front of a cylinder in one pass. */
export function bend(sc: Scene, o: { cx: number; r: number; ry: number; top: number; height: number; turn?: number }): string;
/** The light across a cylinder as a horizontal gradient fill (`url(#…)`). */
export function cylinderShade(sc: Scene, o: { cx: number; r: number; light: number; dark?: number; bright?: number }): string;
/** Glossy window reflections on a cylinder (to clip to it). */
export function reflections(sc: Scene, o: { cx: number; r: number; top: number; bottom: number; light: number; gloss?: number }): string;
