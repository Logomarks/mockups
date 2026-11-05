/**
 * @logomarks/mockups — the cloth materials: garment colours, an artwork's
 * aspect, outlines and folds, and the 3D helpers the cap is drawn with.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveGarment, GARMENT_COLORS } from '../src/materials/fabric.js';
import { cloth, signedDistance, warpMap } from '../src/materials/folds.js';
import { smooth } from '../src/parts/garment.js';
import { artAspect, fitInside } from '../src/parts/artsize.js';
import { ortho, hull, splat, warpOf } from '../src/parts/solid.js';
import { encodePng } from '../src/render/png.js';

describe('garment colours', () => {
	it('takes a name or a hex colour, and knows which read dark', () => {
		assert.equal(resolveGarment(undefined, 'white', 'tee').color, GARMENT_COLORS.white);
		assert.equal(resolveGarment('navy', 'white', 'tee').dark, true);
		assert.equal(resolveGarment('#ffcc00', 'white', 'tee').dark, false);
		assert.throws(() => resolveGarment('teal', 'white', 'tee'), /tee: color/);
	});
});

describe('artAspect', () => {
	it('reads PNG, SVG markup and data: URIs without decoding the image', () => {
		const png = encodePng(30, 10, new Uint8Array(30 * 10 * 2));
		assert.equal(artAspect(png), 3);
		assert.equal(artAspect('<svg viewBox="0 0 512 256"/>'), 2);
		assert.equal(artAspect('<svg width="100" height="400"/>'), 0.25);
		assert.equal(artAspect(`data:image/png;base64,${Buffer.from(png).toString('base64')}`), 3);
		assert.equal(artAspect('https://example.com/a.png', 1.5), 1.5);
	});

	it('fits a box of an aspect inside an area', () => {
		assert.deepEqual(fitInside(2, { x: 0, y: 0, w: 100, h: 100 }), { x: 0, y: 0, w: 100, h: 50 });
		assert.deepEqual(fitInside(0.5, { x: 0, y: 0, w: 100, h: 100 }, 'middle'), { x: 25, y: 0, w: 50, h: 100 });
	});
});

describe('outlines and folds', () => {
	it('draws a smooth outline through its points, keeping corners', () => {
		const { d, poly } = smooth([[0, 0, true], [10, 0, true], [10, 10, true], [0, 10, true]]);
		assert.match(d, /^M0 0C/);
		assert.equal(poly.length, 32);
		assert.ok(signedDistance(poly, 5, 5) > 4.9);
		assert.ok(signedDistance(poly, 15, 5) < -4.9);
	});

	it('raises cloth inside its outline and folds it, with a warp that is flat where the cloth is', () => {
		const sq = smooth([[0, 0, true], [100, 0, true], [100, 100, true], [0, 100, true]]).poly;
		const c = cloth(sq, { x0: -10, y0: -10, x1: 110, y1: 110 }, { seed: 's', rumple: 0 });
		const mid = c.field.v[Math.floor(c.field.h / 2) * c.field.w + Math.floor(c.field.w / 2)];
		assert.ok(mid > 0.9);
		assert.equal(c.field.v[0], 0);
		c.fold([20, 50], [80, 50], 6, 1);
		assert.ok(c.field.v[Math.floor(c.field.h / 2) * c.field.w + Math.floor(c.field.w / 2)] > mid + 0.5);
		assert.match(warpMap(c).href, /^data:image\/png;base64,/);
	});
});

describe('solids', () => {
	it('looks straight on with no turn or tilt', () => {
		const cam = ortho(0, 0);
		assert.deepEqual(cam.point([1, 2, 3]), [1, -2, 3]);
		const side = ortho(90, 0).point([0, 0, 1]);
		assert.ok(Math.abs(side[0] - 1) < 1e-9, 'turned 90°, the front faces right');
	});

	it('hulls points, and wraps art by where each sample landed', () => {
		assert.equal(hull([[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5]]).length, 4);
		const s = splat({ x: 0, y: 0, w: 10, h: 10 }, 1);
		for (let y = 0; y < 10; y += 0.25) for (let x = 0; x < 10; x += 0.25) s.put(x, y, 0, x / 10, y / 10);
		const w = warpOf(s, { x: 0, y: 0, w: 10, h: 10 });
		assert.ok(w.scale < 0.1, 'art drawn where the surface is needs no displacement');
	});
});
