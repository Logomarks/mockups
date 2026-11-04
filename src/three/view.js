/**
 * @module @arraypress/mockups/three/view
 *
 * Where the camera is. A view is a tilt (0 looks straight down onto the
 * flat lay, the 2D mockup's front-on view; 60 looks across it), a turn
 * round it, and a distance relative to the one that fits the group in the
 * frame. Things standing are seen level and straight on by default.
 */

/** The default view: straight on. */
export const FRONT = Object.freeze({ tilt: 0, turn: 0, distance: 1, fov: 28 });

/**
 * The camera placed for a view.
 *
 * @param {import('three').PerspectiveCamera} camera The camera.
 * @param {import('./view.js').View} view The view.
 * @param {{ width: number, depth: number, aspect: number, fit: number }} group The group's width and depth on the ground (sleeve units), the frame's aspect, and how much of it the group fills.
 */
export function place(camera, view, group) {
	const v = { ...FRONT, ...view };
	camera.fov = v.fov;
	camera.aspect = group.aspect;
	const half = Math.tan(((v.fov / 2) * Math.PI) / 180);
	const fit = Math.max(group.width / group.aspect, group.depth) / 2 / half / group.fit;
	const d = fit * v.distance;
	const tilt = (Math.max(0, Math.min(85, v.tilt)) * Math.PI) / 180;
	const turn = (v.turn * Math.PI) / 180;
	camera.position.set(Math.sin(turn) * Math.sin(tilt) * d, Math.cos(tilt) * d, Math.cos(turn) * Math.sin(tilt) * d);
	// straight down, "up" is the far side of the lay, turned with the view
	camera.up.set(-Math.sin(turn), tilt < 1e-3 ? 0 : 1, -Math.cos(turn));
	camera.lookAt(0, 0, 0);
	camera.near = d / 50;
	camera.far = d * 10;
	camera.updateProjectionMatrix();
}

/** The default view of things standing: level, straight on, a longer lens. */
export const LEVEL = Object.freeze({ tilt: 0, turn: 0, distance: 1, fov: 22 });

/**
 * The camera placed for a view of things standing up. `tilt` raises the camera to look down on them (0 is level,
 * the 2D mockup's view), `turn` walks it round them.
 *
 * @param {import('three').PerspectiveCamera} camera The camera.
 * @param {import('./view.js').View} view The view.
 * @param {{ width: number, height: number, aspect: number, fit: number, center: [number, number, number] }} group The group's width and height, the frame's aspect, how much of it the group fills, and the point to look at.
 */
export function placeUpright(camera, view, group) {
	const v = { ...LEVEL, ...view };
	camera.fov = v.fov;
	camera.aspect = group.aspect;
	const half = Math.tan(((v.fov / 2) * Math.PI) / 180);
	const d = (Math.max(group.width / group.aspect, group.height) / 2 / half / group.fit) * v.distance;
	const tilt = (Math.max(-10, Math.min(80, v.tilt)) * Math.PI) / 180;
	const turn = (v.turn * Math.PI) / 180;
	const [x, y, z] = group.center;
	camera.position.set(x + Math.sin(turn) * Math.cos(tilt) * d, y + Math.sin(tilt) * d, z + Math.cos(turn) * Math.cos(tilt) * d);
	camera.up.set(0, 1, 0);
	camera.lookAt(x, y, z);
	camera.near = d / 50;
	camera.far = d * 10;
	camera.updateProjectionMatrix();
}
