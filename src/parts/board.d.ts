import type { Scene } from '../render/scene.js';

/** A face of board in the picture. */
export interface BoardFace {
	/** Its outline, in pixels. */
	d: string;
	/** The board's colour. */
	color: string;
	/** How much darker it is than fully lit, 0–1. */
	shade: number;
	/** A fill for the board's tooth (`url(#…)`), or `null`. */
	texture?: string | null;
	/** Markup drawn on it under the shading (the print, mapped with the face's matrix). */
	print?: string;
	/** A fill laid over it last (light falling off towards the table), or `null`. */
	fall?: string | null;
}

/** How much darker than fully lit a face with this outward normal is, 0–0.55. */
export function faceShade(normal: [number, number, number], light: number): number;
/** One face of board: colour, print, tooth and shading, cut to its outline. */
export function boardFace(sc: Scene, o: BoardFace): string;
/** The cut edge of corrugated board as a strip in its own frame: liners and fluting. */
export function flutes(o: { length: number; thickness: number; color: string; flute?: number }): string;
