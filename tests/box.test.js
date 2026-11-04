/**
 * @arraypress/mockups — boxes: mailers and lid boxes, open and closed,
 * prints on each face, and bad options.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { box, BOXES } from '../src/objects/box.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#d9502e"/></svg>';
const SIDE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#2f6b4f"/></svg>';
const images = (s) => (s.match(/<image id="[^"]+-img\d+"/g) ?? []).length;

describe('box', () => {
	it('is a closed kraft mailer by default, in a 1600 square', () => {
		const m = box({ art: ART });
		assert.equal(m.object, 'box');
		assert.deepEqual([m.width, m.height], [1600, 1600]);
		assert.equal(images(m.svg), 1);
	});

	it('opens a mailer to show its lid’s inside and fluted edges', () => {
		const closed = box({ art: ART }).svg;
		const open = box({ art: ART, open: true, inside: SIDE }).svg;
		assert.ok((open.match(/-bface\d+"/g) ?? []).length > (closed.match(/-bface\d+"/g) ?? []).length);
		assert.match(open, /<path d="M0 [\d.]+Q/);
	});

	it('prints the top and, when given, the front', () => {
		assert.equal(images(box({ art: ART, side: SIDE, kind: 'lid' }).svg), 2);
	});

	it('is the same for the same options', () => {
		assert.equal(box({ art: ART, kind: 'lid', open: true }).svg, box({ art: ART, kind: 'lid', open: true }).svg);
		assert.ok(BOXES.lid.lid > 0 && BOXES.mailer.wall > 0);
	});

	it('refuses bad options', () => {
		assert.throws(() => box(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => box({ art: ART, kind: /** @type {any} */ ('crate') }), /kind/);
		assert.throws(() => box({ art: ART, board: /** @type {any} */ ('pink') }), /board/);
		assert.throws(() => box({ art: ART, open: /** @type {any} */ ('yes') }), /open/);
	});
});
