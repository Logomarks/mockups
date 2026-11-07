import type { Scene } from '../render/scene.js';
import type { Finish, FinishType, PlateScreen } from './format.js';

/** A finish with every setting filled in. */
export interface ResolvedFinish {
	type: FinishType;
	depth: number;
	edge: number;
	tone: number;
	ink: boolean;
	color: string | undefined;
	metal: string;
}

/** The finishes: `'ink'` (printed), `'deboss'`, `'emboss'`, `'engrave'` and `'foil'`. */
export const PLATE_FINISHES: readonly FinishType[];
/** Foil's metals, each its dark, mid, light and highlight tones. */
export const PLATE_METALS: Readonly<Record<'gold' | 'silver' | 'copper' | 'rose', readonly string[]>>;
/** Where the light comes from when a screen doesn't say (225: the top left). */
export const DEFAULT_LIGHT: number;
/** A finish from its option, every setting filled in. Throws a TypeError for an unknown finish or a bad setting. */
export function resolveFinish(v: Finish | undefined | null, at?: string): ResolvedFinish;
/** The relief filter (`url(#…)`): the art's alpha blurred into a height, lit from `azimuth`, flat as mid-grey for `hard-light`. */
export function reliefFilter(sc: Scene, box: readonly number[], sigma: number, depth: number, azimuth: number): string;
/** A filter (`url(#…)`) turning the art into one flat colour, its alpha kept. */
export function flatFilter(sc: Scene, box: readonly number[], color: string, soften?: number): string;
/** The cloth filter (`url(#…)`): the art displaced by the screen's shading's folds, `amount` pixels at most. */
export function clothFilter(sc: Scene, s: PlateScreen, amount: number): string;
/** The layers a finish lays over a sign (inside its edge mask), from the art warped alone (`alone`, an id). */
export function finishLayers(sc: Scene, s: PlateScreen, o: { finish: ResolvedFinish; alone: string; size: number; fill: string }): string;
