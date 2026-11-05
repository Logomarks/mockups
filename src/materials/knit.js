/**
 * @module @logomarks/mockups/materials/knit
 *
 * A chunky knit blanket: columns of stitches, each a "V" of two plump
 * loops lit from the light's side with dark hollows between them, a soft
 * fuzz over the yarn, uneven tone, and a few broad folds where the
 * blanket lies loose.
 */

import { el } from '../render/svg.js';
import { mottle, speckTile } from './noise.js';
import { field, fbm, ridge, blur, shadePng } from '../util/field.js';
import { rng, hash } from '../util/rng.js';
import { n } from '../util/num.js';

/** A stitch's width and height, in mm. */
const STITCH = Object.freeze({ width: 11, height: 8.5 });

/**
 * A knit's stitches, fuzz and folds, drawn over its colour.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} seed The seed.
 * @param {number} mm Pixels per millimetre.
 * @param {number} light Where the light is, left (-1) to right (1).
 * @returns {string} The layers.
 */
export function knit(sc, seed, mm, light) {
	const { width: w, height: h } = sc;
	const s = hash(seed);
	const span = Math.max(w, h) / mm;
	const sw = STITCH.width * mm;
	const sh = STITCH.height * mm;
	// a loop: round, lit on the light's side and towards the top, dark at its rim
	const lit = sc.id('loop');
	sc.def(
		el(
			'radialGradient',
			{ id: lit, cx: n(0.5 + 0.18 * light), cy: 0.36, r: 0.62 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.2 }),
			el('stop', { offset: 0.45, 'stop-color': '#fff', 'stop-opacity': 0.04 }),
			el('stop', { offset: 0.8, 'stop-color': '#000', 'stop-opacity': 0.12 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.32 }),
		),
	);
	const loop = (side, dy) =>
		el('ellipse', {
			cx: 0,
			cy: 0,
			rx: n(sw * 0.24),
			ry: n(sh * 0.66),
			fill: `url(#${lit})`,
			transform: `translate(${n(sw * (0.5 + side * 0.23))} ${n(sh * 0.5 + dy)}) rotate(${side * -30})`,
		});
	const tile = sc.id('knit');
	// each loop runs over the tile's top and bottom, so it's drawn again a row up and down to meet the next
	const loops = [-sh, 0, sh].flatMap((dy) => [loop(-1, dy), loop(1, dy)]).join('');
	sc.def(el('pattern', { id: tile, patternUnits: 'userSpaceOnUse', width: n(sw), height: n(sh) }, el('rect', { width: n(sw), height: n(sh), fill: '#000', opacity: 0.3 }), loops));
	// the folds: a few long soft ridges where the blanket lies loose
	const r = rng(`${seed}:folds`);
	const f = fbm(field(90, Math.max(8, Math.round((90 * h) / w))), { seed: `${seed}:drape`, scale: 1.6, octaves: 2, amp: 0.35 });
	for (let i = 0; i < 3; i++) {
		const y = r.range(0.15, 0.85);
		ridge(f, [-0.1, y], [1.1, y + r.range(-0.3, 0.3)], r.range(0.03, 0.06), r.range(-0.5, 0.6));
	}
	blur(f, 2);
	const folds = el('image', { width: w, height: h, href: shadePng(f, { light, relief: 10, dark: 0.2, bright: 0.1 }), preserveAspectRatio: 'none' });
	const fuzz = speckTile(sc, { size: 256, freq: [0.6 / Math.max(1, mm * 0.25), 0.6 / Math.max(1, mm * 0.25)], octaves: 2, dark: 0.06, light: 0.06, seed: s });
	return mottle(sc, `${seed}:k`, Math.max(2, span / 80), 0.05, 2) + el('rect', { width: w, height: h, fill: `url(#${tile})` }) + el('rect', { width: w, height: h, fill: fuzz }) + folds;
}
