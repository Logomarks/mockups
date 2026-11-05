/**
 * @module @logomarks/mockups/util/options
 *
 * Checking the options the perspective objects share: a number, one of a
 * few names, and a view (a named angle, or a tilt and a turn), each with
 * an error that names the object and the option.
 */

/**
 * A number option, or its default.
 *
 * @param {string} object The object's name, for the error.
 * @param {unknown} v The option.
 * @param {number} fallback Its default.
 * @param {string} name Its name, for the error.
 * @returns {number} The number.
 * @throws {TypeError} When it's given and isn't a finite number.
 */
export function num(object, v, fallback, name) {
	if (v === undefined) return fallback;
	if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`${object}: ${name} is a number (got ${JSON.stringify(v)})`);
	return v;
}

/**
 * One of a few names, or its default.
 *
 * @template {string} T
 * @param {string} object The object's name, for the error.
 * @param {string} name The option's name.
 * @param {unknown} v The option.
 * @param {readonly T[]} names The names it may be.
 * @param {T} fallback Its default.
 * @returns {T} The name.
 * @throws {TypeError} When it's given and isn't one of them.
 */
export function oneOf(object, name, v, names, fallback) {
	if (v === undefined) return fallback;
	if (!names.includes(/** @type {T} */ (v))) throw new TypeError(`${object}: ${name} is ${names.map((s) => `'${s}'`).join(', ')} (got ${JSON.stringify(v)})`);
	return /** @type {T} */ (v);
}

/**
 * A view: one of the object's named views, or a tilt and a turn of its own.
 *
 * @param {string} object The object's name, for the error.
 * @param {unknown} v The option: a name, or `{ tilt, turn }` (either may be left out).
 * @param {Readonly<Record<string, Readonly<{ tilt: number, turn: number }>>>} named The named views.
 * @param {string} fallback The default view's name.
 * @returns {{ tilt: number, turn: number }} The view, in degrees.
 * @throws {TypeError} For an unknown name or a bad angle.
 */
export function viewOf(object, v, named, fallback) {
	if (v === undefined || typeof v === 'string') {
		const key = v ?? fallback;
		if (!Object.hasOwn(named, key)) throw new TypeError(`${object}: view is ${Object.keys(named).map((s) => `'${s}'`).join(', ')} or { tilt, turn } (got ${JSON.stringify(v)})`);
		return { ...named[key] };
	}
	if (typeof v !== 'object' || v === null) throw new TypeError(`${object}: view is a name or { tilt, turn } (got ${JSON.stringify(v)})`);
	const o = /** @type {{ tilt?: unknown, turn?: unknown }} */ (v);
	const base = named[fallback];
	return { tilt: num(object, o.tilt, base.tilt, 'view.tilt'), turn: num(object, o.turn, base.turn, 'view.turn') };
}
