/**
 * @arraypress/mockups — tickets: the pair, the torn stub, the hand, and
 * options.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ticket, ticketPlacements, TICKET } from '../src/objects/ticket.js';
import { tornPieces, tornEdge } from '../src/parts/perforation.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 146 57"><rect width="146" height="57" fill="#d9502e"/></svg>';
const sheets = (svg) => (svg.match(/-sheet\d+"><path/g) ?? []).length;

describe('ticket', () => {
	it('is 5.5 × 2 in with 3 mm corners', () => {
		assert.deepEqual([TICKET.width, TICKET.height, TICKET.radius], [139.7, 50.8, 3]);
	});

	it('lays two tickets, the second torn in two when asked', () => {
		const m = ticket({ art: ART });
		assert.equal(m.object, 'ticket');
		assert.equal(sheets(m.svg), 2);
		assert.equal(sheets(ticket({ art: ART, torn: true }).svg), 3);
		assert.equal(ticketPlacements('pair').length, 2);
	});

	it('holds one in a hand', () => {
		const { svg } = ticket({ art: ART, layout: 'held', skin: 'tan' });
		assert.equal(sheets(svg), 1);
		assert.match(svg, /-nailsheen\d+/);
		assert.match(svg, /fill="#a8724c"/);
	});

	it('tears both pieces along the same edge', () => {
		const { main, stub } = tornPieces(140, 50, 3, 0.75, 1, 's');
		const edge = tornEdge(140 * 0.75 - 70, 50, 1, 's');
		assert.ok(edge.length > 20);
		assert.ok(main.includes(`L${edge[3][0]} ${edge[3][1]}`) || main.includes(String(Math.round(edge[3][0] * 1000) / 1000)));
		assert.match(stub, /a3 3 0 0 1/);
	});

	it('refuses bad options', () => {
		assert.throws(() => ticket(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => ticket({ art: ART, layout: /** @type {any} */ ('fan') }), /layout/);
		assert.throws(() => ticket({ art: ART, torn: /** @type {any} */ ('yes') }), /torn/);
		assert.throws(() => ticket({ art: ART, stub: /** @type {any} */ ('half') }), /stub/);
	});
});
