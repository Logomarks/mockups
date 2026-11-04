import type { Scene } from '../render/scene.js';

/** A named finish. */
export type Finish = 'clear' | 'black' | 'white' | 'smoke';
/** A colour and how strongly it filters the light (0.75 by default: translucent; 1 is solid). */
export interface TintSpec {
	color: string;
	opacity?: number;
}
/** Splatter in these colours over a base (clear by default). */
export interface SplatterSpec {
	splatter: string[];
	base?: Finish | `#${string}` | TintSpec;
}
/** Marble swirled from these colours. */
export interface MarbleSpec {
	marble: string[];
	opacity?: number;
}
/** What a record is pressed in: a finish, a hex colour (solid), a tint, a splatter or a marble. */
export type VinylSpec = Finish | `#${string}` | TintSpec | SplatterSpec | MarbleSpec;

/** A resolved material. */
export interface Material {
	kind: 'clear' | 'solid' | 'tinted' | 'splatter' | 'marble';
	color: string;
	opacity: number;
	sheen: number;
	colors: string[];
	base: Material | null;
}

/** The named finishes: colour, opacity and sheen. */
export const FINISHES: Readonly<Record<Finish, Readonly<{ color: string; opacity: number; sheen: number }>>>;
/** A material from its spec (default `'clear'`). Throws a TypeError for anything else. */
export function resolveVinyl(spec?: VinylSpec): Material;
/** The colour a record's body is painted in at its opacity: translucent vinyl multiplies the ground by its colour. */
export function paint(m: Material, ground: string): string;
/** Whether a record reads as dark on this ground (its grooves are then drawn in light). */
export function isDark(m: Material, ground: string): boolean;
/** The disc itself, centred on the origin. */
export function body(sc: Scene, m: Material, r: number, seed: string, ground: string): string;
