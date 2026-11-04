/**
 * @arraypress/mockups — lanyard: the pass in its pocket, the printed strap,
 * the clasp, and options.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lanyard, PASS, strands } from '../src/objects/lanyard.js';
import { walk } from '../src/parts/strap.js';
import { pocketShape } from '../src/parts/pocket.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 111 154"><rect width="111" height="154" fill="#3b5bdb"/></svg>';

describe('lanyard', () => {
	it('holds an A6 pass in a larger pocket with a slot', () => {
		assert.deepEqual([PASS.width, PASS.height], [105, 148]);
		assert.ok(PASS.pocket.width > PASS.width && PASS.pocket.height > PASS.height);
		const { slot } = pocketShape(PASS.pocket.width, PASS.pocket.height);
		assert.ok(slot.y < -PASS.pocket.height / 2 + 10);
	});

	it('prints the name along the strap, letter by letter', () => {
		const { svg, object } = lanyard({ art: ART, name: 'Lumen' });
		assert.equal(object, 'lanyard');
		assert.ok((svg.match(/>L<\/text>/g) ?? []).length >= 4);
		assert.doesNotMatch(lanyard({ art: ART }).svg, /<text/);
	});

	it('inks the name light on a dark strap and dark on a light one', () => {
		assert.match(lanyard({ art: ART, name: 'x', strap: '#111111' }).svg, /fill="#f4f2ee"/);
		assert.match(lanyard({ art: ART, name: 'x', strap: '#eeeeee' }).svg, /<g fill="#1b1c1f" font-family/);
	});

	it('walks a curve at an even step', () => {
		const pts = walk([[0, 0], [10, 0], [20, 0]], 5);
		assert.ok(pts.length >= 4 && pts.length <= 5);
		assert.ok(pts.every((p, i) => Math.abs(p.a) < 1e-9 && Math.abs(p.x - i * 5) < 1e-6));
		assert.equal(strands(-100).length, 2);
	});

	it('refuses bad options', () => {
		assert.throws(() => lanyard(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => lanyard({ art: ART, strap: 'navy' }), /strap/);
		assert.throws(() => lanyard({ art: ART, name: /** @type {any} */ (3) }), /name/);
	});
});
