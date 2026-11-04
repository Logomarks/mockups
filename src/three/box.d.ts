import type { Art } from '../types.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { PrintShotOptions } from './printshot.js';
import type { Shot } from './shot.js';

/** A corrugated mailer with a hinged lid, or a rigid box with a lift-off lid. */
export type BoxKind = 'mailer' | 'lid';

/** A 3D box scene's options. */
export interface BoxSceneOptions extends PrintShotOptions {
	/** What's printed on the lid (inline: bytes, SVG or a `data:` URI). Required. */
	art: Art;
	/** What's printed on the front: a mailer's front wall, a lid box's lid skirt. */
	side?: Art;
	/** `'mailer'` (250 × 180 × 80 mm, the default) or `'lid'` (320 × 200 × 110 mm). */
	kind?: BoxKind;
	/** How open, 0 (closed, the default) to 1: a mailer's lid swung up 112°; a lid box's lid lifted 150 mm and tipped. */
	open?: number;
	/** The board's outer colour (`'#f3f1ec'`). */
	color?: string;
	/** The inside's colour (kraft `'#c7a274'` in a mailer, the board's colour in a lid box). */
	inside?: string;
	/** `'cover'` fills the panel with the art (the default); `'logo'` sets it in the middle on the board's colour. */
	print?: 'cover' | 'logo';
	/** What it stands on (`'light'`: a seamless sweep); a texture lays a desk on the floor. */
	surface?: SurfaceOption;
	/** Where the light is, left (-1) to right (1) (0.35). */
	light?: number;
	/** How dark the contact shadow is, 0–3 (1). */
	shadow?: number;
	/** Seeds the desk and the board's tooth (`'box'`). */
	seed?: string;
}

/** The kinds of box. */
export const BOX_KINDS: readonly BoxKind[];
/** Each kind's size in mm, its board's thickness and (a lid box's) lid skirt. */
export const BOXES: Readonly<Record<BoxKind, Readonly<{ width: number; depth: number; height: number; board: number; skirt: number }>>>;
/** Where the lid is for an amount of opening: a mailer's hinge angle (degrees); a lid box's lift and slide (mm) and tilt (degrees). */
export function lidPose(kind: BoxKind, open: number): { hinge: number; lift: number; tilt: number; slide: number };
/** The width and height to frame (mm), and the height of their middle. */
export function boxExtent(kind: BoxKind, open: number): { width: number; height: number; centerY: number };
/** A box in 3D on a canvas, three.js loaded on first use; drawn once, then on demand. Rejects with a TypeError for a bad option. */
export function boxScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: BoxSceneOptions): Promise<Shot>;
