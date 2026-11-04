/**
 * @arraypress/mockups — caps: the model, the views, the finishes, and what
 * the SVG holds.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cap, crownAt, brimAt, CAP, CAP_VIEWS } from '../src/objects/cap.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#fff"/></svg>';

describe('cap', () => {
	it('is a 1600 square by default, three-quarters from the front', () => {
		const m = cap({ art: ART });
		assert.equal(m.object, 'cap');
		assert.deepEqual([m.width, m.height], [1600, 1600]);
		assert.deepEqual(Object.keys(CAP_VIEWS), ['three-quarter', 'front', 'three-quarter-left']);
		assert.notEqual(cap({ art: ART, view: 'front' }).svg, m.svg);
	});

	it('sews the visor to the crown’s base', () => {
		for (const t of [-1, -0.4, 0, 0.6, 1.2]) {
			const a = crownAt(t, Math.PI / 2);
			const b = brimAt(t, 0);
			assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-6);
		}
		assert.ok(Math.abs(crownAt(0, 0)[1] - CAP.crown) < 1e-9, 'the button at the crown’s height');
		assert.ok(brimAt(0, 1)[2] > CAP.depth / 2 + CAP.brim * 0.9, 'the visor reaches forward');
	});

	it('wraps the art round the crown, embroidered (raised) or printed (flat)', () => {
		const emb = cap({ art: ART }).svg;
		assert.match(emb, /<feDisplacementMap[^>]+xChannelSelector="R" yChannelSelector="A"/);
		assert.match(emb, /<feDiffuseLighting/);
		assert.doesNotMatch(cap({ art: ART, finish: 'printed' }).svg, /<feDiffuseLighting/);
	});

	it('takes a visor colour of its own', () => {
		assert.match(cap({ art: ART, color: 'navy', brim: '#d9502e' }).svg, /fill="#d9502e"/);
	});

	it('refuses bad options', () => {
		assert.throws(() => cap(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => cap({ art: ART, view: /** @type {any} */ ('top') }), /view/);
		assert.throws(() => cap({ art: ART, finish: /** @type {any} */ ('woven') }), /finish/);
		assert.throws(() => cap({ art: ART, brim: 'red' }), /brim/);
	});
});
