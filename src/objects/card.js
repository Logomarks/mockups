/**
 * @module @logomarks/mockups/objects/card
 *
 * Business cards, 85 × 55 mm, seen from above on a desk: one card, the
 * front and back side by side, a stack with a back beside it, or a fan.
 * Board thickness shows along the edge nearer the camera, so an
 * edge-painted card shows its colour, and a stack shows its layers. Everything is laid out in millimetres and fitted to the frame.
 */

import { scene } from '../render/scene.js';
import { resolveSurface, surfaceLayer } from '../materials/desk.js';
import { resolveStock } from '../materials/paper.js';
import { grainLayer } from '../materials/grain.js';
import { trimmed } from '../parts/print.js';
import { sheet } from '../parts/sheet.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox, turnedBox, union } from '../util/fit.js';
import { hash, rng } from '../util/rng.js';

/** A business card's size, in mm (ISO 7810 ID-1 is 85.6 × 54; the European card is 85 × 55). */
export const CARD = Object.freeze({ width: 85, height: 55 });

/** The layouts. */
export const CARD_LAYOUTS = /** @type {const} */ (['flat', 'pair', 'stack', 'fan']);

/**
 * Where each card goes, back to front, in mm.
 *
 * @param {import('./card.js').CardLayout} layout The layout.
 * @param {boolean} twoSided Whether there's a back to show.
 * @param {number} count How many cards a stack or fan has.
 * @param {string} seed The seed (a stack's cards sit a little untidily).
 * @returns {import('./card.js').CardPlacement[]} The cards: centre, turn, side, how far each is off the desk, and its layer in a stack.
 */
export function cardPlacements(layout, twoSided, count, seed) {
	const W = CARD.width;
	const H = CARD.height;
	const back = twoSided ? 'back' : 'front';
	if (layout === 'pair') {
		return [
			{ x: -W * 0.36, y: -H * 0.42, angle: -7, side: 'front', lift: 0.2, layer: 0 },
			{ x: W * 0.4, y: H * 0.46, angle: 5, side: back, lift: 0.25, layer: 0 },
		];
	}
	if (layout === 'stack') {
		const r = rng(`${seed}:stack`);
		const pile = Array.from({ length: count }, (_, i) => ({ x: -W * 0.42 + r.range(-0.5, 0.5), y: r.range(-0.4, 0.4), angle: -4 + r.range(-0.9, 0.9), side: /** @type {'front'} */ ('front'), lift: 0.1, layer: i }));
		return [...pile, { x: W * 0.62, y: H * 0.5, angle: 9, side: back, lift: 0.2, layer: 0 }];
	}
	if (layout === 'fan') {
		// turned about a point below the cards' bottom left, as a hand fans them
		const px = -W * 0.55;
		const py = H * 0.9;
		const k = Math.max(2, count);
		return Array.from({ length: k }, (_, i) => {
			const a = -26 + (i * 34) / (k - 1);
			const t = (a * Math.PI) / 180;
			const ox = W * 0.5 + 6;
			const oy = -H * 0.5 - 30;
			return { x: px + ox * Math.cos(t) - oy * Math.sin(t), y: py + ox * Math.sin(t) + oy * Math.cos(t), angle: a, side: i === k - 1 || (k - 1 - i) % 2 === 0 ? 'front' : back, lift: 0.15 + 0.08 * i, layer: 0 };
		});
	}
	return [{ x: 0, y: 0, angle: -8, side: 'front', lift: 0.25, layer: 0 }];
}

/**
 * A business card mockup.
 *
 * @param {import('./card.js').CardOptions} options The front (and back) and how to show them.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function card(options) {
	const o = reader('card', options);
	const { art, back } = /** @type {import('./card.js').CardOptions} */ (options);
	const layout = o.oneOf('layout', back ? 'pair' : 'flat', CARD_LAYOUTS);
	const edge = o.color('edge', null);
	const thickness = o.num('thickness', edge ? 1 : 0.45, 0, 3);
	const radius = o.num('radius', 0, 0, 10);
	const bleed = o.num('bleed', 0, 0, 10);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', layout === 'flat' ? 0.62 : 0.8, 0.2, 1);
	const count = Math.round(o.num('count', layout === 'fan' ? 5 : 10, 2, 40));
	const seed = o.text('seed', 'card');
	const stock = resolveStock(/** @type {import('../materials/paper.js').StockName} */ (o.raw('stock') ?? 'matte'), 'card');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'concrete');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));

	const cards = cardPlacements(layout, !!back, count, seed);
	const boxes = cards.map((c) => turnedBox(c.x, c.y - c.layer * thickness, CARD.width, CARD.height, c.angle));
	const box = union(boxes);
	const { mm, at } = fitBox(box, { width, height }, fit);
	const sc = scene({ width, height, key: `card:${layout}:${artKey(art)}:${artKey(back)}:${seed}` });
	const sides = {
		front: trimmed(sc, art, { trim: [CARD.width, CARD.height], bleed }),
		back: back ? trimmed(sc, back, { trim: [CARD.width, CARD.height], bleed }) : null,
	};
	sc.add(surfaceLayer(sc, surf, { light, seed, mm }));
	cards.forEach((c, i) => {
		const [cx, cy] = at(c.x, c.y - c.layer * thickness);
		sc.add(
			sheet(sc, {
				cx,
				cy,
				w: CARD.width * mm,
				h: CARD.height * mm,
				angle: c.angle,
				radius: radius * mm,
				art: sides[c.side] ?? sides.front,
				stock,
				edge,
				mm,
				light,
				thickness: thickness * mm,
				lift: c.lift,
				// in a stack only the bottom card shadows the desk, and only the top one shows its finish
				shadow: c.layer > 0 ? 0 : strength * surf.shadow,
				finish: c.layer === 0 ? layout !== 'stack' || i === count : c.layer === count - 1,
				seed: hash(`${seed}:${i}`) % 997,
			}),
		);
	});
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'card' };
}
