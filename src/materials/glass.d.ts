import type { Scene } from '../render/scene.js';
import type { Vec2 } from '../util/shape.js';

/** The faint reflections on a pane of glass (a sheen from the light's corner, a soft diagonal band), clipped to its outline. */
export function glass(sc: Scene, o: { outline: readonly Vec2[]; light: number; strength?: number; band?: number }): string;
