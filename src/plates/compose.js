/**
 * @module @logomarks/mockups/plates/compose
 *
 * A plate with art in it: the photo, and over it each screen composited so
 * the art reads as printed (or lit, or glazed) in the scene rather than
 * pasted on. The result is a layered SVG like every other mockup, at the
 * photo's size, so it rasterises the same way in Node and in a browser.
 * Load the plate first (`loadPlate` from `./node` or `./browser`), so its
 * photo and maps are inline.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { clamp } from '../util/num.js';
import { isHex } from '../util/color.js';
import { num, oneOf } from '../util/options.js';
import { checkPlate } from './format.js';
import { screenLayers } from './layers.js';
import { resolveFinish } from './finish.js';

/**
 * A plate mockup.
 *
 * @param {import('./format.js').Plate} plate The plate, loaded (its files inline) or with hrefs a renderer can reach.
 * @param {import('./compose.js').PlateOptions} options The art and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG, at the photo's size.
 * @throws {TypeError} When the plate or an option is malformed.
 */
export function plate(plate, options) {
	const p = checkPlate(plate);
	if (!options || typeof options !== 'object') throw new TypeError('plate: pass { art, … }');
	const { art, seed = p.name } = options;
	const arts = Array.isArray(art) ? art : [art];
	if (!arts.length || arts.some((a) => a === undefined || a === null)) throw new TypeError('plate: art is required');
	const fit = oneOf('plate', 'fit', options.fit, ['cover', 'contain', 'top'], 'cover');
	if (options.background !== undefined && options.background !== 'none' && !isHex(options.background)) throw new TypeError(`plate: background is a hex colour or 'none' (got ${JSON.stringify(options.background)})`);
	const grain = clamp(num('plate', options.grain, 1, 'grain'), 0, 3);

	const sc = scene({ width: p.width, height: p.height, key: JSON.stringify({ o: 'plate', name: p.name, seed }) });
	const photo = sc.id('photo');
	sc.def(el('image', { id: photo, href: p.photo, width: p.width, height: p.height, preserveAspectRatio: 'none' }));
	sc.add(el('use', { href: `#${photo}` }));
	const finishes = Array.isArray(options.finish) ? options.finish : [options.finish];
	p.screens.forEach((s, i) => {
		const glow = options.glow === undefined ? s.glow : clamp(num('plate', options.glow, s.glow, 'glow'), 0, 1);
		const finish = resolveFinish(finishes[i % finishes.length] ?? s.finish, 'plate');
		// the ground round the art: the option's, the screen's own, or white paper
		const background = options.background ?? s.background ?? '#ffffff';
		sc.add(screenLayers(sc, s, { art: arts[i % arts.length], fit, background, grain, glow, photo, seed: `${seed}:${i}`, finish }));
	});
	return { svg: sc.svg(), width: p.width, height: p.height, object: 'plate' };
}
