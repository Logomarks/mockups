import type { Art } from '../types.js';
import type { BrandOptions } from '../util/brand.js';
import type { SurfaceOption } from '../materials/desk.js';
import type { ReceiptItem } from '../parts/receipt.js';
import type { PrintShotOptions } from './printshot.js';
import type { LensOptions } from './lens.js';
import type { Shot } from './shot.js';

/** How the strip bends, mm: the far end's curl (radius, share of the length), the near end's lift, and the cup across. */
export const CURL: Readonly<{ radius: number; share: number; lift: number; cup: number }>;

/** A receipt scene's options. */
export interface ReceiptSceneOptions extends PrintShotOptions, LensOptions, BrandOptions {
	/** The mark, printed in thermal black at the head (inline: bytes, SVG or a `data:` URI). Required. */
	art: Art;
	/** The items (placeholders by default). */
	items?: ReceiptItem[];
	/** The currency sign (`'£'`). */
	currency?: string;
	/** A print file instead, 80 mm wide. */
	print?: Art;
	/** The print file's length, mm, 60–600 (200). */
	length?: number;
	/** The table (`'oak'`). */
	surface?: SurfaceOption;
	/** Where the light is, left (-1) to right (1) (0.4). */
	light?: number;
	/** Seeds the table and the barcode (`'receipt'`). */
	seed?: string;
}

/** Where a point of the flat strip (`x` across from its middle, `s` along from its near end, mm) lies once curled, mm, centred. */
export function curlPoint(x: number, s: number, length: number, width?: number): [number, number, number];
/** The printer's serrated cut along both ends, as an alpha mask (white is paper). */
export function tearMask(length: number, px?: number): HTMLCanvasElement;
/** A till receipt on a table, curled, in 3D. Rejects with a TypeError for a bad option. */
export function receiptScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: ReceiptSceneOptions): Promise<Shot>;
