import type { Art } from '../types.js';

/** SVG markup drawn onto a new canvas of this size. */
export function drawSvg(svg: string, w: number, h: number): Promise<HTMLCanvasElement>;
/** A print file trimmed of its bleed (mm per side, 0), filling a canvas of the trim's proportions (`px` per mm, 20). */
export function trimCanvas(art: Art, o: { trim: [number, number]; bleed?: number; px?: number }): Promise<HTMLCanvasElement>;
/** A printed panel (`size` in mm): the board's colour (or clear, `null`), the art filling it (`'cover'`), whole and centred (`'contain'`), or set in its middle (`'logo'`, `scale` of its smaller side). */
export function panelCanvas(
	art: Art,
	o: { size: [number, number]; color: string | null; fit?: 'cover' | 'contain' | 'logo'; scale?: number; aspect?: number; px?: number },
): Promise<HTMLCanvasElement>;
/** An artwork's width over its height, decoded (1 when it has no size of its own). */
export function artAspect(art: Art): Promise<number>;
