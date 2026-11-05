/**
 * @logomarks/mockups — letterhead: layouts, the envelope, the set, bleed
 * and options.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { letterhead, letterheadPlacements, A4 } from '../src/objects/letterhead.js';
import { envelopeFace, DL } from '../src/parts/envelope.js';
import { scene } from '../src/render/scene.js';

const SHEET = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 303"><rect width="216" height="303" fill="#f4f1ea"/></svg>';
const CARD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91 61"><rect width="91" height="61" fill="#2f6b4f"/></svg>';
const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#2f6b4f"/></svg>';
const sheets = (svg) => (svg.match(/-sheet\d+"><path/g) ?? []).length;

describe('letterhead', () => {
	it('lays the sheet alone, with an envelope, or as a set', () => {
		const flat = letterhead({ art: SHEET });
		assert.equal(flat.object, 'letterhead');
		assert.deepEqual([flat.width, flat.height], [1600, 1600]);
		assert.equal(sheets(flat.svg), 1);
		assert.equal(sheets(letterhead({ art: SHEET, layout: 'envelope' }).svg), 2);
		assert.equal(sheets(letterhead({ art: SHEET, layout: 'set', card: CARD, back: CARD }).svg), 4);
	});

	it('keeps real proportions: A4 and DL', () => {
		assert.deepEqual([A4.width, A4.height], [210, 297]);
		assert.deepEqual([DL.width, DL.height], [220, 110]);
		assert.deepEqual(letterheadPlacements('set').map((p) => p.piece), ['letter', 'envelope', 'back', 'front']);
	});

	it('prints the logo on the envelope, once per artwork', () => {
		const { svg } = letterhead({ art: SHEET, layout: 'envelope', logo: LOGO });
		assert.equal((svg.match(/<image id="[^"]+-img\d+"/g) ?? []).length, 2);
		const sc = scene({ width: 100, height: 100 });
		assert.doesNotMatch(envelopeFace(sc, { w: 220, h: 110, mm: 1 }), /<use/);
		assert.match(envelopeFace(sc, { w: 220, h: 110, mm: 1, logo: sc.image(LOGO) }), /<use/);
	});

	it('is the same for the same options', () => {
		assert.equal(letterhead({ art: SHEET, layout: 'envelope', seed: 'x' }).svg, letterhead({ art: SHEET, layout: 'envelope', seed: 'x' }).svg);
	});

	it('refuses bad options', () => {
		assert.throws(() => letterhead(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => letterhead({ art: SHEET, layout: /** @type {any} */ ('pile') }), /layout/);
		assert.throws(() => letterhead({ art: SHEET, layout: 'set' }), /needs card/);
		assert.throws(() => letterhead({ art: SHEET, envelope: 'white' }), /envelope/);
		assert.throws(() => letterhead({ art: SHEET, stock: /** @type {any} */ ('vellum') }), /stock/);
	});
});
