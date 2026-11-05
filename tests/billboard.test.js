/**
 * @logomarks/mockups — billboard: settings, times, views, options, and that it draws.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { billboard, mockup, BILLBOARD, SKIES } from '../src/index.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 10"><rect width="30" height="10" fill="#2f6b50"/></svg>';

describe('billboard', () => {
	it('returns the size asked for, the same for the same options', () => {
		const m = billboard({ art: ART, size: 600 });
		assert.equal(m.object, 'billboard');
		assert.equal(m.width, 600);
		assert.equal(mockup('billboard', { art: ART, size: 600 }).svg, m.svg);
		assert.notEqual(billboard({ art: ART, size: 600, seed: 'b' }).svg, m.svg);
	});

	it('stands on a mast against the sky, or hangs on a brick wall over a street', () => {
		const road = billboard({ art: ART }).svg;
		assert.match(road, new RegExp(`stop-color="${SKIES.day.stops[0]}"`));
		const wall = billboard({ art: ART, setting: 'wall', view: 'angle' }).svg;
		assert.match(wall, /-bricks\d+/);
		assert.ok(BILLBOARD.wall.ratio < BILLBOARD.roadside.ratio);
	});

	it('goes dark at night, with the lamps on', () => {
		const { svg } = billboard({ art: ART, time: 'night' });
		assert.match(svg, /fill="#060b1c"/);
		assert.match(svg, /-halo\d+/);
		assert.doesNotMatch(billboard({ art: ART }).svg, /fill="#060b1c"/);
	});

	it('contains art on a background colour', () => {
		assert.match(billboard({ art: ART, fill: 'contain', background: '#ebe3d2' }).svg, /fill="#ebe3d2"/);
	});

	it('refuses bad options', () => {
		assert.throws(() => billboard(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => billboard({ art: ART, setting: /** @type {any} */ ('roof') }), /setting/);
		assert.throws(() => billboard({ art: ART, time: /** @type {any} */ ('noon') }), /time/);
		assert.throws(() => billboard({ art: ART, background: 'white' }), /background/);
	});

	it('rasterises, angled walls included', async (t) => {
		const sharp = await import('sharp').then((m) => m.default, () => null);
		if (!sharp) return t.skip('sharp is not installed');
		const { renderImage } = await import('../src/render/node.js');
		for (const o of [{ view: /** @type {const} */ ('angle'), time: /** @type {const} */ ('night') }, { setting: /** @type {const} */ ('wall'), view: /** @type {const} */ ('angle') }]) {
			const png = await renderImage(billboard({ art: ART, size: 300, ...o }));
			assert.equal((await sharp(png).metadata()).width, 300);
		}
	});
});
