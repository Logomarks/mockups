/**
 * @logomarks/mockups — shopfront: the fascia, the blade sign, inking, options, and that it draws.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shopfront, mockup } from '../src/index.js';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="4"/></svg>';

describe('shopfront', () => {
	it('returns the size asked for, the same for the same options', () => {
		const m = shopfront({ art: MARK, name: 'Hollow Fern', size: 600 });
		assert.equal(m.object, 'shopfront');
		assert.equal(mockup('shopfront', { art: MARK, name: 'Hollow Fern', size: 600 }).svg, m.svg);
	});

	it('letters the name on the fascia, raised (a shadow under it)', () => {
		const { svg } = shopfront({ art: MARK, name: 'Hollow Fern', ink: '#fafafa' });
		assert.equal((svg.match(/>Hollow Fern</g) ?? []).length, 2);
		assert.match(svg, /fill="#fafafa"[^>]*>Hollow Fern</);
	});

	it('inks a currentColor mark for the fascia and in white for the door', () => {
		const { svg } = shopfront({ art: MARK, name: 'X', ink: '#ff0000' });
		const marks = [...svg.matchAll(/data:image\/svg\+xml;base64,([^"]+)/g)].map((m) => Buffer.from(m[1], 'base64').toString());
		assert.ok(marks.some((s) => s.includes('#ff0000')));
		assert.ok(marks.some((s) => s.includes('#ffffff')));
	});

	it('hangs a blade sign unless asked not to', () => {
		const withBlade = shopfront({ art: MARK, name: 'X' }).svg;
		const without = shopfront({ art: MARK, name: 'X', blade: false }).svg;
		assert.ok(withBlade.length > without.length);
	});

	it('refuses bad options', () => {
		assert.throws(() => shopfront(/** @type {any} */ ({ name: 'X' })), /art/);
		assert.throws(() => shopfront(/** @type {any} */ ({ art: MARK })), /name/);
		assert.throws(() => shopfront({ art: MARK, name: 'X', color: 'green' }), /color/);
		assert.throws(() => shopfront({ art: MARK, name: 'X', view: /** @type {any} */ ('above') }), /view/);
	});

	it('rasterises', async (t) => {
		const sharp = await import('sharp').then((m) => m.default, () => null);
		if (!sharp) return t.skip('sharp is not installed');
		const { renderImage } = await import('../src/render/node.js');
		const png = await renderImage(shopfront({ art: MARK, name: 'X', view: 'angle', size: 300 }));
		assert.equal((await sharp(png).metadata()).width, 300);
	});
});
