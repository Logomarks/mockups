/**
 * @module @logomarks/mockups/three/pizza
 *
 * A pizza box, closed: the 3D box's `'pizza'` kind (a flat corrugated
 * mailer, 340 × 340 × 45 mm, its cut edges showing the flutes), its lid
 * printed in one ink as pizza boxes are: the brand's mark and name in the
 * middle inside a thin roundel, the ink sitting in the board's fibres.
 * Kraft or white board, seen from above at an angle through a lens.
 */

import { scene as doc } from '../render/scene.js';
import { el } from '../render/svg.js';
import { ink as inked } from '../render/ink.js';
import { lockupIn } from '../parts/lockup.js';
import { reader } from '../util/reader.js';
import { boxScene } from './box.js';

/**
 * The lid's print: the lockup in the middle, inside a thin roundel, in one ink, on a clear square panel.
 *
 * @param {object} o The print.
 * @param {import('../types.js').Art} o.mark The mark.
 * @param {string} o.name The name ('' for the mark alone).
 * @param {string} o.ink The ink.
 * @param {boolean} [o.roundel=true] Whether a roundel rings it.
 * @returns {string} The print, an SVG 1000 units square.
 */
export function pizzaLid({ mark, name, ink, roundel = true }) {
	const W = 1000;
	const sc = doc({ width: W, height: W, key: `pizza:${name}:${ink}` });
	if (roundel) {
		sc.add(el('circle', { cx: W / 2, cy: W / 2, r: W * 0.36, fill: 'none', stroke: ink, 'stroke-width': W * 0.008 }));
		sc.add(el('circle', { cx: W / 2, cy: W / 2, r: W * 0.335, fill: 'none', stroke: ink, 'stroke-width': W * 0.003 }));
	}
	const box = roundel ? W * 0.4 : W * 0.56;
	sc.add(lockupIn(sc, { mark: inked(mark, ink), name, ink, size: box, layout: 'stack', weight: 700, x: (W - box) / 2, y: (W - box) / 2, width: box, height: box }));
	return sc.svg();
}

/**
 * A closed pizza box on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./pizza.js').PizzaSceneOptions} options The mark (inline), the name and ink, and the box's own options.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function pizzaScene(canvas, options) {
	const o = reader('pizzaScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const board = o.raw('board') ?? 'kraft';
	const ink = o.color('ink', board === 'black' ? '#f1ede4' : board === 'white' ? '#c8332b' : '#1c1a17');
	const name = o.text('name', '');
	const roundel = o.bool('roundel', true);
	const view = /** @type {import('./view.js').View} */ (o.raw('view') ?? {});
	return boxScene(canvas, {
		blur: 0.4,
		samples: 24,
		...options,
		kind: 'pizza',
		art: pizzaLid({ mark: art, name, ink, roundel }),
		print: 'cover',
		board: /** @type {import('../materials/board.js').BoardOption} */ (board),
		view: { tilt: 52, turn: -22, ...view },
		fit: options.fit ?? 0.8,
	});
}

