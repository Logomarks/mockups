/**
 * @logomarks/mockups — T-shirts: placements, colours, ink, the print kept
 * at its own aspect, and what the SVG holds.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tee, teeOutline, TEE, TEE_PLACEMENTS } from '../src/objects/tee.js';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><rect width="20" height="10" fill="#2f6b4f"/></svg>';

describe('tee', () => {
	it('is a 1600 square by default, the size asked for otherwise', () => {
		const m = tee({ art: MARK });
		assert.equal(m.object, 'tee');
		assert.deepEqual([m.width, m.height], [1600, 1600]);
		const w = tee({ art: MARK, size: { width: 1200, height: 900 } });
		assert.deepEqual([w.width, w.height], [1200, 900]);
	});

	it('is the same for the same options, and the seed changes the folds', () => {
		assert.equal(tee({ art: MARK }).svg, tee({ art: MARK }).svg);
		assert.notEqual(tee({ art: MARK, seed: 'a' }).svg, tee({ art: MARK, seed: 'b' }).svg);
	});

	it('warps the print by the folds and lays the shade over it', () => {
		const { svg } = tee({ art: MARK });
		assert.match(svg, /<feDisplacementMap[^>]+xChannelSelector="R" yChannelSelector="A"/);
		assert.ok((svg.match(/data:image\/png;base64/g) ?? []).length >= 2, 'a warp map and a shade map');
	});

	it('soaks ink into a light shirt and lays it on a dark one', () => {
		assert.match(tee({ art: MARK }).svg, /mix-blend-mode:multiply/);
		const dark = tee({ art: MARK, color: 'black' }).svg;
		assert.doesNotMatch(dark, /mix-blend-mode:multiply/);
		assert.match(dark, /type="saturate"/);
		assert.match(dark, /fill="#1d1d1f"/);
	});

	it('recolours a one-colour mark with ink', () => {
		assert.match(tee({ art: MARK, ink: '#ffffff' }).svg, /<feFlood flood-color="#ffffff"/);
	});

	it('keeps the art at its own aspect inside the placement', () => {
		const { svg } = tee({ art: MARK, size: 1000 });
		const use = /<use href="#[^"]+-img\d+" transform="translate\([-\d.]+ [-\d.]+\) scale\(([\d.]+) ([\d.]+)\)"/.exec(svg);
		assert.ok(use);
		// the art is defined at its own aspect (2:1), so it's scaled the same both ways
		assert.equal(use[1], use[2]);
		assert.ok(TEE_PLACEMENTS.center.w <= 305, 'a full front print is at most 12 inches wide');
	});

	it('shows the back for a back print, with no neck opening', () => {
		const front = tee({ art: MARK }).svg;
		const back = tee({ art: MARK, placement: 'back' }).svg;
		assert.match(front, /M-86 6Q0 40 86 6/);
		assert.doesNotMatch(back, /M-86 6Q0 40 86 6/);
	});

	it('is a men’s L laid flat', () => {
		assert.equal(TEE.chest, 565);
		const { poly } = teeOutline();
		const xs = poly.map((p) => p[0]);
		assert.ok(Math.max(...xs) > TEE.chest / 2 + 100, 'the sleeves reach past the body');
		assert.ok(Math.abs(Math.max(...xs) + Math.min(...xs)) < 1, 'symmetric when laid neatly');
	});

	it('refuses bad options', () => {
		assert.throws(() => tee(/** @type {any} */ (null)), TypeError);
		assert.throws(() => tee(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => tee({ art: MARK, placement: /** @type {any} */ ('sleeve') }), /placement/);
		assert.throws(() => tee({ art: MARK, color: /** @type {any} */ ('mauve') }), /color/);
		assert.throws(() => tee({ art: MARK, ink: 'white' }), /ink/);
		assert.throws(() => tee({ art: MARK, surface: /** @type {any} */ ('grass') }), /surface/);
	});
});
