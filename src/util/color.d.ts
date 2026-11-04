/** A hex colour (`#rgb` or `#rrggbb`) as red, green and blue, 0–255. Throws a TypeError for anything else. */
export function rgb(hex: string): [number, number, number];
/** Channels (0–255, rounded and clamped) as `#rrggbb`. */
export function hex(c: readonly number[]): string;
/** `a` mixed with `t` of `b`, as `#rrggbb`. */
export function mix(a: string, b: string, t: number): string;
/** Two colours multiplied, as light through a filter is, as `#rrggbb`. */
export function multiply(a: string, b: string): string;
/** How light a colour is: Rec. 709 luma, 0 to 1. */
export function luma(c: string): number;
/** Whether `v` is a `#rgb` or `#rrggbb` string. */
export function isHex(v: unknown): v is string;
