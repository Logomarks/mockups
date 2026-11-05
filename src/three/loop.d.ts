import type { View } from './view.js';

/** Whether the reader asks for reduced motion (false outside a browser). */
export function reducedMotion(): boolean;
/** Draws frames (`t` seconds since it began) at `fps` (30), only while the canvas is on screen and the page shown, and none with reduced motion. */
export function loop(canvas: HTMLCanvasElement | OffscreenCanvas, frame: (t: number) => void, o?: { fps?: number }): { stop: () => void };
/** The view a drifting camera has at `t` seconds: a slow wander of a few degrees (× `amount`) round `view`. */
export function drifted(view: View, t: number, amount: number): View;
