/**
 * @module @arraypress/mockups/objects/ticket
 *
 * Event tickets, 5.5 × 2 in (139.7 × 50.8 mm) with 3 mm round corners:
 * two on a table, one turned (the second's stub torn off along the
 * perforation if asked), or one held in a hand. A whole ticket shows its
 * line of perforation holes; a torn one shows paper teeth on both pieces.
 */

import { scene } from '../render/scene.js';
import { resolveSurface, surfaceLayer } from '../materials/desk.js';
import { resolveStock } from '../materials/paper.js';
import { resolveSkin } from '../materials/skin.js';
import { grainLayer } from '../materials/grain.js';
import { trimmed } from '../parts/print.js';
import { sheet, flatShadow, outline } from '../parts/sheet.js';
import { hand } from '../parts/hand.js';
import { tornPieces, perforationLine } from '../parts/perforation.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox, turnedBox, union } from '../util/fit.js';
import { hash } from '../util/rng.js';

/** A ticket's size and corner radius, in mm. */
export const TICKET = Object.freeze({ width: 139.7, height: 50.8, radius: 3 });

/** The layouts. */
export const TICKET_LAYOUTS = /** @type {const} */ (['pair', 'held']);

/**
 * Where each ticket goes, back to front, in mm.
 *
 * @param {import('./ticket.js').TicketLayout} layout The layout.
 * @returns {{ x: number, y: number, angle: number }[]} Each ticket's centre and turn.
 */
export function ticketPlacements(layout) {
	if (layout === 'held') return [{ x: 0, y: 0, angle: -6 }];
	return [
		{ x: -16, y: -26, angle: -8 },
		{ x: 14, y: 27, angle: 5 },
	];
}

/**
 * A ticket mockup.
 *
 * @param {import('./ticket.js').TicketOptions} options The ticket and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function ticket(options) {
	const o = reader('ticket', options);
	const { art } = /** @type {import('./ticket.js').TicketOptions} */ (options);
	const layout = o.oneOf('layout', 'pair', TICKET_LAYOUTS);
	const torn = o.bool('torn', false);
	const stubAt = o.num('stub', 0.75, 0.3, 0.95);
	const bleed = o.num('bleed', 0, 0, 10);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', layout === 'held' ? 0.8 : 0.84, 0.2, 1);
	const seed = o.text('seed', 'ticket');
	const side = o.oneOf('hand', 'right', /** @type {const} */ (['right', 'left']));
	const skin = resolveSkin(/** @type {import('../materials/skin.js').SkinOption} */ (o.raw('skin') ?? 'medium'), 'ticket');
	const stock = resolveStock(/** @type {import('../materials/paper.js').StockName} */ (o.raw('stock') ?? 'matte'), 'ticket');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), layout === 'held' ? 'paper' : 'oak');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));

	const tickets = ticketPlacements(layout);
	const boxes = tickets.map((t) => turnedBox(t.x, t.y, TICKET.width, TICKET.height, t.angle));
	if (layout === 'held') boxes.push({ x0: -TICKET.width * 0.3, y0: 0, x1: TICKET.width * 0.3, y1: TICKET.height * 1.5 });
	const box = union(boxes);
	const { mm, at } = fitBox(box, { width, height }, fit);
	const sc = scene({ width, height, key: `ticket:${layout}:${torn}:${artKey(art)}:${seed}` });
	const face = trimmed(sc, art, { trim: [TICKET.width, TICKET.height], bleed });
	const w = TICKET.width * mm;
	const h = TICKET.height * mm;
	const r = TICKET.radius * mm;
	const base = { w, h, art: face, stock, mm, light, thickness: 0.3 * mm, radius: r };
	sc.add(surfaceLayer(sc, surf, { light, seed, mm }));

	if (layout === 'held') {
		const t = tickets[0];
		const [cx, cy] = at(t.x, t.y);
		const a = (t.angle * Math.PI) / 180;
		// the grip: under the ticket's main part, short of the stub
		const gx = (side === 'left' ? -0.37 : 0.12) * w;
		const gy = h / 2;
		const held = hand(sc, { x: cx + gx * Math.cos(a) - gy * Math.sin(a), y: cy + gx * Math.sin(a) + gy * Math.cos(a), angle: t.angle, mm, side, skin, light, shadow: strength * surf.shadow });
		sc.add(
			held.shadow,
			flatShadow(sc, { d: outline(w, h, r), cx, cy, angle: t.angle, mm, light, lift: 2.6, strength: strength * surf.shadow }),
			held.under,
			sheet(sc, { ...base, cx, cy, angle: t.angle, overlay: perforationLine(w, h, stubAt, mm), shadow: 0, seed: hash(seed) % 997 }),
			held.over,
		);
	} else {
		tickets.forEach((t, i) => {
			const [cx, cy] = at(t.x, t.y);
			const common = { ...base, cx, cy, angle: t.angle, shadow: strength * surf.shadow, lift: 0.2 + 0.1 * i, seed: hash(`${seed}:${i}`) % 997 };
			if (torn && i === tickets.length - 1) {
				const { main, stub } = tornPieces(w, h, r, stubAt, mm, `${seed}:${i}`);
				const a = (t.angle * Math.PI) / 180;
				// the stub lies a little apart, turned a touch further, as it fell when torn off
				const dx = 7 * mm;
				const dy = 3 * mm;
				sc.add(
					sheet(sc, { ...common, d: stub, cx: cx + dx * Math.cos(a) - dy * Math.sin(a), cy: cy + dx * Math.sin(a) + dy * Math.cos(a), angle: t.angle + 4 }),
					sheet(sc, { ...common, d: main }),
				);
			} else {
				sc.add(sheet(sc, { ...common, overlay: perforationLine(w, h, stubAt, mm) }));
			}
		});
	}
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'ticket' };
}
