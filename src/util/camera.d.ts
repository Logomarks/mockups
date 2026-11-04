import type { Vec3 } from './vec.js';

/** Where a camera is and what it looks at. */
export interface Orbit {
	/** The point it looks at (the origin). */
	target?: Vec3;
	/** Degrees about the vertical; positive moves the camera to the right of the front (0). */
	turn?: number;
	/** Degrees above the horizon; 90 looks straight down (0). */
	pitch?: number;
	/** How far it is from the target (10). */
	distance?: number;
	/** The vertical field of view in degrees (30). */
	fov?: number;
}

/** A pinhole camera. */
export interface Camera {
	readonly eye: Vec3;
	readonly forward: Vec3;
	readonly right: Vec3;
	readonly up: Vec3;
	/** A world point in unit image coordinates (y down), and its depth. */
	project(q: Vec3): [number, number, number];
}

/** A camera framed in pixels. */
export interface View {
	readonly cam: Camera;
	readonly width: number;
	readonly height: number;
	/** Pixels per unit of image coordinates. */
	readonly scale: number;
	/** A world point in pixels. */
	at(q: Vec3): [number, number];
	/** How far in front of the camera a point is. */
	depth(q: Vec3): number;
	/** Whether a surface at `q` facing `normal` faces the camera. */
	faces(q: Vec3, normal: Vec3): boolean;
}

/** A camera orbiting its target. */
export function camera(o?: Orbit): Camera;
/** The camera's picture scaled and centred so `points` fill `fit` of the frame (moved by `shift`, fractions of the frame). */
export function frame(cam: Camera, o: { width: number; height: number; points: Vec3[]; fit?: number; shift?: [number, number] }): View;
/** A flat surface's points in pixels: `(x, y)` along `u` and `v` from `o` (a projective map). */
export function onPlane(view: View, o: Vec3, u: Vec3, v: Vec3): (x: number, y: number) => [number, number];
/** How far down the frame the horizon falls, in pixels (it may be off the frame). */
export function horizon(view: View): number;
/** A polygon cut where it passes closer than `near` to (or behind) the camera, so it can be projected. */
export function clipNear(view: View, poly: readonly Vec3[], near: number): Vec3[];
/** The stretch of a level line (at height `y`, depth `z`) in front of the camera and within the frame plus `margin` (0.25 of its width) each side. */
export function seen(view: View, y: number, z: number, range: [number, number], margin?: number): [number, number];
