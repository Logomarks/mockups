/**
 * @logomarks/mockups — business cards: layouts, sides, bleed, edges, and
 * what the SVG holds.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { card, cardPlacements, CARD, CARD_LAYOUTS } from '../src/objects/card.js';

const FRONT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91 61"><rect width="91" height="61" fill="#2f6b4f"/></svg>';
const BACK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91 61"><rect width="91" height="61" fill="#f4f1ea"/></svg>';
const count = (s, re) => (s.match(re) ?? []).length;

describe('card', () => {
	it('is a 1600 square by default, the size asked for otherwise', () => {
		const m = card({ art: FRONT });
		assert.equal(m.object, 'card');
		assert.deepEqual([m.width, m.height], [1600, 1600]);
		const w = card({ art: FRONT, size: { width: 1200, height: 800 } });
		assert.deepEqual([w.width, w.height], [1200, 800]);
	});

	it('shows one card alone, a pair with a back, and is the same for the same options', () => {
		assert.equal(count(card({ art: FRONT }).svg, /-sheet\d+"><path/g), 1);
		assert.equal(count(card({ art: FRONT, back: BACK }).svg, /-sheet\d+"><path/g), 2);
		assert.equal(card({ art: FRONT, back: BACK, layout: 'fan' }).svg, card({ art: FRONT, back: BACK, layout: 'fan' }).svg);
	});

	it('embeds each side once', () => {
		const { svg } = card({ art: FRONT, back: BACK, layout: 'fan', count: 6 });
		assert.equal(count(svg, /<image id="[^"]+-img\d+"/g), 2);
	});

	it('stacks cards with a back beside them, and fans them', () => {
		assert.equal(cardPlacements('stack', true, 8, 's').length, 9);
		const fan = cardPlacements('fan', true, 5, 's');
		assert.equal(fan.length, 5);
		assert.equal(fan[4].side, 'front');
		assert.ok(fan[0].angle < fan[4].angle);
	});

	it('trims the bleed off the art', () => {
		const { svg } = card({ art: FRONT, bleed: 3, size: 1000 });
		// the art's box is wider than the card by the bleed on each side: 91 of 85
		const use = /<use href="#[^"]+-img\d+" transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+) ([\d.]+)\)"/.exec(svg);
		assert.ok(use);
		const artW = Number(use[3]) * 1000 * (91 / 61);
		assert.ok(Math.abs(Number(use[1]) + artW / 2) < 1, 'centred on the card');
		assert.ok(CARD.width === 85 && CARD.height === 55);
	});

	it('has no hand: the layout is gone', () => {
		assert.deepEqual([...CARD_LAYOUTS], ['flat', 'pair', 'stack', 'fan']);
		assert.throws(() => card({ art: FRONT, layout: /** @type {any} */ ('hand') }), /card: layout is 'flat', 'pair', 'stack' or 'fan'/);
	});

	it('paints the edge', () => {
		assert.match(card({ art: FRONT, edge: '#e8604c' }).svg, /fill="#e8604c"/);
	});

	it('refuses bad options', () => {
		assert.throws(() => card(/** @type {any} */ (undefined)), TypeError);
		assert.throws(() => card(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => card({ art: FRONT, layout: /** @type {any} */ ('pile') }), /layout/);
		assert.throws(() => card({ art: FRONT, edge: 'red' }), /edge/);
		assert.throws(() => card({ art: FRONT, surface: /** @type {any} */ ('marble') }), /surface/);
		assert.throws(() => card({ art: FRONT, stock: /** @type {any} */ ('vellum') }), /stock/);
		assert.throws(() => card({ art: FRONT, light: /** @type {any} */ ('left') }), /light/);
	});
});
