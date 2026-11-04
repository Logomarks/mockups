/**
 * @arraypress/mockups — shelter: day and night, views, options, and that it draws.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shelter, mockup, SHELTER } from '../src/index.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 3"><rect width="2" height="3" fill="#ff4fa0"/></svg>';

describe('shelter', () => {
	it('returns the size asked for, the same for the same options', () => {
		const m = shelter({ art: ART, size: 600 });
		assert.equal(m.object, 'shelter');
		assert.equal(mockup('shelter', { art: ART, size: 600 }).svg, m.svg);
		assert.ok(SHELTER.box.height > SHELTER.box.width);
	});

	it('shows the poster in the lightbox, warped, by day', () => {
		const { svg } = shelter({ art: ART });
		assert.equal((svg.match(/data:image\/svg\+xml;base64,/g) ?? []).length, 1);
		assert.ok((svg.match(/-piece\d+"/g) ?? []).length > 4);
		assert.doesNotMatch(svg, /fill="#060b1c"/);
	});

	it('glows at night: the veil, then the poster and its spill over it', () => {
		const { svg } = shelter({ art: ART, time: 'night' });
		const veil = svg.indexOf('fill="#060b1c"');
		assert.ok(veil > 0);
		assert.ok(svg.lastIndexOf('-piece') > veil, 'the poster is drawn after the veil');
	});

	it('refuses bad options', () => {
		assert.throws(() => shelter(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => shelter({ art: ART, time: /** @type {any} */ ('dusk') }), /time/);
		assert.throws(() => shelter({ art: ART, fill: /** @type {any} */ ('top') }), /fill/);
	});

	it('rasterises, by night and square to the poster', async (t) => {
		const sharp = await import('sharp').then((m) => m.default, () => null);
		if (!sharp) return t.skip('sharp is not installed');
		const { renderImage } = await import('../src/render/node.js');
		const png = await renderImage(shelter({ art: ART, time: 'night', view: 'front', size: 300 }));
		assert.equal((await sharp(png).metadata()).width, 300);
	});
});
