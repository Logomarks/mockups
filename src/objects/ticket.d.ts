import type { Art, Mockup, Size } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { StockName } from '../materials/paper.js';

/** How the tickets are shown. */
export type TicketLayout = 'pair' | 'trio';

/** How to show an event ticket. */
export interface TicketOptions {
	/** The ticket, 5.5 × 2 in: image bytes, SVG markup, a `data:` URI or a URL. Required. */
	art: Art;
	/** More tickets' prints (a second night, another seat), used in turn after `art`. */
	extra?: Art[];
	/** `'pair'` (two on a table; the default) or `'trio'` (two, and a third's stub, already torn off, in front). */
	layout?: TicketLayout;
	/** Tear the second ticket's stub off along the perforation, for `'pair'` (false). */
	torn?: boolean;
	/** Where the perforation is, as a fraction of the width from the left, 0.3–0.95 (0.75, as `@arraypress/covers` prints it). */
	stub?: number;
	/** What it lies on (`'oak'`). */
	surface?: SurfaceOption;
	/** The card stock (`'matte'`). */
	stock?: StockName;
	/** The bleed the art carries round the trim, in mm (0; files from `@arraypress/covers` carry 3). */
	bleed?: number;
	/** The output's size in pixels (a 1600 square). */
	size?: Size;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the shadows are, 0–3 (1). */
	shadow?: number;
	/** How much of the frame the tickets fill, 0.2–1 (0.84). */
	fit?: number;
	/** Film grain, 0–1 (0.5). */
	grain?: number;
	/** Seeds the surface and the torn edge (`'ticket'`). */
	seed?: string;
}

/** A ticket's size and corner radius in mm: 139.7 × 50.8, 3. */
export const TICKET: Readonly<{ width: number; height: number; radius: number }>;
/** The layouts. */
export const TICKET_LAYOUTS: readonly TicketLayout[];
/** Where each ticket goes, back to front: its centre in mm, its turn in degrees, and whether only its stub lies there. */
export function ticketPlacements(layout: TicketLayout): { x: number; y: number; angle: number; stub?: boolean }[];
/** An event ticket mockup as layered SVG. Throws a TypeError for a bad option. */
export function ticket(options: TicketOptions): Mockup;
