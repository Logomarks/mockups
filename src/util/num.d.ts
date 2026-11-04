/** `v` held inside `[lo, hi]` (default `[0, 1]`). */
export function clamp(v: number, lo?: number, hi?: number): number;
/** The point `t` of the way from `a` to `b`. */
export function lerp(a: number, b: number, t: number): number;
/** A number as SVG writes it: at most three decimals, no `-0`, no trailing zeros. */
export function n(v: number): string;
