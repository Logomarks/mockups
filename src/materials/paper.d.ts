import type { Scene } from '../render/scene.js';

/** A stock's name. */
export type StockName = 'matte' | 'uncoated' | 'gloss' | 'cotton' | 'kraft';

/** A paper or board stock. */
export interface Stock {
	readonly name: StockName;
	/** The paper's own colour. */
	readonly color: string;
	/** How much of its tooth shows (1 is uncoated). */
	readonly tooth: number;
	/** How strongly it shines (1 is a satin coat). */
	readonly sheen: number;
}

/** The stocks: colour, tooth and sheen. */
export const STOCKS: Readonly<Record<StockName, Readonly<Omit<Stock, 'name'>>>>;
/** A stock by name (`'matte'`); `object` names the caller in the TypeError for an unknown one. */
export function resolveStock(name?: StockName, object?: string): Stock;
/** The tooth of a sheet as a fill (`url(#…)`), scaled to the paper. */
export function toothFill(sc: Scene, mm: number, seed?: number): string;
/** What the stock does to a print over a shape (its white, its tooth, its sheen), to draw over the art. */
export function finish(sc: Scene, o: { stock: Stock; shape: string; mm: number; light: number; angle?: number; seed?: number }): string;
