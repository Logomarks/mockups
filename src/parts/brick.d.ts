import type { Scene } from '../render/scene.js';

/** A brick and its joint, in metres. */
export const BRICK: Readonly<{ length: number; height: number; joint: number }>;
/** A brick wall drawn flat in `[0, width] × [0, height]` (to warp onto its plane): seeded tones, mortar, weathering, grime and light. */
export function brickWall(sc: Scene, o: { width: number; height: number; scale: number; color?: string; mortar?: string; light?: number; seed?: string; coping?: boolean }): string;
