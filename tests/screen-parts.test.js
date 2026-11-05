/**
 * @logomarks/mockups — the screens the 3D scenes show: a close home screen with generic apps, a brand splash and a
 * brand page, drawn as SVG, the same every time.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scene } from '../src/render/scene.js';
import { appsScreen, appTile, glyph, APPS, GLYPHS } from '../src/parts/screen/apps.js';
import { splashScreen, SPLASH_STYLES } from '../src/parts/screen/splash.js';
import { brandUi, MENU, BRAND_UI_STATES } from '../src/parts/screen/brandui.js';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor"/></svg>';
const draw = (f) => {
	const sc = scene({ width: 1080, height: 2340, key: 'k' });
	sc.add(f(sc));
	return sc.svg();
};

describe('screen parts', () => {
	it('draws every glyph, and every app with one', () => {
		for (const g of GLYPHS) assert.ok(glyph(g, '#fff').length > 20, g);
		assert.ok(APPS.every((a) => GLYPHS.includes(a.glyph)));
		const sc = scene({ width: 100, height: 100 });
		assert.match(appTile(sc, APPS[1], { x: 0, y: 0, size: 100 }), /linearGradient|url\(#/);
	});

	it('puts the brand first on a home screen, with the time', () => {
		const svg = draw((sc) => appsScreen(sc, { width: 1080, height: 2340, mark: MARK, name: 'Covehaus', color: '#1f5c4c', ink: '#f2ede0', wallpaper: '#0b0c0e', hole: 20 }));
		assert.match(svg, />9:41</);
		assert.match(svg, />Covehaus</);
		assert.match(svg, /fill="#1f5c4c"/);
		assert.doesNotMatch(svg, />(Calendar|Mail|Photos|Camera|Clock|Music|Maps)</, 'no stock app is named');
		assert.equal(svg, draw((sc) => appsScreen(sc, { width: 1080, height: 2340, mark: MARK, name: 'Covehaus', color: '#1f5c4c', ink: '#f2ede0', wallpaper: '#0b0c0e', hole: 20 })));
		assert.match(draw((sc) => appsScreen(sc, { width: 1080, height: 2340, mark: MARK, name: 'X', color: '#000', ink: '#fff', wallpaper: '#f4f4f4' })), /fill="#111215"/, 'dark type on a light wallpaper');
	});

	it('sets a splash in every style, its ink by the colour', () => {
		for (const style of SPLASH_STYLES) assert.match(draw((sc) => splashScreen(sc, { width: 1600, height: 1000, mark: MARK, name: 'Gecko', color: '#e2552c', style })), />Gecko</);
		assert.match(draw((sc) => splashScreen(sc, { width: 1600, height: 1000, mark: MARK, name: 'Sun', color: '#ffe066' })), /fill="#161616"/);
	});

	it('draws a brand page, and its menu open', () => {
		const page = draw((sc) => brandUi(sc, { width: 1080, height: 2340, mark: MARK, name: 'Railkin', color: '#4a3bd2' }));
		const menu = draw((sc) => brandUi(sc, { width: 1080, height: 2340, mark: MARK, name: 'Railkin', color: '#4a3bd2', state: 'menu' }));
		assert.match(page, />Meet Railkin\.</);
		for (const m of MENU) assert.ok(menu.includes(`>${m}<`) && !page.includes(`>${m}<`), m);
		assert.match(page, /fill="#4a3bd2"/);
		assert.match(draw((sc) => brandUi(sc, { width: 1080, height: 2340, mark: MARK, name: 'R', color: '#f6e7a1' })), /fill="#26272b"/, 'a dark bar for a light colour');
		assert.deepEqual(BRAND_UI_STATES, ['page', 'menu']);
	});

});
