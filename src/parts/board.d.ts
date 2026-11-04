import type { Scene } from '../render/scene.js';

/** A face of board in the picture. */
export interface BoardFace {
	/** Its outline, in pixels. */
	d: string;
	/** The board's colour. */
	color: string;
	/** How much darker it is than fully lit, 0–1. */
	shade: number;
	/** What it darkens towards (`'#000'`; kraft's shadows are a warm brown, light bouncing inside the fibres). */
	shadeColor?: string;
	/** A fill for the board itself over its colour (the kraft photograph, `url(#…)`), or `null`. */
	base?: string | null;
	/** A fill for the board's grain, laid over its print (`url(#…)`), or `null`. */
	texture?: string | null;
	/** Markup drawn on it under the grain and shading (the print, mapped with the face's matrix); it's softened and desaturated a touch, as ink on board is. */
	print?: string;
	/** Markup over the grain, under the shading (folds, occlusion), cut to the face. */
	over?: string;
	/** A fill laid over it last (light falling off towards the table), or `null`. */
	fall?: string | null;
}

/** How much darker than fully lit a face with this outward normal is, 0–0.55. */
export function faceShade(normal: [number, number, number], light: number): number;
/** One face of board: colour, the board, print, grain and shading, cut to its outline. */
export function boardFace(sc: Scene, o: BoardFace): string;
/** The cut edge of corrugated board as a strip in its own frame (outer liner at 0): liners and the fluted medium. */
export function flutes(o: { length: number; thickness: number; color: string; inner?: string; medium?: string; flute?: number }): string;
