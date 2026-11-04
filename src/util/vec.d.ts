/** A 3-vector: x right, y up, z towards the front. */
export type Vec3 = [number, number, number];

/** `a + b`. */
export function add(a: Vec3, b: Vec3): Vec3;
/** `a - b`. */
export function sub(a: Vec3, b: Vec3): Vec3;
/** `k a`. */
export function scale(a: Vec3, k: number): Vec3;
/** The point `o + s u + t v (+ r w)`. */
export function along(o: Vec3, u: Vec3, s: number, v: Vec3, t: number, w?: Vec3, r?: number): Vec3;
/** `a · b`. */
export function dot(a: Vec3, b: Vec3): number;
/** `a × b`. */
export function cross(a: Vec3, b: Vec3): Vec3;
/** `|a|`. */
export function len(a: Vec3): number;
/** `a / |a|` (zero stays zero). */
export function unit(a: Vec3): Vec3;
/** `a` turned `deg` degrees about the vertical axis (+x towards -z). */
export function yaw(a: Vec3, deg: number): Vec3;
