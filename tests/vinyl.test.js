/**
 * @arraypress/mockups — vinyl: options, layout, materials, labels, and what
 * the SVG holds.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { vinyl, mockup, OBJECTS, RECORD, GROUNDS, FINISHES } from '../src/index.js';
import { placements } from '../src/objects/vinyl.js';
import { resolveVinyl, paint, isDark } from '../src/materials/vinyl.js';
import { resolveLabels } from '../src/parts/label.js';
import { resolveGround } from '../src/materials/ground.js';
import { trackStops } from '../src/materials/surface.js';

/** A tiny SVG cover, so the tests need no files. */
const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#c33"/><circle cx="5" cy="5" r="3" fill="#fc0"/></svg>';
const count = (s, re) => (s.match(re) ?? []).length;

describe('vinyl', () => {
	it('returns a square SVG of the size asked for (1600 by default)', () => {
		const m = vinyl({ art: ART });
		assert.equal(m.object, 'vinyl');
		assert.equal(m.width, 1600);
		assert.equal(m.height, 1600);
		assert.match(m.svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="1600" height="1600" viewBox="0 0 1600 1600">/);
		const w = vinyl({ art: ART, size: { width: 1200, height: 800 } });
		assert.equal(w.width, 1200);
		assert.equal(w.height, 800);
	});

	it('is the same for the same options', () => {
		assert.equal(vinyl({ art: ART, vinyl: { splatter: ['#000', '#fff'] } }).svg, vinyl({ art: ART, vinyl: { splatter: ['#000', '#fff'] } }).svg);
		assert.notEqual(vinyl({ art: ART, seed: 'a' }).svg, vinyl({ art: ART, seed: 'b' }).svg);
	});

	it('embeds the art once and reuses it for the sleeve and the labels', () => {
		const { svg } = vinyl({ art: ART });
		assert.equal(count(svg, /data:image\/svg\+xml;base64,/g), 1);
		assert.ok(count(svg, /<use href="#m[a-z0-9]+-art"/g) >= 3, 'sleeve and two label crops');
	});

	it('draws two records for a double, one for a single, with a hole punched through each', () => {
		assert.equal(count(vinyl({ art: ART }).svg, /-disc\d+"><path/g), 2);
		assert.equal(count(vinyl({ art: ART, format: 'single' }).svg, /-disc\d+"><path/g), 1);
		assert.match(vinyl({ art: ART }).svg, /clip-rule="evenodd"/);
	});

	it('labels the sides, and leaves the words out when asked', () => {
		const { svg } = vinyl({ art: ART });
		assert.match(svg, />SIDE A</);
		assert.match(svg, />SIDE B</);
		const quiet = vinyl({ art: ART, labels: { a: { text: false, ring: false }, b: { text: 'B-SIDE' } } }).svg;
		assert.doesNotMatch(quiet, />SIDE A</);
		assert.match(quiet, />B-SIDE</);
	});

	it('takes a label of its own, embedding it beside the cover', () => {
		const own = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="#0af"/></svg>';
		const { svg } = vinyl({ art: ART, labels: { a: own, b: { art: 'plain', color: '#123456' } } });
		assert.equal(count(svg, /data:image\/svg\+xml;base64,/g), 2);
		assert.match(svg, /fill="#123456"/);
	});

	it('lays the ground first, in the colour asked for', () => {
		assert.match(vinyl({ art: ART }).svg, /<\/defs><rect width="1600" height="1600" fill="#e6e6e6"\/>/);
		assert.match(vinyl({ art: ART, ground: 'dark' }).svg, /<\/defs><rect width="1600" height="1600" fill="#161618"\/>/);
		assert.match(vinyl({ art: ART, ground: '#336699' }).svg, /fill="#336699"/);
	});

	it('adds grain unless it is 0', () => {
		assert.match(vinyl({ art: ART }).svg, /-grain\d+/);
		assert.doesNotMatch(vinyl({ art: ART, grain: 0 }).svg, /<pattern/);
	});

	it('refuses bad options', () => {
		assert.throws(() => vinyl(/** @type {any} */ (undefined)), TypeError);
		assert.throws(() => vinyl(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => vinyl({ art: ART, format: /** @type {any} */ ('triple') }), /format/);
		assert.throws(() => vinyl({ art: ART, side: /** @type {any} */ ('up') }), /side/);
		assert.throws(() => vinyl({ art: ART, format: 'single', side: 'both' }), /one side/);
		assert.throws(() => vinyl({ art: ART, size: 4 }), /size/);
		assert.throws(() => vinyl({ art: ART, peek: /** @type {any} */ ('lots') }), /peek/);
		assert.throws(() => vinyl({ art: ART, vinyl: /** @type {any} */ ('glitter') }), /vinyl/);
		assert.throws(() => vinyl({ art: ART, labels: /** @type {any} */ ('fancy') }), /labels/);
		assert.throws(() => vinyl({ art: ART, ground: /** @type {any} */ ('beige') }), /ground/);
		assert.throws(() => vinyl({ art: new Uint8Array([1, 2, 3, 4]) }), /not a PNG/);
	});
});

describe('layout', () => {
	it('puts a double’s records either side, A on the left', () => {
		assert.deepEqual(placements('double', 'both', 0.5), [
			{ dir: -1, peek: 0.5, label: 0 },
			{ dir: 1, peek: 0.5, label: 1 },
		]);
	});

	it('fans a double out on one side, the back record further', () => {
		const [back, front] = placements('double', 'right', 0.5);
		assert.equal(back.dir, 1);
		assert.ok(back.peek > front.peek);
		assert.equal(front.label, 0);
	});

	it('peeks a single out on its side', () => {
		assert.deepEqual(placements('single', 'left', 0.4), [{ dir: -1, peek: 0.4, label: 0 }]);
	});

	it('sizes a record as a 12" in its sleeve', () => {
		assert.ok(RECORD > 0.95 && RECORD < 0.98);
	});
});

describe('materials', () => {
	it('names its finishes', () => {
		assert.deepEqual(Object.keys(FINISHES), ['clear', 'black', 'white', 'smoke']);
		assert.equal(resolveVinyl().kind, 'clear');
		assert.equal(resolveVinyl('black').kind, 'solid');
		assert.equal(resolveVinyl('smoke').kind, 'tinted');
	});

	it('reads a hex as solid, and a colour with opacity as tinted', () => {
		assert.deepEqual(resolveVinyl('#ff0000'), { kind: 'solid', color: '#ff0000', opacity: 1, sheen: resolveVinyl('#ff0000').sheen, colors: [], base: null });
		assert.equal(resolveVinyl({ color: '#ff0000' }).opacity, 0.75);
		assert.equal(resolveVinyl({ color: '#ff0000', opacity: 1 }).kind, 'solid');
	});

	it('splatters over a clear base by default, and marbles', () => {
		const s = resolveVinyl({ splatter: ['#000', '#fff'] });
		assert.equal(s.kind, 'splatter');
		assert.equal(s.base?.kind, 'clear');
		assert.equal(resolveVinyl({ marble: ['#000', '#fff'] }).kind, 'marble');
		assert.throws(() => resolveVinyl({ marble: ['#000'] }), /two or more/);
		assert.throws(() => resolveVinyl({ splatter: [] }), /one or more/);
	});

	it('filters the ground through translucent vinyl (multiplied, not washed over)', () => {
		const red = resolveVinyl({ color: '#ff0000' });
		assert.equal(paint(red, '#ffffff'), '#ff0000');
		assert.equal(paint(resolveVinyl('#00ff00'), '#000000'), '#00ff00');
		assert.equal(isDark(resolveVinyl('black'), '#e6e6e6'), true);
		assert.equal(isDark(resolveVinyl('clear'), '#e6e6e6'), false);
		assert.equal(isDark(resolveVinyl('clear'), '#161618'), true);
	});

	it('cuts tracks into a record: rising offsets, opacities in range, seeded', () => {
		const stops = trackStops('x', false);
		for (let i = 1; i < stops.length; i++) assert.ok(stops[i][0] > stops[i - 1][0], `offset ${i}`);
		for (const [, , a] of stops) assert.ok(a >= 0 && a <= 0.2);
		assert.deepEqual(trackStops('x', false), stops);
		assert.notDeepEqual(trackStops('y', false), stops);
	});

	it('resolves grounds', () => {
		assert.deepEqual(GROUNDS.light, { color: '#e6e6e6', vignette: 0 });
		assert.equal(resolveGround('dark').dark, true);
		assert.equal(resolveGround({ color: '#ffffff', vignette: 2 }).vignette, 1);
	});

	it('resolves labels: auto is a dark A and a light B, cropped from the cover', () => {
		const [a, b] = resolveLabels('auto', 'Glow');
		assert.equal(a.source, 'crop');
		assert.equal(a.tone, 'dark');
		assert.equal(b.tone, 'light');
		assert.match(/** @type {string} */ (a.ring), /^GLOW · SIDE A/);
		assert.equal(resolveLabels('blur')[1].source, 'blur');
		assert.throws(() => resolveLabels({ a: { tone: /** @type {any} */ ('grey') } }), /tone/);
	});
});

describe('objects', () => {
	it('finds an object by name', () => {
		for (const name of ['vinyl', 'cd', 'cassette', 'poster']) assert.ok(Object.hasOwn(OBJECTS, name), name);
		assert.equal(mockup('vinyl', { art: ART, size: 400 }).svg, vinyl({ art: ART, size: 400 }).svg);
		assert.throws(() => mockup(/** @type {any} */ ('kettle'), { art: ART }), /No object "kettle"/);
	});
});

describe('vinyl fixes', () => {
	it('cuts tracks as bands: a few gaps, each a crisp glossy ring', () => {
		const stops = trackStops('x', false);
		const gaps = stops.filter(([o, c, a], i) => c === '#ffffff' && a > 0.07 && stops[i + 1]?.[1] === '#ffffff' && stops[i + 1][0] - o < 0.01);
		assert.ok(gaps.length >= 4 && gaps.length <= 10, `${gaps.length} gaps`);
	});

	it('centres its radial gradients on the record (not the frame)', () => {
		const { svg } = vinyl({ art: ART });
		for (const m of svg.matchAll(/<radialGradient [^>]*gradientUnits="userSpaceOnUse"[^>]*>/g)) if (/-(tracks|ringfill|glow)\d/.test(m[0])) assert.match(m[0], /cx="0" cy="0"/);
	});

	it('marbles in lobes from the centre, not bands', () => {
		const { svg } = vinyl({ art: ART, vinyl: { marble: ['#f4efe6', '#d94f30', '#2b2d42'] } });
		assert.doesNotMatch(svg, /<rect x="-[\d.]+" y="-?[\d.]+" width="[\d.]+" height="[\d.]+" fill="#d94f30"/);
		assert.ok(count(svg, /<path d="M0 0L/g) >= 6, 'lobes start at the centre');
	});

	it('crops labels where the cover is quiet when it was measured', async () => {
		const { quietCrops, remember } = await import('../src/render/quiet.js');
		// a grey image busy on the left half, flat on the right
		const w = 64;
		const grey = Uint8Array.from({ length: w * w }, (_, i) => ((i % w) < w / 2 ? ((i * 37) % 255) : 128));
		const [first, second] = quietCrops(grey, w, w);
		assert.ok(first.x > 0.5 && second.x > 0.5, 'both on the flat half');
		assert.ok(Math.hypot(first.x - second.x, first.y - second.y) > 0.1, 'apart');
		const href = 'data:image/svg+xml;base64,' + Buffer.from(ART).toString('base64');
		remember(href, [first, second]);
		const [a, b] = resolveLabels('auto', '', href);
		assert.deepEqual(a.crop, first);
		assert.deepEqual(b.crop, second);
		assert.notDeepEqual(resolveLabels('auto', '', ART)[0].crop, first, 'unmeasured art keeps the fixed crops');
	});

	it('lowers the grain by default', () => {
		assert.match(vinyl({ art: ART }).svg, /-grain\d+\)" opacity="0\.008"/);
	});
});

