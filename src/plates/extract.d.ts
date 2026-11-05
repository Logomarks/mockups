import type { Plate, PlateKind, PlateSource, Point } from './format.js';

/** How to find and treat one screen when making a plate. */
export interface MakeScreenOptions {
	/** How it takes the art (`'print'`). */
	kind?: PlateKind;
	/** Its corners, clockwise from the top-left (found when left out: the brightest even quadrilateral). */
	corners?: [Point, Point, Point, Point];
	/** A point on it, to pick it out from other bright regions. */
	near?: Point;
	/** Its true width over its height (recovered from the perspective when left out). */
	aspect?: number;
	/** Whether to look for things in front of it (true). */
	occluders?: boolean;
	/** A hand-painted (or matted) occluder mask at the photo's proportions (white where something stands in front), as a path or bytes: left out when the sign's light is measured, and added to what's found. */
	mask?: string | Uint8Array;
	/** How much darker than the sign a pixel is to count as in front of it (0.55). */
	dark?: number;
	/** A blur matching the photo's sharpness, in pixels (the kind's). */
	soften?: number;
	/** How far the art's darkest is from true black, 0–1 (the kind's). */
	black?: number;
	/** A lightbox's glow, 0–1 (the kind's). */
	glow?: number;
	/** Glass's veil, 0–1 (the kind's). */
	sheen?: number;
}

/** How to make a plate. */
export interface MakePlateOptions {
	/** Its name. */
	name: string;
	/** The one screen's kind, when `screens` is left out (`'print'`). */
	kind?: PlateKind;
	/** Each screen (one, found automatically, by default). */
	screens?: MakeScreenOptions[];
	/** The same photo with every sign blank, for the maps, when the photo shows something on them. */
	blank?: string | Uint8Array;
	/** The longest side to keep (2400; never enlarged). */
	size?: number;
	/** The photo's quality (86). */
	quality?: number;
	/** How the files are encoded: `'jpeg'` (JPEG, masks PNG; the default) or `'webp'` (WebP, masks lossless; about half the size, re-encoded by the Node renderer for librsvg). */
	format?: 'jpeg' | 'webp';
	/** Where the photo came from. */
	source?: PlateSource;
}

/** A plate made from a photo: its description (files named) and the files. Throws when a screen can't be found. */
export function makePlate(photo: string | Uint8Array, options: MakePlateOptions): Promise<{ plate: Plate; files: Map<string, Uint8Array> }>;
/** A made plate written to a directory (its files and `plate.json`); resolves to the `plate.json` path. */
export function savePlate(dir: string, made: { plate: Plate; files: Map<string, Uint8Array> }): Promise<string>;
