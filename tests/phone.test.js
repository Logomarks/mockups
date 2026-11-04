/**
 * @arraypress/mockups — phone: screens, views, options, and that it draws.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { phone, mockup, PHONE, PHONE_VIEWS } from '../src/index.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 16"><rect width="9" height="16" fill="#c33"/><circle cx="4.5" cy="8" r="3" fill="#fc0"/></svg>';
const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#2f6b50"/></svg>';
const count = (s, re) => (s.match(re) ?? []).length;

describe('phone', () => {
	it('returns a square SVG of the size asked for, the same for the same options', () => {
		const m = phone({ art: ART, size: 800 });
		assert.equal(m.object, 'phone');
		assert.equal(m.width, 800);
		assert.equal(phone({ art: ART, size: 800 }).svg, m.svg);
		assert.equal(mockup('phone', { art: ART, size: 800 }).svg, m.svg);
	});

	it('shows the art on the screen, embedded once', () => {
		const { svg } = phone({ art: ART });
		assert.equal(count(svg, /data:image\/svg\+xml;base64,/g), 1);
	});

	it('is one piece straight down, and warped in pieces at an angle', () => {
		assert.equal(count(phone({ art: ART, view: 'front' }).svg, /-piece\d+"/g), 0);
		assert.ok(count(phone({ art: ART, view: 'angle' }).svg, /-piece\d+"/g) > 4);
		assert.ok(PHONE_VIEWS.angle.tilt > 0 && PHONE.width < PHONE.height);
	});

	it('puts the brand on a home screen, its name under the icon', () => {
		const { svg } = phone({ art: ICON, screen: 'home', name: 'Hollow Fern' });
		assert.match(svg, />Hollow Fern</);
		assert.match(svg, />10:24</);
	});

	it('puts the brand in a feed post, with an avatar and a handle', () => {
		const { svg } = phone({ art: ART, avatar: ICON, screen: 'feed', name: 'Bloomfall' });
		assert.match(svg, />Bloomfall</);
		assert.match(svg, />@bloomfall · 2h</);
		assert.equal(count(svg, /data:image\/svg\+xml;base64,/g), 2);
		assert.match(phone({ art: ART, screen: 'feed', name: 'B', handle: 'b.fair', theme: 'dark' }).svg, />b\.fair · 2h</);
	});

	it('refuses bad options', () => {
		assert.throws(() => phone(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => phone({ art: ART, screen: /** @type {any} */ ('lock') }), /screen/);
		assert.throws(() => phone({ art: ART, screen: 'home' }), /name/);
		assert.throws(() => phone({ art: ART, view: /** @type {any} */ ('back') }), /view/);
		assert.throws(() => phone({ art: ART, finish: /** @type {any} */ ('gold') }), /finish/);
		assert.throws(() => phone({ art: ART, light: /** @type {any} */ ('left') }), /light/);
	});

	it('rasterises', async (t) => {
		const sharp = await import('sharp').then((m) => m.default, () => null);
		if (!sharp) return t.skip('sharp is not installed');
		const { renderImage } = await import('../src/render/node.js');
		const png = await renderImage(phone({ art: ART, view: 'angle', screen: 'home', name: 'X', size: 300 }));
		assert.equal((await sharp(png).metadata()).width, 300);
	});
});
