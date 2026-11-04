/**
 * @arraypress/mockups — mugs: layouts, prints, the wrap round the curve,
 * and bad options.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mug } from '../src/objects/mug.js';
import { MUG } from '../src/parts/mug.js';
import { wrap } from '../src/parts/cylinder.js';
import { scene } from '../src/render/scene.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#d9502e"/></svg>';
const BACK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#2f6b4f"/></svg>';
const count = (s, re) => (s.match(re) ?? []).length;

describe('mug', () => {
	it('is a 1600 square by default, and the same for the same options', () => {
		const m = mug({ art: ART });
		assert.equal(m.object, 'mug');
		assert.deepEqual([m.width, m.height], [1600, 1600]);
		assert.equal(mug({ art: ART, layout: 'pair' }).svg, mug({ art: ART, layout: 'pair' }).svg);
	});

	it('draws one mug or two, each with a handle and an opening', () => {
		assert.equal(count(mug({ art: ART }).svg, /-mugbody\d+"/g), 1);
		assert.equal(count(mug({ art: ART, layout: 'pair', back: BACK }).svg, /-mugbody\d+"/g), 2);
		assert.equal(count(mug({ art: ART, layout: 'pair' }).svg, /-hclip\d+"/g), 2);
	});

	it('embeds each print once, however many strips show it', () => {
		const { svg } = mug({ art: ART, back: BACK, layout: 'pair' });
		assert.equal(count(svg, /<image id="[^"]+-img\d+"/g), 2);
		assert.ok(count(svg, /-strip\d+"/g) >= 2 * 72);
	});

	it('wraps a print round the curve: strips squeezed towards the edges, bent by the ellipse', () => {
		const sc = scene({ width: 400, height: 400 });
		const out = wrap(sc, { cx: 200, top: 100, r: 100, ry: 20, content: 'c', height: 100, strips: 8 });
		const m = [...out.matchAll(/matrix\(([^)]+)\)/g)].map((x) => x[1].split(' ').map(Number));
		assert.equal(m.length, 8);
		assert.ok(m[0][0] < m[3][0], 'squeezed at the edge');
		assert.ok(m[3][0] > 0.95 && m[3][0] <= 1.0001, 'close to flat at the front');
		assert.ok(Math.sign(m[0][1]) !== Math.sign(m[7][1]), 'the sag slopes down towards the front from both sides');
	});

	it('sizes an 11 oz mug', () => {
		assert.deepEqual([MUG.diameter, MUG.height], [82, 95]);
	});

	it('refuses bad options', () => {
		assert.throws(() => mug(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => mug({ art: ART, layout: /** @type {any} */ ('trio') }), /layout/);
		assert.throws(() => mug({ art: ART, print: /** @type {any} */ ('all') }), /print/);
		assert.throws(() => mug({ art: ART, color: 'white' }), /color/);
		assert.throws(() => mug({ art: ART, handle: /** @type {any} */ ('up') }), /handle/);
	});
});
