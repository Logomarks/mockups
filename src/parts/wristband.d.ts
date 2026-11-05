import type { Scene, PlaceArt } from '../render/scene.js';

/** A kind of wristband: a woven loop, or a Tyvek strip. */
export type WristbandKind = 'fabric' | 'tyvek';

/** A band as an option: its kind, or its kind and colours, words and number. */
export type BandOption =
	| WristbandKind
	| {
			/** `'fabric'` (the default) or `'tyvek'`. */
			kind?: WristbandKind;
			/** Its colour (fabric red, black, blue, yellow in turn; Tyvek pink, cyan, lime). */
			color?: string;
			/** The words' colour (light on a dark band, dark on a light one). */
			ink?: string;
			/** The words woven round it or printed along it (the name, in capitals). */
			text?: string;
			/** A Tyvek band's serial number (none). */
			number?: string;
			/** A fabric band's slider colour (`'#1b1b1d'`). */
			clasp?: string;
	  };

/** A band, resolved. */
export interface Band {
	kind: WristbandKind;
	color: string;
	ink: string;
	text: string;
	number: string;
	clasp: string;
}

/** The kinds of band. */
export const WRISTBAND_KINDS: readonly WristbandKind[];
/** A fabric band's loop (mm, lying) and width; a Tyvek strip's length, width and peel tab. */
export const WRISTBAND: Readonly<{ fabric: Readonly<{ rx: number; ry: number; width: number }>; tyvek: Readonly<{ length: number; width: number; tab: number }> }>;
/** The bands from the option (`name` is the words a band carries when it names none). Throws a TypeError for anything else. */
export function resolveBands(list: unknown, name: string, object: string): Band[];
/** Where bands lie in mm round their group's centre: centre, turn, and unturned size. */
export function bandPlacements(bands: Band[], seed: string): { x: number; y: number; angle: number; w: number; h: number }[];
/** A fabric band's loop round the origin, in mm: its silhouette in black, and the band. */
export function fabricBand(sc: Scene, b: Band, o: { light: number; mark?: PlaceArt | null; seed: string }): { shadow: string; body: string };
/** A Tyvek band's print centred on the origin, in mm. */
export function tyvekPrint(sc: Scene, b: Band, o: { light: number; mark?: PlaceArt | null }): string;
/** Bands lying where they're placed, with their shadows, in pixels. */
export function bandLayer(
	sc: Scene,
	o: { bands: Band[]; placed: { x: number; y: number; angle: number }[]; at: (x: number, y: number) => [number, number]; mm: number; light: number; shadow: number; mark: PlaceArt | null; seed: string },
): string;
