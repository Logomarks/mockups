import type { Scene } from '../render/scene.js';
import type { View } from '../util/camera.js';
import type { Vec3 } from '../util/vec.js';
import type { Finish } from '../materials/light.js';

/** A round post in perspective, shaded across like a cylinder. */
export function pole(sc: Scene, view: View, o: { from: Vec3; to: Vec3; radius: number; color: string; light: Vec3; finish?: Finish }): string;
