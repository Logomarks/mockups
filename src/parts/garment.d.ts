import type { Art } from '../types.js';
import type { Scene } from '../render/scene.js';
import type { Cloth } from '../materials/folds.js';
import type { FabricKind } from '../materials/fabric.js';

/** A point of an outline in mm; `true` third keeps a corner there. */
export type OutlinePoint = [number, number] | [number, number, boolean];

/** A print on a garment. */
export interface GarmentPrint {
	art: Art;
	/** Where it goes, in mm. */
	rect: { x: number; y: number; w: number; h: number };
	/** A colour to print a one-colour artwork in. */
	ink?: string | null;
}

/** A garment lying flat. */
export interface GarmentPart {
	/** Pixels per millimetre. */
	mm: number;
	/** Where the garment's (0, 0) in mm lands, in pixels. */
	origin: [number, number];
	/** Its outline, in mm. */
	outline: { d: string; poly: [number, number][] };
	/** Its height field (folds). */
	cloth: Cloth;
	/** The cloth's colour. */
	color: string;
	/** Whether the cloth reads dark. */
	dark: boolean;
	/** The fabric. */
	kind: FabricKind;
	/** Whether the yarn is heathered. */
	heather?: boolean;
	/** Where the light is, left (-1) to right (1). */
	light: number;
	/** The seed. */
	seed: string;
	/** How dark its shadow is, 0–3 (1). */
	shadow?: number;
	/** Markup in mm drawn over the cloth, under the print (pockets, linings). */
	under?: string;
	/** Markup in mm drawn over the print, under the texture and folds (seams, stitches, ribs). */
	over?: string;
	/** Markup in mm drawn over everything (cords lying on the garment). */
	top?: string;
	/** The prints. */
	prints?: GarmentPrint[];
	/** How far the folds move the print at their steepest, in mm (5). */
	warp?: number;
	/** How the folds are lit. */
	relief?: { relief?: number; dark?: number; bright?: number };
}

/** A smooth outline through points in mm (corners kept where marked), with the outline sampled as a polygon. */
export function smooth(pts: OutlinePoint[], closed?: boolean): { d: string; poly: [number, number][] };
/** A row of stitches along a path, in mm. */
export function stitches(d: string, o?: { color?: string; opacity?: number; width?: number; stitch?: number }): string;
/** A seam along a path, in mm. */
export function seam(d: string, depth?: number): string;
/** Rib knit along a path's centre line, `width` mm wide, in mm. */
export function rib(d: string, width: number, color: string, pitch?: number): string;
/** A garment lying flat, with its shadow. */
export function garment(sc: Scene, o: GarmentPart): string;
