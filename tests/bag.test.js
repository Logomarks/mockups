/**
 * @logomarks/mockups — paper bags: papers, the print on the front, and
 * bad options.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bag, BAG_PAPERS } from '../src/objects/bag.js';
import { axo } from '../src/parts/axo.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#d9502e"/></svg>';

describe('bag', () => {
	it('is a 1600 square by default, and the same for the same options', () => {
		const m = bag({ art: ART });
		assert.equal(m.object, 'bag');
		assert.deepEqual([m.width, m.height], [1600, 1600]);
		assert.equal(bag({ art: ART, paper: 'white' }).svg, bag({ art: ART, paper: 'white' }).svg);
	});

	it('is kraft by default, and takes white, black or any colour', () => {
		assert.match(bag({ art: ART }).svg, new RegExp(`fill="${BAG_PAPERS.kraft}"`));
		assert.match(bag({ art: ART, paper: 'black' }).svg, new RegExp(`fill="${BAG_PAPERS.black}"`));
		assert.match(bag({ art: ART, paper: '#336699' }).svg, /fill="#336699"/);
	});

	it('maps the print onto the front face with one matrix, and embeds it once', () => {
		const { svg } = bag({ art: ART });
		assert.equal((svg.match(/<image id="[^"]+-img\d+"/g) ?? []).length, 1);
		assert.match(svg, /<g transform="matrix\([^)]+\)" clip-path="url\(#[^)]+-front\d+\)"><use href="#[^"]+-img\d+"/);
	});

	it('projects axonometrically: the back recedes up and to the right', () => {
		const v = axo({ turn: 30, elevation: 12 });
		const [x, y] = v.at(0, 0, -100);
		assert.ok(x > 0 && y < 0);
		assert.ok(v.facing([0, 0, 1]) > v.facing([1, 0, 0]));
	});

	it('refuses bad options', () => {
		assert.throws(() => bag(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => bag({ art: ART, paper: /** @type {any} */ ('glossy') }), /paper/);
		assert.throws(() => bag({ art: ART, rope: 'red' }), /rope/);
	});
});
