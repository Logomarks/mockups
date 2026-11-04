import type { Art } from '../../types.js';
import type { Scene } from '../../render/scene.js';

/** A screen theme's colours. */
export interface Theme {
	readonly bg: string;
	readonly raised: string;
	readonly ink: string;
	readonly muted: string;
	readonly line: string;
	readonly bar: string;
}

/** The screens' typeface: the system sans. */
export const FONT: string;
/** The light and dark themes. */
export const THEMES: Readonly<{ light: Theme; dark: Theme }>;
/** One line of type. */
export function text(text: string, x: number, y: number, size: number, fill: string, o?: { weight?: number; anchor?: 'start' | 'middle' | 'end'; opacity?: number; spacing?: number }): string;
/** Placeholder text as soft rounded bars of seeded lengths. */
export function bars(o: { x: number; y: number; width: number; lines: number; size: number; fill: string; seed: string; gap?: number }): string;
/** A status bar (time; signal, wireless, battery) across a screen this wide. */
export function statusBar(width: number, ink: string, top?: number): string;
/** Art in a circle, with a hairline round it. */
export function avatar(sc: Scene, art: Art, cx: number, cy: number, r: number): string;
