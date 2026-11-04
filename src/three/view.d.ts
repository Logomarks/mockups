/** Where the camera is. */
export interface View {
	/** Degrees from straight down (0, the front-on view) towards looking across the lay (up to 85). */
	tilt?: number;
	/** Degrees round the lay. */
	turn?: number;
	/** Distance relative to the one that fits the group (1). */
	distance?: number;
	/** The lens's vertical field of view, degrees (28). */
	fov?: number;
}

/** The default view: straight on. */
export const FRONT: Readonly<Required<View>>;
/** Places the camera for a view of a group of this size. */
export function place(camera: import('three').PerspectiveCamera, view: View, group: { width: number; depth: number; aspect: number; fit: number }): void;
