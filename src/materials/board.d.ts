import type { Scene } from '../render/scene.js';
import type { Field } from '../util/field.js';

/** A board by name, or a hex colour. */
export type BoardOption = 'kraft' | 'white' | 'black' | `#${string}`;

/** How a board's fibre reads. */
export interface FibreLook {
	/** The flocs' strength at about 16, 5 and 1.4 mm. */
	readonly flocs: readonly [number, number, number];
	/** Fine grain, cell by cell. */
	readonly grain: number;
	/** Fibres per mm². */
	readonly fibres: number;
	/** How much lighter or darker a fibre is. */
	readonly fibreTone: number;
	/** The share of fibres that are darker. */
	readonly darker: number;
	/** Flecks per mm². */
	readonly flecks: number;
	/** How much darker a fleck is. */
	readonly fleckTone: number;
	/** How strongly the fibres' relief shows. */
	readonly relief: number;
}

/** A board resolved. */
export interface Board {
	/** Its name, or `'custom'` for a colour. */
	name: 'kraft' | 'white' | 'black' | 'custom';
	/** Its colour. */
	color: string;
	/** How its fibre reads. */
	look: FibreLook;
}

/** The board colours by name. */
export const BOARDS: Readonly<{ kraft: string; white: string; black: string }>;
/** Each named board's fibre. */
export const FIBRE_LOOKS: Readonly<Record<'kraft' | 'white' | 'black', FibreLook>>;
/** A board from its option (`'kraft'`); `object` names the caller in the TypeError for anything else. */
export function resolveBoard(v?: BoardOption, object?: string): Board;
/** The inside's colour: kraft lighter and warmer, a white mailer kraft, anything else its own colour. */
export function liningFor(board: Board, kind: 'mailer' | 'lid'): string;
/** A seamless tile of procedural fibre: tone (signed) and height, `size` cells (256) over `span` mm (40). */
export function fibreField(look: FibreLook, o: { seed: string; size?: number; span?: number }): { tone: Field; height: Field; span: number };
/** Procedural fibre as a grey-and-alpha PNG `data:` URI to lay over a board's colour. */
export function fibrePng(look: FibreLook, seed: string, size?: number, span?: number): string;
/** A board's surface on one face, in the face's frame: the kraft photograph (`base`, or `null` for the flat colour) and the grain to lay over the colour and the print. */
export function boardSurface(
	sc: Scene,
	o: { color: string; kraft: boolean; look: FibreLook; matrix: string; seed: string; grain?: number },
): { base: string | null; grain: string };
