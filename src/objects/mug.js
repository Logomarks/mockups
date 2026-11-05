/**
 * @module @logomarks/mockups/objects/mug
 *
 * A ceramic mug (11 oz: 82 mm across, 95 mm tall) on a table, seen from a
 * little above, its print wrapped round the curve: one piece centred on
 * the front (and another on the back), or a full wrap round the mug. One
 * mug, or a pair, handles outwards, showing the front and the back.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { resolveSurface } from '../materials/desk.js';
import { grainLayer } from '../materials/grain.js';
import { tabletop } from '../parts/tabletop.js';
import { mug as mugPart, MUG } from '../parts/mug.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox } from '../util/fit.js';

/** The layouts. */
export const MUG_LAYOUTS = /** @type {const} */ (['single', 'pair']);

/**
 * A mug mockup.
 *
 * @param {import('./mug.js').MugOptions} options The print and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function mug(options) {
	const o = reader('mug', options);
	const { art, back } = /** @type {import('./mug.js').MugOptions} */ (options);
	const layout = o.oneOf('layout', 'single', MUG_LAYOUTS);
	const mode = o.oneOf('print', 'front', /** @type {const} */ (['front', 'wrap']));
	const color = o.color('color', '#f6f5f1');
	const inside = o.color('inside', color);
	const handle = o.oneOf('handle', 'right', /** @type {const} */ (['left', 'right']));
	const aspect = o.num('aspect', 1, 0.2, 5);
	const height = o.num('printHeight', mode === 'wrap' ? MUG.print : 64, 10, MUG.print);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const gloss = o.num('gloss', 1, 0, 2);
	const turn = o.num('turn', 0, -180, 180);
	const seed = o.text('seed', 'mug');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'oak');
	const { width, height: frameH } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));
	const fit = o.num('fit', layout === 'pair' ? 0.86 : 0.62, 0.2, 1);

	const R = MUG.diameter / 2;
	const C = Math.PI * MUG.diameter;
	const mugs =
		layout === 'pair'
			? [
					{ x: -R - 20, y: 0, handle: /** @type {'left' | 'right'} */ ('left'), side: 0 },
					{ x: R + 20, y: 0, handle: /** @type {'left' | 'right'} */ ('right'), side: 1 },
				]
			: [{ x: handle === 'right' ? -14 : 14, y: 0, handle, side: 0 }];
	const xs = mugs.map((m) => [m.x + (m.handle === 'left' ? -R - 36 : -R), m.x + (m.handle === 'right' ? R + 36 : R)]).flat();
	const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: -MUG.height - 10, y1: 12 };
	const { mm, at } = fitBox(box, { width, height: frameH }, fit);
	const sc = scene({ width, height: frameH, key: `mug:${layout}:${mode}:${artKey(art)}:${artKey(back)}:${seed}` });

	const front = sc.image(art, mode === 'wrap' ? (C - MUG.gap) / height : aspect);
	const rear = back ? sc.image(back, aspect) : null;
	/**
	 * The print unrolled, in px: the front centred at 0, the back half way round (and a wrap repeated each way, so any turn finds it).
	 *
	 * @param {number} px Pixels per mm.
	 * @param {number} ph The print's height in px.
	 * @returns {string} The markup.
	 */
	const draw = (px, ph) => {
		if (mode === 'wrap') {
			const w = (C - MUG.gap) * px;
			return [-1, 0, 1].map((k) => front(k * C * px - w / 2, 0, w, ph)).join('');
		}
		const w = ph * aspect;
		const one = (place, at0) => [-1, 0, 1].map((k) => place(at0 + k * C * px - w / 2, 0, w, ph)).join('');
		return one(front, 0) + (rear ? one(rear, (C / 2) * px) : '');
	};

	sc.add(tabletop(sc, surf, { light, seed, mm }));
	for (const m of mugs) {
		const [cx, base] = at(m.x, m.y);
		sc.add(
			el(
				'g',
				{},
				mugPart(sc, {
					cx,
					base,
					mm,
					color,
					inside,
					handle: m.handle,
					light,
					gloss,
					shadow: strength * surf.shadow,
					// the second of a pair shows the back (half way round a wrap); with no back it shows the front too
					turn: m.side && (rear || mode === 'wrap') ? 180 : turn,
					print: { height, draw },
				}),
			),
		);
	}
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height: frameH, object: 'mug' };
}
