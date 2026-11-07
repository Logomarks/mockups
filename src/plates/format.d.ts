/** A point in a photo, in pixels. */
export type Point = [number, number];

/** How a screen takes the art: printed and lit by the scene, painted, a lightbox or display, or a print behind glass. */
export type PlateKind = 'print' | 'paint' | 'backlit' | 'glass' | 'fabric';

/** A sign's shape inside its corners: the quadrilateral itself, or the ellipse inscribed in it (a round label, a pin, a patch). */
export type ScreenShape = 'quad' | 'ellipse';

/** A band round a cylinder or cone (a cup's sleeve): its top and bottom edges, each an ellipse `[cx, cy, rx, ry]` (`ry` positive when its front is lower, seen from above), and how much of the way round the art goes. */
export interface Cylinder {
	top: [cx: number, cy: number, rx: number, ry: number];
	bottom: [cx: number, cy: number, rx: number, ry: number];
	/** Degrees round the front (140). */
	span?: number;
}

/** How the art sits in the surface. */
export type FinishType = 'ink' | 'deboss' | 'emboss' | 'engrave' | 'foil';

/** A finish: its name, or its name with settings. */
export type Finish =
	| FinishType
	| {
			type: FinishType;
			/** How deep it looks, 0–1. */
			depth?: number;
			/** How wide its edge is, as a fraction of the sign's short side, 0–1. */
			edge?: number;
			/** How much darker the pressed art is, 0–1 (burnished leather). */
			tone?: number;
			/** Whether the art's ink shows (an engraving's fill, an inked deboss). */
			ink?: boolean;
			/** One colour for the art where it shows (a burn, a paint fill). */
			color?: string;
			/** Foil's metal: `'gold'`, `'silver'`, `'copper'`, `'rose'`, or a hex colour. */
			metal?: string;
	 };

/** One sign or display in a plate's photo. */
export interface PlateScreen {
	/** How it takes the art. */
	kind: PlateKind;
	/** Its corners in the photo, clockwise from the top-left (where the art's top-left goes). */
	corners: [Point, Point, Point, Point];
	/** The sign's true width over its height. */
	aspect: number;
	/** The box its maps cover: left, top, width, height, in pixels. */
	box: [number, number, number, number];
	/** The blank sign's light over the box (white is full light), multiplied into the art. A file name, relative to the plate, or an href. */
	shading?: string;
	/** What stands in front of the sign, over the box (white in front), put back from the photo. */
	mask?: string;
	/** Light over the sign (glass's reflections, a floodlight's glare) over the box, screened over the art. */
	reflection?: string;
	/** The photo's grain, as a standard deviation (0–255), matched over the art (0). */
	noise?: number;
	/** A blur matching the photo's sharpness, in pixels (by kind: 0.5–0.8). */
	soften?: number;
	/** How far the art's darkest is from true black before the light falls on it (ink's density), 0–1 (0.02–0.05 by kind). */
	black?: number;
	/** A lightbox's glow round it, 0–1 (0.45 for `backlit`, else 0). */
	glow?: number;
	/** Glass's even veil of reflected light, 0–1 (0.05 for `glass`, else 0). */
	sheen?: number;
	/** The sign's shape inside its corners (`'quad'`). */
	shape?: ScreenShape;
	/** The band round a cylinder the sign wraps (its corners are where the band ends). */
	cylinder?: Cylinder;
	/** Where the photo's light comes from, degrees clockwise from the +x axis, y down (225: the top left). For finishes. */
	light?: number;
	/** How far the art follows the cloth's folds, in pixels (`fabric`: 1.2% of the sign's short side, else 0). */
	displace?: number;
	/** The ground round the art by default (`'#ffffff'`): a colour, or `'none'` for the sign itself (paint on brick, white ink on dark stock); `plate()`'s `background` overrides it. */
	background?: string;
	/** How the art sits in the surface by default (`'ink'`); `plate()`'s `finish` overrides it. */
	finish?: Finish;
}

/** Where a plate's photo came from, and on what terms. */
export interface PlateSource {
	/** The licence (`'CC0-1.0'`, or the generator's terms for its output). */
	licence: string;
	/** The page it came from. */
	url?: string;
	/** Who made it. */
	author?: string;
	/** The model that generated it. */
	model?: string;
	/** The prompt. */
	prompt?: string;
	/** The seed. */
	seed?: number;
	/** What was done to it (a crop, a patch painted out). */
	note?: string;
}

/** A photo with screens in it, ready to take art. */
export interface Plate {
	/** Its name (`'billboard-dusk'`). */
	name: string;
	/** A short description. */
	title?: string;
	/** The photo's width in pixels. */
	width: number;
	/** Its height. */
	height: number;
	/** The photo: a file name relative to the plate, or an href. */
	photo: string;
	/** Its screens, at least one. */
	screens: PlateScreen[];
	/** Its provenance. */
	source?: PlateSource;
	/** Where its files are (a URL, ending in `/`), for a plate object from a plates module. */
	base?: string;
}

/** The kinds of screen. */
export const PLATE_KINDS: readonly PlateKind[];
/** How far a `fabric` sign's art follows its folds by default, as a fraction of its short side. */
export const FABRIC_DISPLACE: number;
/** Each kind's default softness, black, glow and sheen. */
export const KIND_LOOKS: Readonly<Record<PlateKind, Readonly<{ soften: number; black: number; glow: number; sheen: number }>>>;
/** Checks a plate and fills in each screen's defaults. Throws a TypeError when it's malformed. */
export function checkPlate(plate: Plate): Plate;
/** The files a plate names, each once: its photo, then each screen's maps. */
export function plateFiles(plate: Plate): string[];
