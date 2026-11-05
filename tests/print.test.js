/**
 * @arraypress/mockups — one-ink prints, the ticket trio with prints of its own, and the printed sticker sheet.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { vinyl, ticket, sticker, SHEET_PAPERS, VINYL_SIZES } from '../src/index.js';
import { resolvePrint } from '../src/materials/ink.js';
import { ticketPlacements } from '../src/objects/ticket.js';
import { resolveLabels } from '../src/parts/label.js';
import { trackStops } from '../src/materials/surface.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#777"/></svg>';
const B = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#123456"/></svg>';
const sheets = (svg) => (svg.match(/-sheet\d+"><path/g) ?? []).length;

describe('print', () => {
	it('prints a sleeve in one ink on coloured stock', () => {
		assert.equal(resolvePrint('full', 'x'), null);
		assert.deepEqual(resolvePrint({ ink: '#3d051a', paper: '#ec3a95' }, 'x'), { ink: '#3d051a', paper: '#ec3a95' });
		assert.throws(() => resolvePrint({ paper: '#fff' }, 'vinyl'), /print is 'full' or \{ ink, paper \}/);
		const { svg } = vinyl({ art: ART, print: { ink: '#3d051a', paper: '#ec3a95' }, size: 400 });
		assert.match(svg, /fill="#ec3a95"/);
		assert.match(svg, /<feColorMatrix type="matrix" values="0 0 0 0 0\.239/);
	});

	it('has a 7" beside the 12", its label wider and its speed 45', () => {
		assert.ok(VINYL_SIZES['7in'].label / VINYL_SIZES['7in'].record > VINYL_SIZES['12in'].label / VINYL_SIZES['12in'].record);
		const [a] = resolveLabels('plain', 'x', ART, VINYL_SIZES['7in'].speed);
		assert.equal(a.speed, '45 RPM');
		assert.match(String(a.ring), /45 RPM/);
		assert.throws(() => resolveLabels({ a: { art: ART, scale: 2 } }), /scale/);
		// the 12" tracks are as they were; a 7"'s start further out
		assert.deepEqual(trackStops('s', false), trackStops('s', false, 1, 400, { label: 0.333, tracks: [5, 8] }));
		assert.ok(trackStops('s', false, 1, 400, { label: 0.49, tracks: [1, 3] })[0][0] > 0.49);
	});

	it('lays a trio: two tickets of their own prints and the stub of a third', () => {
		const at = ticketPlacements('trio');
		assert.equal(at.length, 3);
		assert.ok(at[2].stub);
		const { svg } = ticket({ art: ART, extra: [B], layout: 'trio' });
		assert.equal(sheets(svg), 3);
		assert.ok(svg.includes(Buffer.from(B).toString('base64').slice(0, 40)), 'the second print is used');
		assert.throws(() => ticket({ art: ART, extra: /** @type {any} */ (B) }), /extra is a list/);
	});

	it('lays a printed sticker sheet with its sticker stuck beside it', () => {
		assert.deepEqual([...SHEET_PAPERS.A5], [148, 210]);
		const { svg } = sticker({ art: B, layout: 'sheet', sheet: { art: ART, bleed: 3 }, surface: 'cutting-mat' });
		assert.ok(svg.includes(Buffer.from(ART).toString('base64').slice(0, 40)));
		assert.throws(() => sticker({ art: B, layout: 'sheet', sheet: { art: ART, bleed: -1 } }), /bleed/);
		assert.throws(() => sticker({ art: B, layout: 'sheet', sheet: ART, paper: /** @type {any} */ ('A3') }), /paper/);
	});
});
