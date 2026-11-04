/** Where the camera is. */
export interface View {
	/** Degrees from the front-on view: over a flat lay, from straight down towards looking across it (up to 85); of things standing, from level up to looking down on them (-10 to 80). */
	tilt?: number;
	/** Degrees round the group. */
	turn?: number;
	/** Distance relative to the one that fits the group (1). */
	distance?: number;
	/** The lens's vertical field of view, degrees (28 over a flat lay, 22 for things standing). */
	fov?: number;
}

/** The default view: straight on. */
export const FRONT: Readonly<Required<View>>;
/** Places the camera for a view of a group of this size. */
export function place(camera: import('three').PerspectiveCamera, view: View, group: { width: number; depth: number; aspect: number; fit: number }): void;
/** The default view of things standing: level, straight on, a 22° lens. */
export const LEVEL: Readonly<Required<View>>;
/** Places the camera for a view of things standing: `tilt` raises it to look down on them, `turn` walks it round them. */
export function placeUpright(camera: import('three').PerspectiveCamera, view: View, group: { width: number; height: number; aspect: number; fit: number; center: [number, number, number] }): void;
