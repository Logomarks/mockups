import type { Scene, PlaceArt } from '../../render/scene.js';

/** A cassette shell's size, in mm (100.4 × 63.8). */
export const SHELL: Readonly<{ width: number; height: number }>;
/** The named shells: colour and opacity. */
export const SHELLS: Readonly<Record<'black' | 'white' | 'clear' | 'smoke', Readonly<{ color: string; opacity: number }>>>;
/** A shell's plastic. */
export type ShellSpec = 'black' | 'white' | 'clear' | 'smoke' | `#${string}` | { color: string; opacity?: number };
/** A shell from its option (`'black'`). Throws a TypeError for anything else. */
export function resolveShell(spec?: unknown): { color: string; opacity: number };
/** A cassette front on: the shell, its label with the window cut through, the hubs and tape, the head area, the screws. */
export function shell(
	sc: Scene,
	o: { x: number; y: number; mm: number; shell: { color: string; opacity: number }; label: PlaceArt | null; paper: string; title: string; light: number },
): string;
