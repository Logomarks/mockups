/**
 * @module @logomarks/mockups/three/printshot
 *
 * The options every 3D print scene shares, read and checked: the drawing's
 * size and pixel ratio, the exposure, how much of the frame the group
 * fills, and the camera's view (merged over the scene's own default).
 */

/**
 * How a print scene is shot, from its options.
 *
 * @param {import('../util/reader.js').Reader} o The scene's options.
 * @param {object} d The scene's own settings.
 * @param {string} d.ground The colour bare ground should come out.
 * @param {number} d.light Where the light is.
 * @param {'flat' | 'upright'} d.layout Lying on the desk, or standing.
 * @param {number} d.fit How much of the frame the group fills by default.
 * @param {import('./view.js').View} d.view The scene's default view.
 * @returns {import('./shot.js').ShotOptions} The shot.
 * @throws {TypeError} When a size, the view or the exposure is the wrong kind.
 */
export function shotOf(o, { ground, light, layout, fit, view }) {
	const v = o.raw('view');
	if (v !== undefined && (!v || typeof v !== 'object')) throw new TypeError(`view is { tilt, turn, distance, fov } (got ${JSON.stringify(v)})`);
	const given = /** @type {Record<string, unknown>} */ (v ?? {});
	for (const k of ['tilt', 'turn', 'distance', 'fov']) {
		if (given[k] !== undefined && (typeof given[k] !== 'number' || !Number.isFinite(given[k]))) throw new TypeError(`view.${k} is a number (got ${JSON.stringify(given[k])})`);
	}
	const size = (name) => {
		const s = o.raw(name);
		if (s === undefined) return undefined;
		return o.num(name, 0, 1, 8192);
	};
	const exposure = o.raw('exposure') === undefined ? undefined : o.num('exposure', 1, 0.01, 20);
	return {
		ground: { color: ground },
		light,
		layout,
		width: size('width'),
		height: size('height'),
		pixelRatio: o.num('pixelRatio', 1, 0.25, 4),
		exposure,
		fit: o.num('fit', fit, 0.2, 1),
		view: { ...view, .../** @type {import('./view.js').View} */ (given) },
	};
}
