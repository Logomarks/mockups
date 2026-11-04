/**
 * @module @arraypress/mockups/objects/letterhead
 *
 * Letterhead, A4 (210 × 297 mm), seen from above on a desk: the sheet
 * alone, with a DL envelope (220 × 110 mm, its folded layers showing
 * through faintly, a logo top-left), or the whole set: letter, envelope
 * and business cards, front and back. Laid out in millimetres and fitted
 * to the frame.
 */

import { scene } from '../render/scene.js';
import { resolveSurface, surfaceLayer } from '../materials/desk.js';
import { resolveStock } from '../materials/paper.js';
import { grainLayer } from '../materials/grain.js';
import { trimmed } from '../parts/print.js';
import { sheet } from '../parts/sheet.js';
import { envelopeFace, DL } from '../parts/envelope.js';
import { CARD } from './card.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox, turnedBox, union } from '../util/fit.js';
import { hash } from '../util/rng.js';

/** A4, in mm. */
export const A4 = Object.freeze({ width: 210, height: 297 });

/** The layouts. */
export const LETTERHEAD_LAYOUTS = /** @type {const} */ (['flat', 'envelope', 'set']);

/**
 * Where each piece goes, back to front, in mm.
 *
 * @param {import('./letterhead.js').LetterheadLayout} layout The layout.
 * @returns {import('./letterhead.js').LetterheadPlacement[]} The pieces: what each is, its centre and turn.
 */
export function letterheadPlacements(layout) {
	if (layout === 'envelope') {
		return [
			{ piece: 'letter', x: -38, y: -12, angle: -4 },
			{ piece: 'envelope', x: 62, y: 118, angle: 6 },
		];
	}
	if (layout === 'set') {
		return [
			{ piece: 'letter', x: -62, y: -8, angle: -3 },
			{ piece: 'envelope', x: 44, y: 128, angle: 5 },
			{ piece: 'back', x: 116, y: -18, angle: -7 },
			{ piece: 'front', x: 104, y: -96, angle: 9 },
		];
	}
	return [{ piece: 'letter', x: 0, y: 0, angle: -3 }];
}

/** Each piece's size in mm. */
const SIZES = Object.freeze({ letter: A4, envelope: DL, front: CARD, back: CARD });

/**
 * A letterhead mockup.
 *
 * @param {import('./letterhead.js').LetterheadOptions} options The letterhead and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function letterhead(options) {
	const o = reader('letterhead', options);
	const { art, logo, card: front, back } = /** @type {import('./letterhead.js').LetterheadOptions} */ (options);
	const layout = o.oneOf('layout', 'flat', LETTERHEAD_LAYOUTS);
	if (layout === 'set' && !front) throw new TypeError("letterhead: the 'set' layout needs card (the business card's front)");
	const bleed = o.num('bleed', 0, 0, 10);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', layout === 'flat' ? 0.78 : 0.88, 0.2, 1);
	const seed = o.text('seed', 'letterhead');
	const stock = resolveStock(/** @type {import('../materials/paper.js').StockName} */ (o.raw('stock') ?? 'uncoated'), 'letterhead');
	const envelopeColor = o.color('envelope', stock.color);
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'oak');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));

	const pieces = letterheadPlacements(layout);
	const box = union(pieces.map((p) => turnedBox(p.x, p.y, SIZES[p.piece].width, SIZES[p.piece].height, p.angle)));
	const { mm, at } = fitBox(box, { width, height }, fit);
	const sc = scene({ width, height, key: `letterhead:${layout}:${artKey(art)}:${artKey(front)}:${artKey(logo)}:${seed}` });
	const arts = {
		letter: trimmed(sc, art, { trim: [A4.width, A4.height], bleed }),
		front: front ? trimmed(sc, front, { trim: [CARD.width, CARD.height], bleed }) : null,
		back: back ? trimmed(sc, back, { trim: [CARD.width, CARD.height], bleed }) : null,
	};
	const mark = logo ? sc.image(logo, 1) : null;
	sc.add(surfaceLayer(sc, surf, { light, seed, mm }));
	pieces.forEach((p, i) => {
		const size = SIZES[p.piece];
		const [cx, cy] = at(p.x, p.y);
		const w = size.width * mm;
		const h = size.height * mm;
		const isCard = p.piece === 'front' || p.piece === 'back';
		sc.add(
			sheet(sc, {
				cx,
				cy,
				w,
				h,
				angle: p.angle,
				art: p.piece === 'envelope' ? null : p.piece === 'letter' ? arts.letter : (arts[p.piece] ?? arts.front),
				overlay: p.piece === 'envelope' ? envelopeFace(sc, { w, h, mm, logo: mark }) : undefined,
				color: p.piece === 'envelope' ? envelopeColor : undefined,
				stock: isCard ? resolveStock('matte') : stock,
				mm,
				light,
				thickness: (isCard ? 0.45 : p.piece === 'envelope' ? 0.7 : 0.12) * mm,
				lift: isCard ? 0.25 : p.piece === 'envelope' ? 0.4 : 0.3,
				shadow: strength * surf.shadow,
				seed: hash(`${seed}:${i}`) % 997,
			}),
		);
	});
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'letterhead' };
}
