import type { Scene } from '../render/scene.js';

/** A woven strap along a curve, in millimetres. */
export interface StrapPart {
	/** Points it passes through (smoothly), from one end to the other. */
	spine: [number, number][];
	/** Its width. */
	width: number;
	/** Its colour, hex. */
	color: string;
	/** The printed words' colour, hex. */
	ink: string;
	/** Words printed along it, repeated (none). */
	text?: string;
	/** Where the light is, left (-1) to right (1). */
	light: number;
	/** Set the type from the spine's end back to its start, so it reads the other way. */
	flip?: boolean;
}

/** Points evenly spaced along a smooth path through the spine, with their direction in degrees. */
export function walk(spine: [number, number][], step: number): { x: number; y: number; a: number }[];
/** A strap: its silhouette in black (to cast as a shadow) and the strap itself. */
export function strap(sc: Scene, o: StrapPart): { shadow: string; body: string };
