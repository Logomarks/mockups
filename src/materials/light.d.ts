import type { Vec3 } from '../util/vec.js';

/** How a surface takes light. */
export interface Finish {
	/** How much of the fill light it shows (0.42). */
	ambient?: number;
	/** How much of the key light (0.62). */
	diffuse?: number;
	/** How bright its highlight is (0). */
	specular?: number;
	/** How tight the highlight is (24). */
	shine?: number;
}

/** The key light's direction (unit, towards it) from the `light` option (-1 left to 1 right) and its height. */
export function keyLight(x: number, height?: number): Vec3;
/** A surface colour under the light: ambient, wrapped Lambert diffuse and a Blinn-Phong highlight, in linear light. */
export function lit(color: string, normal: Vec3, o: { light: Vec3; point: Vec3; eye: Vec3 }, finish?: Finish): string;
