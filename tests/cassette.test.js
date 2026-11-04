/**
 * @arraypress/mockups — the cassette: options, layout, determinism, the
 * shells, and the picture (a black shell is dark, the J-card shows the art).
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { cassette, cassetteLayout } from '../src/objects/cassette.js';
import { resolveShell, SHELL, SHELLS } from '../src/parts/cassette/shell.js';
import { CASE } from '../src/parts/cassette/case.js';
import { JCARD, fitType } from '../src/parts/cassette/jcard.js';

/** @type {typeof import('sharp') | null} */
let sharp = null;
before(async () => {
	sharp = await import('sharp').then((m) => m.default, () => null);
});

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#e0245e"/></svg>';

describe('cassette', () => {
	it('lays the tape in front of its case, to the right by default', () => {
		const m = cassette({ art: ART });
		assert.equal(m.object, 'cassette');
		const r = cassetteLayout('right');
		assert.ok(r.tape[0] > 0 && r.tape[0] < CASE.width, 'overlapping the case');
		assert.equal(r.extent.x1, r.tape[0] + SHELL.width);
		const l = cassetteLayout('left');
		assert.ok(l.tape[0] < 0 && l.tape[0] + SHELL.width > 0);
		assert.deepEqual([SHELL.width, SHELL.height, CASE.width, CASE.height, JCARD.width, JCARD.height], [100.4, 63.8, 70, 109, 65, 101.6]);
	});

	it('is the same for the same options, and sets the title', () => {
		assert.equal(cassette({ art: ART, title: 'x' }).svg, cassette({ art: ART, title: 'x' }).svg);
		const { svg } = cassette({ art: ART, title: 'Static Bloom' });
		assert.equal((svg.match(/>STATIC BLOOM</g) ?? []).length, 2, 'on the J-card and the label');
		assert.ok(fitType('A VERY LONG TITLE INDEED', 55, 5.2) < 5.2);
	});

	it('resolves shells', () => {
		assert.deepEqual(resolveShell(), { ...SHELLS.black });
		assert.equal(resolveShell('clear').opacity < 0.5, true);
		assert.deepEqual(resolveShell('#ff0000'), { color: '#ff0000', opacity: 1 });
		assert.equal(resolveShell({ color: '#00ff00' }).opacity, 0.6);
		assert.throws(() => resolveShell('glitter'), /shell/);
	});

	it('refuses bad options', () => {
		assert.throws(() => cassette(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => cassette({ art: ART, side: /** @type {any} */ ('up') }), /side/);
		assert.throws(() => cassette({ art: ART, shell: /** @type {any} */ ('glitter') }), /shell/);
		assert.throws(() => cassette({ art: ART, label: /** @type {any} */ (3) }), /label/);
		assert.throws(() => cassette({ art: ART, title: /** @type {any} */ (3) }), /title/);
	});

	it('draws a dark shell and the cover on the J-card', async (t) => {
		if (!sharp) return t.skip('sharp is not installed');
		const { renderImage } = await import('../src/render/node.js');
		const m = cassette({ art: ART, size: 800, grain: 0, label: 'plain' });
		const { data, info } = await sharp(await renderImage(m)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
		const px = (x, y) => [...data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3)];
		const L = cassetteLayout('right');
		const k = (800 * 0.86) / (L.extent.x1 - L.extent.x0);
		const ox = 400 - ((L.extent.x0 + L.extent.x1) / 2) * k;
		const oy = 400 - ((L.extent.y0 + L.extent.y1) / 2) * k;
		const at = (x, y) => px(Math.round(ox + x * k), Math.round(oy + y * k));
		const [r, g, b] = at(30, 25);
		assert.ok(r > 170 && g < 90 && b < 130, `J-card ${[r, g, b]}`);
		const shell = at(L.tape[0] + 50, L.tape[1] + 48);
		assert.ok(Math.max(...shell) < 70, `shell ${shell}`);
	});
});
