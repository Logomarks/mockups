/**
 * @arraypress/mockups — hoodies: placements, the hood and drawcords, and
 * what the SVG holds.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hoodie, hoodieOutline, HOODIE, HOODIE_PLACEMENTS } from '../src/objects/hoodie.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#3b5bdb"/></svg>';
const aglets = (svg) => (svg.match(/<rect x="-4.5" y="-2" width="9" height="30" rx="2.5" fill="#a7a9ac"\/>/g) ?? []).length;

describe('hoodie', () => {
	it('is a 1600 square by default, heather grey fleece', () => {
		const m = hoodie({ art: ART });
		assert.equal(m.object, 'hoodie');
		assert.deepEqual([m.width, m.height], [1600, 1600]);
		assert.match(m.svg, /fill="#a9a8a5"/);
	});

	it('hangs two drawcords with aglets at the front, none at the back', () => {
		assert.equal(aglets(hoodie({ art: ART }).svg), 2);
		assert.equal(aglets(hoodie({ art: ART, placement: 'back' }).svg), 0);
	});

	it('has a pocket at the front only', () => {
		const pocket = /M-122 430H122/;
		assert.match(hoodie({ art: ART }).svg, pocket);
		assert.doesNotMatch(hoodie({ art: ART, placement: 'back' }).svg, pocket);
	});

	it('puts the chest print above the pocket', () => {
		const p = HOODIE_PLACEMENTS.chest;
		assert.ok(p.y + p.h < 430);
	});

	it('lays the hood back above the shoulders and the sleeves down to the cuffs', () => {
		const { poly, cuff } = hoodieOutline();
		const ys = poly.map((p) => p[1]);
		assert.ok(Math.min(...ys) <= -HOODIE.hood + 1);
		assert.ok(cuff.outer[1] > 500, 'long sleeves');
	});

	it('refuses bad options', () => {
		assert.throws(() => hoodie(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => hoodie({ art: ART, placement: /** @type {any} */ ('center') }), /placement/);
		assert.throws(() => hoodie({ art: ART, cord: 'red' }), /cord/);
	});
});
