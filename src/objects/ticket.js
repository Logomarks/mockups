/**
 * @module @logomarks/mockups/objects/ticket
 *
 * Event tickets, 5.5 × 2 in (139.7 × 50.8 mm) with 3 mm round corners:
 * two on a table, one turned (the second's stub torn off along the
 * perforation if asked), or two and a third's stub, already torn off,
 * lying in front of them. Each ticket can be a print of its own (a second
 * night, another seat). A whole ticket shows its line of perforation
 * holes; a torn one shows paper teeth on both pieces.
 */

import { scene } from '../render/scene.js';
import { resolveSurface, surfaceLayer } from '../materials/desk.js';
import { resolveStock } from '../materials/paper.js';
import { grainLayer } from '../materials/grain.js';
import { trimmed } from '../parts/print.js';
import { sheet } from '../parts/sheet.js';
import { tornPieces, perforationLine } from '../parts/perforation.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox, turnedBox, union } from '../util/fit.js';
import { hash } from '../util/rng.js';

/** A ticket's size and corner radius, in mm. */
export const TICKET = Object.freeze({ width: 139.7, height: 50.8, radius: 3 });

/** The layouts. */
export const TICKET_LAYOUTS = /** @type {const} */ (['pair', 'trio']);

/**
 * Where each ticket goes, back to front, in mm. A trio's third is only its stub.
 *
 * @param {import('./ticket.js').TicketLayout} layout The layout.
 * @returns {{ x: number, y: number, angle: number, stub?: boolean }[]} Each ticket's centre and turn, and whether only its stub lies there.
 */
export function ticketPlacements(layout) {
	if (layout === 'trio') {
		return [
			{ x: -10, y: -52, angle: -8 },
			{ x: 8, y: 22, angle: 6 },
			{ x: 52, y: 84, angle: -14, stub: true },
		];
	}
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
	const extra = /** @type {import('../types.js').Art[] | undefined} */ (o.raw('extra')) ?? [];
	if (!Array.isArray(extra)) throw new TypeError('ticket: extra is a list of artworks');
	const arts = [art, ...extra];
	const layout = o.oneOf('layout', 'pair', TICKET_LAYOUTS);
	const torn = o.bool('torn', false);
	const stubAt = o.num('stub', 0.75, 0.3, 0.95);
	const bleed = o.num('bleed', 0, 0, 10);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', 0.84, 0.2, 1);
	const seed = o.text('seed', 'ticket');
	const stock = resolveStock(/** @type {import('../materials/paper.js').StockName} */ (o.raw('stock') ?? 'matte'), 'ticket');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'oak');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));

	const tickets = ticketPlacements(layout);
	const boxes = tickets.map((t) => turnedBox(t.x, t.y, TICKET.width * (t.stub ? 1 - stubAt : 1), TICKET.height, t.angle));
	const box = union(boxes);
	const { mm, at } = fitBox(box, { width, height }, fit);
	const sc = scene({ width, height, key: `ticket:${layout}:${torn}:${arts.map(artKey).join(',')}:${seed}` });
	const faces = arts.map((a) => trimmed(sc, a, { trim: [TICKET.width, TICKET.height], bleed }));
	const w = TICKET.width * mm;
	const h = TICKET.height * mm;
	const r = TICKET.radius * mm;
	const base = { w, h, stock, mm, light, thickness: 0.3 * mm, radius: r };
	sc.add(surfaceLayer(sc, surf, { light, seed, mm }));

	tickets.forEach((t, i) => {
		const [cx, cy] = at(t.x, t.y);
		const common = { ...base, art: faces[i % faces.length], cx, cy, angle: t.angle, shadow: strength * surf.shadow, lift: 0.2 + 0.1 * i, seed: hash(`${seed}:${i}`) % 997 };
		if (t.stub) {
			// the stub alone, centred where it lies: its piece of the ticket is right of the perforation
			const { stub } = tornPieces(w, h, r, stubAt, mm, `${seed}:${i}`);
			const a = (t.angle * Math.PI) / 180;
			const dx = -w * (stubAt + (1 - stubAt) / 2 - 0.5);
			sc.add(sheet(sc, { ...common, d: stub, cx: cx + dx * Math.cos(a), cy: cy + dx * Math.sin(a), lift: 0.15 }));
		} else if (torn && layout === 'pair' && i === tickets.length - 1) {
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
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'ticket' };
}
