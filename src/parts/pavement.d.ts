import type { Scene } from '../render/scene.js';
import type { View } from '../util/camera.js';
import type { Vec2 } from '../util/shape.js';

/** A rectangle of level ground, cut to what's in front of the camera, in pixels. */
export function patch(view: View, x0: number, x1: number, z0: number, z1: number, y?: number): Vec2[];
/** A street in perspective: paving slabs (joints fading with distance), a kerb, and the road beyond. */
export function street(sc: Scene, view: View, o: { x: [number, number]; back: number; kerb: number; slab?: number; paving?: string; road?: string; light?: number }): string;
