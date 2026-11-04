import type { Scene } from '../render/scene.js';
import type { Material } from '../materials/vinyl.js';
import type { Label } from './label.js';

/** One record: where it is, what it's pressed in, its label. */
export interface RecordPart {
	cx: number;
	cy: number;
	r: number;
	material: Material;
	label: Label;
	/** The ground's colour (clear vinyl reads against it). */
	ground: string;
	/** Where the light is, left (-1) to right (1). */
	light: number;
	seed: string;
	/** How far to move the label's type sideways. */
	shift?: number;
}

/** A record, front on, with the spindle hole punched through. */
export function record(sc: Scene, o: RecordPart): string;
/** A record's silhouette for its shadow: label and rim solid, the rest as opaque as the vinyl. */
export function silhouette(x: number, y: number, r: number, opacity: number, fill: string): string;
/** Markup with a disc's hole cut out (a record's spindle hole by default), so its own shadow doesn't darken the ground seen through it. */
export function punch(sc: Scene, x: number, y: number, r: number, markup: string, hole?: number): string;
