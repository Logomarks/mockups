import type { Scene } from '../render/scene.js';

/** A sky's look: its gradient (zenith to horizon), its clouds' colour, how many, and the sun's glow. */
export interface SkyLook {
	readonly stops: readonly string[];
	readonly cloud: string;
	readonly clouds: number;
	readonly sun: string;
}

/** The skies. */
export const SKIES: Readonly<{ day: SkyLook; dusk: SkyLook; night: SkyLook }>;

/** A soft gradient sky with a sun glow and seeded clouds, filling the frame down to `horizon` (pixels). */
export function sky(sc: Scene, o: { time?: 'day' | 'dusk' | 'night'; horizon: number; sun?: number; seed?: string }): string;
