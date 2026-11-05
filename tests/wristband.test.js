/**
 * @arraypress/mockups — wristbands: fabric loops and Tyvek strips, on their own and beside a lanyard pass.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { wristband, lanyard, mockup, WRISTBAND, WRISTBAND_KINDS } from '../src/index.js';
import { resolveBands, bandPlacements } from '../src/parts/wristband.js';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="200" fill="#e5372b"/></svg>';
const PASS = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 111 154"><rect width="111" height="154" fill="#3b5bdb"/></svg>';

describe('wristband', () => {
	it('lays two fabric bands and a Tyvek strip by default', () => {
		const m = wristband({ art: MARK, name: 'Ferro Fest' });
		assert.equal(m.object, 'wristband');
		assert.equal(mockup('wristband', { art: MARK, name: 'Ferro Fest' }).svg, m.svg);
		assert.match(m.svg, />PEEL</);
		assert.ok((m.svg.match(/>F<\/text>/g) ?? []).length >= 4, 'the name round the loops, letter by letter');
		assert.deepEqual([...WRISTBAND_KINDS], ['fabric', 'tyvek']);
		assert.equal(WRISTBAND.tyvek.length, 254);
	});

	it('takes each band its own colour, words and number', () => {
		const bands = resolveBands(['fabric', { kind: 'tyvek', color: '#ff5fa8', number: 'No.1' }, 'fabric'], 'Lumen', 'wristband');
		assert.deepEqual(bands.map((b) => b.kind), ['fabric', 'tyvek', 'fabric']);
		assert.notEqual(bands[0].color, bands[2].color, 'fabric bands take colours in turn');
		assert.equal(bands[0].ink, '#ffffff', 'light words on a dark band');
		assert.equal(bands[1].text, 'LUMEN');
		const { svg } = wristband({ art: MARK, bands: [{ kind: 'tyvek', text: 'CREW', number: 'No.113084' }] });
		assert.match(svg, />CREW</);
		assert.match(svg, />No\.113084</);
	});

	it('places the bands down a column, turned each way', () => {
		const at = bandPlacements(resolveBands(['fabric', 'fabric', 'tyvek'], '', 'x'), 's');
		assert.ok(at[0].y < at[1].y && at[1].y < at[2].y);
		assert.ok(Math.sign(at[0].angle) !== Math.sign(at[1].angle));
	});

	it('lies beside a lanyard pass, with the mark on the sliders', () => {
		const plain = lanyard({ art: PASS, name: 'Ferro' }).svg;
		const banded = lanyard({ art: PASS, name: 'Ferro', mark: MARK, wristbands: ['fabric', 'tyvek'] }).svg;
		assert.doesNotMatch(plain, />PEEL</);
		assert.match(banded, />PEEL</);
		assert.ok(banded.includes(Buffer.from(MARK).toString('base64').slice(0, 40)), 'the mark is embedded');
	});

	it('refuses bad options', () => {
		assert.throws(() => wristband(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => wristband({ art: MARK, bands: /** @type {any} */ (['silk']) }), /'fabric' or 'tyvek'/);
		assert.throws(() => wristband({ art: MARK, bands: [{ color: 'red' }] }), /hex colour/);
		assert.throws(() => wristband({ art: MARK, bands: [] }), /at least one/);
		assert.throws(() => lanyard({ art: PASS, wristbands: /** @type {any} */ ('fabric') }), /list/);
	});
});
