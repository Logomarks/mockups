/**
 * @logomarks/mockups — tote bags: the bag, its handles, the print, and
 * what the SVG holds.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tote, TOTE, TOTE_PRINT } from '../src/objects/tote.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#d9502e"/></svg>';

describe('tote', () => {
	it('is a 1600 square by default, on oak', () => {
		const m = tote({ art: ART });
		assert.equal(m.object, 'tote');
		assert.deepEqual([m.width, m.height], [1600, 1600]);
		assert.equal(tote({ art: ART }).svg, m.svg);
	});

	it('lays two webbing handles in loops above the bag, each stitched along both edges', () => {
		const { svg } = tote({ art: ART });
		assert.equal((svg.match(/stroke-width="25"/g) ?? []).length, 2 * 3, 'two straps, each with two shadows');
		assert.equal((svg.match(/stroke-dasharray="2.6 1.17"/g) ?? []).length, 4, 'a row of stitches along each edge of each');
		assert.ok(TOTE.width === 380 && TOTE.height === 420);
	});

	it('centres the print in the print area and keeps its aspect', () => {
		const { svg } = tote({ art: ART, size: 1000 });
		const use = /<use href="#[^"]+-img\d+" transform="translate\([-\d.]+ [-\d.]+\) scale\(([\d.]+) ([\d.]+)\)"/.exec(svg);
		assert.ok(use);
		assert.equal(use[1], use[2]);
		assert.ok(TOTE_PRINT.w < TOTE.width);
	});

	it('takes the canvas colour and an ink', () => {
		const { svg } = tote({ art: ART, color: 'black', ink: '#ffffff' });
		assert.match(svg, /fill="#1d1d1f"/);
		assert.match(svg, /flood-color="#ffffff"/);
	});

	it('refuses bad options', () => {
		assert.throws(() => tote(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => tote({ art: ART, color: /** @type {any} */ ('plaid') }), /color/);
		assert.throws(() => tote({ art: ART, scale: /** @type {any} */ ('big') }), /scale/);
	});
});
