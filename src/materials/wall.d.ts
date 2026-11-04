import type { Scene } from '../render/scene.js';

/** A wall, resolved. */
export interface Wall {
	kind: 'plaster' | 'brick';
	color: string;
}
/** What a wall is: `'plaster'` (off-white), `'brick'`, or a hex colour (painted plaster). */
export type WallSpec = 'plaster' | 'brick' | `#${string}`;

/** The named walls' colours. */
export const WALLS: Readonly<{ plaster: string; brick: string }>;
/** A wall from its option (`'plaster'`); `object` names the caller in the TypeError for anything else. */
export function resolveWall(spec?: unknown, object?: string): Wall;
/** The wall filling `[0, width] × [0, height]` (px). */
export function wallLayer(sc: Scene, wall: Wall, o: { width: number; height: number; mm: number; light: number; seed: string }): string;
/** The wall's relief in its own coordinates, to lay over paper pasted flat to it (clip it to the paper). */
export function wallRelief(sc: Scene, wall: Wall, o: { width: number; height: number; mm: number; light: number; seed: string }): string;
