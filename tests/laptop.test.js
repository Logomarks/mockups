/**
 * @logomarks/mockups — laptop: the browser, the domain, views, options, and that it draws.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { laptop, mockup, LAPTOP } from '../src/index.js';
import { ROWS } from '../src/parts/keyboard.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 30"><rect width="16" height="30" fill="#36c"/></svg>';
const count = (s, re) => (s.match(re) ?? []).length;

describe('laptop', () => {
	it('returns the size asked for, the same for the same options', () => {
		const m = laptop({ art: ART, domain: 'hollowfern.example', size: { width: 1200, height: 900 } });
		assert.equal(m.object, 'laptop');
		assert.deepEqual([m.width, m.height], [1200, 900]);
		assert.equal(mockup('laptop', { art: ART, domain: 'hollowfern.example', size: { width: 1200, height: 900 } }).svg, m.svg);
	});

	it('shows the domain in the address field and the title on the tab', () => {
		const { svg } = laptop({ art: ART, domain: 'hollowfern.example', title: 'Hollow Fern — recordings' });
		assert.match(svg, />hollowfern\.example</);
		assert.match(svg, />Hollow Fern — recordings</);
		assert.match(laptop({ art: ART, domain: 'a.example', title: 'A title much too long for the tab' }).svg, />A title much too long for…</);
		assert.match(laptop({ art: ART, domain: 'a.example' }).svg, />a\.example</);
	});

	it('draws every key, and warps the screen at both views', () => {
		const keys = ROWS.reduce((n, r) => n + r.keys.length, 0);
		const { svg } = laptop({ art: ART, domain: 'a.example' });
		assert.ok(count(svg, /<path d="M[^"]+"\/>/g) >= keys);
		assert.ok(count(svg, /-piece\d+"/g) > 4);
		assert.ok(count(laptop({ art: ART, domain: 'a.example', view: 'front' }).svg, /-piece\d+"/g) > 0);
		assert.ok(LAPTOP.lean > 0);
	});

	it('refuses bad options', () => {
		assert.throws(() => laptop(/** @type {any} */ ({ domain: 'a' })), /art is required/);
		assert.throws(() => laptop(/** @type {any} */ ({ art: ART })), /domain/);
		assert.throws(() => laptop({ art: ART, domain: 'a', fill: /** @type {any} */ ('stretch') }), /fill/);
		assert.throws(() => laptop({ art: ART, domain: 'a', view: /** @type {any} */ ('top') }), /view/);
	});

	it('rasterises', async (t) => {
		const sharp = await import('sharp').then((m) => m.default, () => null);
		if (!sharp) return t.skip('sharp is not installed');
		const { renderImage } = await import('../src/render/node.js');
		const png = await renderImage(laptop({ art: ART, domain: 'a.example', size: 300 }));
		assert.equal((await sharp(png).metadata()).width, 300);
	});
});
