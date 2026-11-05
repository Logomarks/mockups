import type { Art } from '../types.js';
import type { Reader } from '../util/reader.js';
import type { Surface, SurfaceOption } from '../materials/desk.js';
import type { DeskCanvas, Footprint } from './deskplane.js';
import type { ShotOptions } from './shot.js';
import type { View } from './view.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';

/** The options every table scene takes beside its own. */
export interface TableSceneOptions extends PrintShotOptions, LensOptions {
	/** The brand's mark (bytes, SVG, a `data:` URI or a URL); one drawn in `currentColor` takes the scene's ink. */
	art: Art;
	/** What it stands or lies on: a surface, as the 2D objects take it (each scene has its own default). */
	surface?: SurfaceOption;
	/** Where the light is, left (-1) to right (1); 0.35. */
	light?: number;
	/** How dark the contact shadows are, 0–3 (1). */
	shadow?: number;
	/** Seeds the surface and anything irregular. */
	seed?: string;
}

/** A table scene's own defaults. */
export interface TableDefaults {
	/** Lying on the desk (`'flat'`) or standing on a sweep printed with the surface (`'upright'`). */
	layout: 'flat' | 'upright';
	/** How much of the frame the group fills. */
	fit: number;
	/** The default view. */
	view: View;
	/** The default surface (`'oak'`). */
	surface?: SurfaceOption;
	/** The lens's widest aperture, as a share of the distance to focus (`blur` scales it). */
	aperture: number;
	/** How many mm the drawn surface spans (1000). */
	span?: number;
	/** The default seed. */
	seed?: string;
}

/** A table scene, read from its options. */
export interface Table {
	shot: ShotOptions;
	surf: Surface;
	/** The drawn surface (none for a plain ground). */
	desk: DeskCanvas | null;
	light: number;
	strength: number;
	seed: string;
}

/** What a panel has printed on it. */
export interface PrintSpec {
	/** The mark. */
	mark: Art;
	/** The name, set with it. */
	name?: string;
	/** The one ink. */
	ink: string;
	/** The panel's size, mm. */
	size: [number, number];
	/** The box the lockup fills, mm on the panel: x, y, width, height. */
	box: [number, number, number, number];
	/** The panel's colour (clear when left out). */
	color?: string | null;
	/** `'stack'` (the default) or `'row'`. */
	layout?: 'stack' | 'row';
	/** Turned a quarter (±90), to run along a long box. */
	turn?: number;
	/** Pixels per mm (8). */
	px?: number;
}

/** A table scene's shot and desk from its options: the studio, a sweep printed with the surface for things standing, and a lens. */
export function tableShot(o: Reader, d: TableDefaults): Promise<Table>;
/** The studio environment, the desk under lying things, and the contact shadows under `feet`. */
export function dressTable(THREE: typeof import('three'), scene: import('three').Scene, keep: <T extends { dispose(): void }>(t: T) => T, t: Table, o: { feet: Footprint[]; shade?: number; gloss?: number }): Promise<void>;
/** The brand printed on a panel in one ink, as a canvas of the panel's proportions. */
export function brandPrint(o: PrintSpec): Promise<HTMLCanvasElement>;
