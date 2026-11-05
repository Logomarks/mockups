/**
 * @module @arraypress/mockups/objects/wristband
 *
 * Event wristbands lying on a table: woven fabric bands closed into loops
 * with the name round them and the mark on their sliders, and Tyvek
 * strips printed with the mark, the words and a number, their peel tabs
 * still on. The art is the mark.
 */

import { scene } from '../render/scene.js';
import { resolveSurface, surfaceLayer } from '../materials/desk.js';
import { grainLayer } from '../materials/grain.js';
import { resolveBands, bandPlacements, bandLayer } from '../parts/wristband.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox, turnedBox, union } from '../util/fit.js';

export { WRISTBAND, WRISTBAND_KINDS } from '../parts/wristband.js';

/**
 * A wristband mockup.
 *
 * @param {import('./wristband.js').WristbandOptions} options The mark, the bands and how to show them.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function wristband(options) {
	const o = reader('wristband', options);
	const { art } = /** @type {import('./wristband.js').WristbandOptions} */ (options);
	const name = o.text('name', '');
	const seed = o.text('seed', 'wristband');
	const bands = resolveBands(o.raw('bands') ?? ['fabric', 'fabric', 'tyvek'], name, 'wristband');
	if (!bands.length) throw new TypeError('wristband: bands is a list of at least one band');
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'oak');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));

	const placed = bandPlacements(bands, seed);
	const box = union(placed.map((p) => turnedBox(p.x, p.y, p.w, p.h, p.angle)));
	const { mm, at } = fitBox(box, { width, height }, o.num('fit', 0.86, 0.2, 1));
	const sc = scene({ width, height, key: `wristband:${artKey(art)}:${name}:${seed}:${JSON.stringify(bands)}` });
	sc.add(
		surfaceLayer(sc, surf, { light, seed, mm }),
		bandLayer(sc, { bands, placed, at, mm, light, shadow: strength * surf.shadow, mark: sc.image(art, 1), seed }),
		grainLayer(sc, o.num('grain', 0.5, 0, 1), seed),
	);
	return { svg: sc.svg(), width, height, object: 'wristband' };
}
