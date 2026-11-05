/**
 * @arraypress/mockups — the surfaces things lie on: slate, a cutting mat and a knit, beside the first four, and the shelter's skyline kept in view.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { card, vinyl, shelter, SURFACES } from '../src/index.js';
import { resolveSurface } from '../src/materials/desk.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 55"><rect width="85" height="55" fill="#f3eee4"/></svg>';

describe('surfaces', () => {
	it('has slate, a cutting mat and a knit', () => {
		for (const t of ['concrete', 'oak', 'linen', 'paper', 'slate', 'cutting-mat', 'knit']) assert.ok(Object.hasOwn(SURFACES, t), t);
		assert.ok(resolveSurface('slate').dark, 'slate reads dark: shadows drawn deeper');
		assert.equal(resolveSurface({ texture: 'cutting-mat', color: '#20304a' }).color, '#20304a');
	});

	it('numbers the cutting mat in centimetres and grids it', () => {
		const { svg } = card({ art: ART, surface: 'cutting-mat', size: 800 });
		assert.match(svg, />1<\/text>/);
		assert.match(svg, />5<\/text>/);
		assert.ok((svg.match(/-grid\d+"/g) ?? []).length >= 2, 'a fine grid and a bold one');
	});

	it('draws the same for the same seed', () => {
		for (const surface of /** @type {const} */ (['slate', 'knit'])) assert.equal(card({ art: ART, surface, size: 400 }).svg, card({ art: ART, surface, size: 400 }).svg);
	});

	it('lays vinyl on a surface, and names the ground in errors', () => {
		const { svg } = vinyl({ art: ART, ground: 'oak', size: 400 });
		assert.ok(svg.length > vinyl({ art: ART, size: 400 }).svg.length);
		assert.throws(() => vinyl({ art: ART, ground: /** @type {any} */ ('beige') }), /ground/);
		assert.throws(() => card({ art: ART, surface: /** @type {any} */ ('marble') }), /surface: 'concrete'/);
	});

	it('draws only the skyline the camera sees (nothing projected far off the frame)', () => {
		const { svg, width } = shelter({ art: ART, size: 800 });
		const far = [...svg.matchAll(/M(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].some(([, x]) => Math.abs(Number(x)) > width * 50);
		assert.ok(!far, 'no point a skyline block projects behind the camera');
	});
});
