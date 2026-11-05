/**
 * @logomarks/mockups — the CD: options, layout, determinism, and the
 * picture (the booklet under the lid, the ground through the disc's hole).
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { cd, cdLayout, PACKAGINGS } from '../src/objects/cd.js';
import { JEWEL } from '../src/parts/cd/jewel.js';
import { DISC } from '../src/parts/cd/disc.js';
import { mockup } from '../src/index.js';

/** @type {typeof import('sharp') | null} */
let sharp = null;
before(async () => {
	sharp = await import('sharp').then((m) => m.default, () => null);
});

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#2050c0"/></svg>';
const count = (s, re) => (s.match(re) ?? []).length;

/**
 * Pixels of a mockup.
 *
 * @param {import('../src/types.js').Mockup} m The mockup.
 * @returns {Promise<(x: number, y: number) => number[]>} A reader.
 */
async function pixels(m) {
	const { renderImage } = await import('../src/render/node.js');
	const { data, info } = await /** @type {typeof import('sharp')} */ (sharp)(await renderImage(m)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	return (x, y) => [...data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3)];
}

describe('cd', () => {
	it('is a jewel case with the disc half out on the right by default', () => {
		const m = cd({ art: ART });
		assert.equal(m.object, 'cd');
		assert.equal(m.width, 1600);
		const L = cdLayout('jewel', 'right', 0.5);
		assert.equal(L.w, 142);
		assert.equal(L.h, 125);
		assert.equal(L.disc[0], 142 - DISC.radius + DISC.radius, 'half the diameter past the edge');
		assert.equal(L.box.x1, 142 + DISC.radius);
		assert.equal(cdLayout('digipak', 'left', 0.5).disc[0], DISC.radius - DISC.radius);
		assert.deepEqual(PACKAGINGS, ['jewel', 'digipak']);
		assert.equal(mockup('cd', { art: ART, size: 300 }).svg, cd({ art: ART, size: 300 }).svg);
	});

	it('is the same for the same options, and embeds the art once', () => {
		assert.equal(cd({ art: ART, seed: 'a' }).svg, cd({ art: ART, seed: 'a' }).svg);
		assert.notEqual(cd({ art: ART, seed: 'a' }).svg, cd({ art: ART, seed: 'b' }).svg);
		for (const packaging of PACKAGINGS) assert.equal(count(cd({ art: ART, packaging }).svg, /data:image\/svg\+xml;base64,/g), 1, packaging);
		assert.equal(count(cd({ art: ART, disc: '<svg xmlns="http://www.w3.org/2000/svg"/>' }).svg, /data:image\/svg\+xml;base64,/g), 2, 'a disc of its own');
	});

	it('hides the disc at peek 0 and leaves a bare one unprinted', () => {
		assert.doesNotMatch(cd({ art: ART, peek: 0 }).svg, /-cd\d+"/);
		const silver = cd({ art: ART, disc: 'silver' }).svg;
		assert.doesNotMatch(silver, /-cdarea\d+\)"><circle/);
		assert.match(silver, /fill="#ff3b6b"/, 'the rainbow');
	});

	it('refuses bad options', () => {
		assert.throws(() => cd(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => cd({ art: ART, packaging: /** @type {any} */ ('slim') }), /packaging/);
		assert.throws(() => cd({ art: ART, side: /** @type {any} */ ('up') }), /side/);
		assert.throws(() => cd({ art: ART, tray: /** @type {any} */ ('red') }), /tray/);
		assert.throws(() => cd({ art: ART, peek: /** @type {any} */ ('half') }), /peek/);
		assert.throws(() => cd({ art: ART, disc: /** @type {any} */ (7) }), /disc/);
	});

	it('shows the booklet under the lid and the ground through the hole', async (t) => {
		if (!sharp) return t.skip('sharp is not installed');
		const m = cd({ art: ART, size: 800, grain: 0 });
		const px = await pixels(m);
		assert.deepEqual(px(5, 5), [230, 230, 230]);
		// the middle of the booklet: the cover's blue, a little lifted by the plastic
		const L = cdLayout('jewel', 'right', 0.5);
		const k = (800 * 0.86) / (L.box.x1 - L.box.x0);
		const x0 = 400 - ((L.box.x0 + L.box.x1) / 2) * k;
		const y0 = 400 - (L.h / 2) * k;
		const [r, g, b] = px(Math.round(x0 + (JEWEL.booklet.x + 60) * k), Math.round(y0 + 62.5 * k));
		assert.ok(b > 150 && r < 90 && g < 120, `booklet ${[r, g, b]}`);
		// slid further out, the disc's hole clears the case and shows the ground (its own shadow cut out of it)
		const far = cdLayout('jewel', 'right', 0.8);
		const kf = (800 * 0.86) / (far.box.x1 - far.box.x0);
		const fx = 400 - ((far.box.x0 + far.box.x1) / 2) * kf;
		const fy = 400 - (far.h / 2) * kf;
		const pf = await pixels(cd({ art: ART, size: 800, grain: 0, peek: 0.8 }));
		const [hole] = pf(Math.round(fx + far.disc[0] * kf), Math.round(fy + far.disc[1] * kf));
		assert.ok(hole >= 224, `hole at ${hole}`);
	});
});
