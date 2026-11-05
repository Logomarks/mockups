/**
 * @logomarks/mockups — the poster: options, sizes, the mounts, and the
 * picture (the wall round it, the print in its frame).
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { poster, printSize, PAPERS, MOUNTS } from '../src/objects/poster.js';
import { resolveWall } from '../src/materials/wall.js';
import { tornSheet } from '../src/parts/poster/torn.js';
import { flyerLayout } from '../src/parts/poster/pole.js';

/** @type {typeof import('sharp') | null} */
let sharp = null;
before(async () => {
	sharp = await import('sharp').then((m) => m.default, () => null);
});

// a 4:5 flyer
const ART = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="#1f6feb"/></svg>';

describe('poster', () => {
	it('sizes the print from the sheet, in the art’s proportions or the sheet’s', () => {
		assert.deepEqual(PAPERS.A2, [420, 594]);
		assert.deepEqual(printSize('A2', 0.8), [594 * 0.8, 594]);
		assert.deepEqual(printSize('A3', 2), [420, 210]);
		assert.deepEqual(MOUNTS, ['tape', 'wheatpaste', 'pole', 'frame']);
	});

	it('goes up every way, the same each time for the same options', () => {
		for (const mount of MOUNTS) {
			const m = poster({ art: ART, mount, size: 600 });
			assert.equal(m.object, 'poster');
			assert.equal(m.svg, poster({ art: ART, mount, size: 600 }).svg, mount);
			assert.equal((m.svg.match(/data:image\/svg\+xml;base64,/g) ?? []).length, 1, `${mount}: the art once`);
		}
		assert.notEqual(poster({ art: ART, mount: 'wheatpaste', seed: 'a' }).svg, poster({ art: ART, mount: 'wheatpaste', seed: 'b' }).svg);
		assert.match(poster({ art: ART, mount: 'pole' }).svg, /<feDisplacementMap/, 'wrapped round the pole');
		assert.match(poster({ art: ART, mount: 'frame', frame: 'wood' }).svg, /-grain\d+/);
	});

	it('tears the paper: the print stops short of a tear', () => {
		const clean = tornSheet(400, 500, 1, 's', 0);
		const torn = tornSheet(400, 500, 1, 's', 2);
		assert.equal(clean.paper, clean.print);
		assert.notEqual(torn.paper, torn.print);
		const flyers = flyerLayout(3, 210, 297, 's');
		assert.equal(flyers.length, 3);
		assert.equal(flyers[2].fade, 0, 'the newest on top, unfaded');
	});

	it('resolves walls', () => {
		assert.equal(resolveWall().kind, 'plaster');
		assert.deepEqual(resolveWall('#335577'), { kind: 'plaster', color: '#335577' });
		assert.equal(resolveWall('brick').kind, 'brick');
		assert.throws(() => resolveWall('wood', 'poster'), /poster: wall/);
	});

	it('refuses bad options', () => {
		assert.throws(() => poster(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => poster({ art: ART, mount: /** @type {any} */ ('glue') }), /mount/);
		assert.throws(() => poster({ art: ART, paper: /** @type {any} */ ('A0') }), /paper/);
		assert.throws(() => poster({ art: ART, aspect: /** @type {any} */ ('square') }), /aspect/);
		assert.throws(() => poster({ art: ART, frame: /** @type {any} */ ('gold') }), /frame/);
		assert.throws(() => poster({ art: ART, wall: /** @type {any} */ ('tile') }), /wall/);
		assert.throws(() => poster({ art: ART, mat: /** @type {any} */ ('wide') }), /mat/);
	});

	it('frames the print in black on a pale wall', async (t) => {
		if (!sharp) return t.skip('sharp is not installed');
		const { renderImage } = await import('../src/render/node.js');
		const m = poster({ art: ART, mount: 'frame', size: 600, grain: 0 });
		const { data, info } = await sharp(await renderImage(m)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
		const px = (x, y) => [...data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3)];
		const [r, g, b] = px(300, 300);
		assert.ok(b > 170 && r < 90, `print ${[r, g, b]}`);
		assert.ok(Math.min(...px(8, 8)) > 170, 'wall');
		// along the middle row, from the left edge in: wall, then the dark moulding, then the mat, then the print
		const row = Array.from({ length: 300 }, (_, x) => px(x, 300)[0]);
		const dark = row.findIndex((v) => v < 60);
		assert.ok(dark > 20, 'the moulding');
		assert.ok(row.slice(dark + 12).some((v) => v > 225), 'the mat');
	});
});
