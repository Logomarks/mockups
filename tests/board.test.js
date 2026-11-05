/**
 * @logomarks/mockups — packaging board: the boards, procedural fibre that
 * tiles without a seam, the photographed kraft loaded by the Node entry,
 * and the shipped textures themselves.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { resolveBoard, liningFor, fibreField, BOARDS, FIBRE_LOOKS } from '../src/materials/board.js';
import { KRAFT_COUNT, kraftUrl, kraftTextures } from '../src/materials/textures.js';
import { field, fbm } from '../src/util/field.js';

describe('board', () => {
	it('resolves kraft, white, black and colours, and says what it takes', () => {
		assert.equal(resolveBoard().name, 'kraft');
		assert.equal(resolveBoard('black').color, BOARDS.black);
		assert.equal(resolveBoard('#2f6b4f').name, 'custom');
		assert.equal(resolveBoard('#111111').look, FIBRE_LOOKS.black);
		assert.throws(() => resolveBoard(/** @type {any} */ ('pink'), 'box'), /box: board is 'kraft', 'white', 'black' or a hex colour/);
	});

	it('lines kraft a touch lighter, a white mailer in kraft, anything else in itself', () => {
		assert.notEqual(liningFor(resolveBoard('kraft'), 'mailer'), BOARDS.kraft);
		assert.equal(liningFor(resolveBoard('white'), 'mailer'), liningFor(resolveBoard('kraft'), 'mailer'));
		assert.equal(liningFor(resolveBoard('white'), 'lid'), BOARDS.white);
		assert.equal(liningFor(resolveBoard('black'), 'mailer'), BOARDS.black);
	});

	it('wraps noise into a seamless tile', () => {
		const f = fbm(field(64, 64), { seed: 's', scale: 4, octaves: 3, wrap: true });
		// the last column runs on into the first as smoothly as any two neighbours do
		let seam = 0;
		let inner = 0;
		for (let y = 0; y < 64; y++) {
			seam += Math.abs(f.v[y * 64 + 63] - f.v[y * 64]);
			inner += Math.abs(f.v[y * 64 + 32] - f.v[y * 64 + 31]);
		}
		assert.ok(seam < inner * 2.5, `seam ${seam.toFixed(3)} vs ${inner.toFixed(3)}`);
	});

	it('draws fibre the same for the same seed, and darker than not on kraft', () => {
		const a = fibreField(FIBRE_LOOKS.kraft, { seed: 'x', size: 64, span: 20 });
		const b = fibreField(FIBRE_LOOKS.kraft, { seed: 'x', size: 64, span: 20 });
		assert.deepEqual(a.tone.v, b.tone.v);
		assert.ok(a.tone.v.some((v) => v < -0.1), 'dark fibres and flecks');
	});

	it('ships four kraft textures, small', async () => {
		let total = 0;
		for (let n = 0; n < KRAFT_COUNT; n++) total += (await stat(kraftUrl(n))).size;
		assert.ok(total < 1.2 * 1024 * 1024, `${total} bytes`);
	});

	it('loads them through the Node entry, as JPEG an SVG renderer can draw', async () => {
		const node = await import('../src/render/node.js');
		assert.equal(await node.loadTextures(), true);
		assert.equal(kraftTextures().length, KRAFT_COUNT);
		assert.ok(kraftTextures().every((t) => t.startsWith('data:image/jpeg;base64,')));
		const { svg } = node.box({ art: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>' });
		assert.match(svg, /data:image\/jpeg;base64,/, 'the kraft photograph in the box');
	});
});
