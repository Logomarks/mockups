import type { Scene } from '../render/scene.js';
import type { View } from '../util/camera.js';

/** The far side of a street, out of focus: seeded hazy blocks with rows of windows (lit at night) at depth `z`. */
export function skyline(sc: Scene, view: View, o: { z: number; x: [number, number]; night?: boolean; haze?: string; seed?: string }): string;
