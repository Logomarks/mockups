/**
 * @arraypress/mockups — stickers: cuts, layouts, the peeled corner, and
 * bad options.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sticker } from '../src/objects/sticker.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#3b5bdb"/></svg>';
const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M5 1 9 9H1z" fill="#d9502e"/></svg>';
const count = (s, re) => (s.match(re) ?? []).length;

describe('sticker', () => {
	it('is a 1600 square by default, on a laptop', () => {
		const m = sticker({ art: ART });
		assert.equal(m.object, 'sticker');
		assert.deepEqual([m.width, m.height], [1600, 1600]);
		assert.equal(count(m.svg, /<path id="[^"]+-sil\d+"/g), 1);
	});

	it('cuts round the art’s own outline with a grown, smoothed alpha', () => {
		const { svg } = sticker({ art: MARK, shape: 'contour' });
		assert.match(svg, /<feGaussianBlur in="SourceAlpha"/);
		assert.match(svg, /<feFuncA type="linear" slope="60"/);
		assert.match(svg, /<g id="[^"]+-sil\d+"><g filter=/);
	});

	it('puts several stickers on a sheet, one peeled back', () => {
		const { svg } = sticker({ art: ART, extra: [MARK], layout: 'sheet' });
		assert.equal(count(svg, /-sil\d+"/g) >= 6, true);
		assert.equal(count(svg, /<clipPath id="[^"]+-flap\d+"/g), 1);
	});

	it('wraps a sticker round a bottle with displacement maps', () => {
		const { svg } = sticker({ art: MARK, shape: 'contour', layout: 'bottle' });
		assert.equal(count(svg, /<feDisplacementMap/g), 1);
		assert.match(svg, /-bottle\d+"/);
	});

	it('is the same for the same options', () => {
		assert.equal(sticker({ art: ART, layout: 'sheet' }).svg, sticker({ art: ART, layout: 'sheet' }).svg);
	});

	it('refuses bad options', () => {
		assert.throws(() => sticker(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => sticker({ art: ART, layout: /** @type {any} */ ('car') }), /layout/);
		assert.throws(() => sticker({ art: ART, shape: /** @type {any} */ ('star') }), /shape/);
		assert.throws(() => sticker({ art: ART, lid: /** @type {any} */ ('gold') }), /lid/);
		assert.throws(() => sticker({ art: ART, extra: /** @type {any} */ ('x') }), /extra/);
	});
});
