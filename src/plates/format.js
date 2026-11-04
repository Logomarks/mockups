/**
 * @module @arraypress/mockups/plates/format
 *
 * The plate format: a real photo with one or more screens in it (a
 * billboard's poster, a shop's fascia, a shelter's lightbox, a laptop's
 * display). Each screen is its four corners in the photo, the kind of
 * surface it is, and maps cut from the photo over its box: the shading (the
 * blank sign's own light, multiplied into the art), the occluders (whatever
 * stands in front of it), and the reflections on glass. Files are named
 * relative to where the plate lives; a loaded plate has them inlined.
 */

/**
 * How each kind of surface takes the art.
 *
 * - `print`: paper or vinyl, lit by the scene: the art is multiplied by the shading.
 * - `paint`: a painted board: the same, from a shading map with the paint's colour taken out.
 * - `backlit`: a lightbox or a display: the art glows, bleeding a little light round it.
 * - `glass`: a print behind glass: shaded, with the glass's reflections laid back over it.
 */
export const PLATE_KINDS = Object.freeze(['print', 'paint', 'backlit', 'glass']);

/**
 * Each kind's defaults: the softness (a blur in pixels, to match the photo's
 * own sharpness), the black (how far the art's darkest is from true black
 * before the light falls on it: ink and paint reflect a little, a lightbox
 * leaks a little, 0–1), the glow round a lightbox (0–1), and the glass's veil
 * of reflected light (0–1, a flat lift over everything).
 */
export const KIND_LOOKS = Object.freeze({
	print: Object.freeze({ soften: 0.6, black: 0.04, glow: 0, sheen: 0 }),
	paint: Object.freeze({ soften: 0.8, black: 0.05, glow: 0, sheen: 0 }),
	backlit: Object.freeze({ soften: 0.5, black: 0.02, glow: 0.45, sheen: 0 }),
	glass: Object.freeze({ soften: 0.6, black: 0.04, glow: 0, sheen: 0.05 }),
});

/**
 * Whether a value is a finite number.
 *
 * @param {unknown} v The value.
 * @returns {v is number}
 */
const finite = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Whether a value is a non-empty string.
 *
 * @param {unknown} v The value.
 * @returns {v is string}
 */
const named = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Checks a plate and fills in each screen's defaults.
 *
 * @param {import('./format.js').Plate} plate The plate.
 * @returns {import('./format.js').Plate} The same plate, its screens with every look set.
 * @throws {TypeError} When a field is missing or of the wrong kind.
 */
export function checkPlate(plate) {
	const fail = (what) => {
		throw new TypeError(`plate${plate && named(plate.name) ? ` '${plate.name}'` : ''}: ${what}`);
	};
	if (!plate || typeof plate !== 'object') fail('pass a plate object');
	if (!named(plate.name)) fail('name is a string');
	if (!finite(plate.width) || !finite(plate.height) || plate.width <= 0 || plate.height <= 0) fail('width and height are positive numbers');
	if (!named(plate.photo)) fail('photo is a file name or an href');
	if (!Array.isArray(plate.screens) || !plate.screens.length) fail('screens is a non-empty array');
	const screens = plate.screens.map((s, i) => {
		const at = `screens[${i}]`;
		if (!s || typeof s !== 'object') fail(`${at} is an object`);
		if (!PLATE_KINDS.includes(s.kind)) fail(`${at}.kind is one of ${PLATE_KINDS.join(', ')} (got ${JSON.stringify(s.kind)})`);
		if (!Array.isArray(s.corners) || s.corners.length !== 4 || !s.corners.every((p) => Array.isArray(p) && p.length === 2 && p.every(finite))) fail(`${at}.corners is four [x, y] points`);
		if (!finite(s.aspect) || s.aspect <= 0) fail(`${at}.aspect is a positive number (the sign's width over its height)`);
		if (!Array.isArray(s.box) || s.box.length !== 4 || !s.box.every(finite)) fail(`${at}.box is [x, y, width, height]`);
		for (const f of /** @type {const} */ (['shading', 'mask', 'reflection'])) if (s[f] !== undefined && !named(s[f])) fail(`${at}.${f} is a file name or an href`);
		for (const f of /** @type {const} */ (['noise', 'soften', 'black', 'glow', 'sheen'])) if (s[f] !== undefined && (!finite(s[f]) || s[f] < 0)) fail(`${at}.${f} is a number, 0 or more`);
		return { ...KIND_LOOKS[s.kind], noise: 0, ...s };
	});
	return { ...plate, screens };
}

/**
 * The files a plate names: its photo, then each screen's maps.
 *
 * @param {import('./format.js').Plate} plate The plate.
 * @returns {string[]} The file names (or hrefs), each once.
 */
export function plateFiles(plate) {
	const files = [plate.photo];
	for (const s of plate.screens) for (const f of [s.shading, s.mask, s.reflection]) if (f) files.push(f);
	return [...new Set(files)];
}
