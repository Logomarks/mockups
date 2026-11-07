/**
 * @logomarks/mockups — plate surfaces and finishes: round signs, cylinders,
 * cloth, deboss, emboss, engrave and foil, and the halftone print.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { plate, checkPlate, PLATE_FINISHES, PLATE_METALS, SCREEN_SHAPES, cylinderMap, halftonePrint } from '../src/index.js';
import { outline, inPolygon, cylinderCorners, cylinderAspect, spread, shortSide } from '../src/plates/surface.js';
import { resolveFinish } from '../src/plates/finish.js';
import { makePlate } from '../src/plates/extract.js';
import { renderImage } from '../src/render/node.js';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="2" y="2" width="6" height="6" fill="#000"/></svg>';
const QUAD = /** @type {[number, number][]} */ ([[100, 60], [300, 60], [300, 260], [100, 260]]);
const CUP = { top: [200, 80, 90, 10], bottom: [200, 240, 80, 14], span: 150 };

/** A flat grey photo, as an SVG data URL. */
const PHOTO = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="320"><rect width="400" height="320" fill="#777"/><rect x="100" y="60" width="200" height="200" fill="#eee"/></svg>').toString('base64');

/**
 * A hand-made plate with one screen.
 *
 * @param {Record<string, unknown>} screen The screen's fields beyond the defaults.
 * @returns {import('../src/plates/format.js').Plate} The plate.
 */
const handmade = (screen) => ({ name: 'surface', width: 400, height: 320, photo: PHOTO, screens: [{ kind: 'print', corners: QUAD, aspect: 1, box: [97, 57, 206, 206], ...screen }] });

/**
 * The mean brightness of a region of a PNG.
 *
 * @param {Buffer} png The image.
 * @param {[number, number, number, number]} r The region: left, top, width, height.
 * @returns {Promise<number>} 0–255.
 */
async function mean(png, [left, top, width, height]) {
	const px = await sharp(png).extract({ left, top, width, height }).greyscale().raw().toBuffer();
	return px.reduce((a, v) => a + v, 0) / px.length;
}

describe('plates: surfaces', () => {
	it('names its shapes and finishes', () => {
		assert.deepEqual(SCREEN_SHAPES, ['quad', 'ellipse']);
		assert.deepEqual(PLATE_FINISHES, ['ink', 'deboss', 'emboss', 'engrave', 'foil']);
		assert.ok(PLATE_METALS.gold.length === 4);
	});

	it('outlines a round sign inside its corners', () => {
		const o = outline({ corners: QUAD, shape: 'ellipse' });
		assert.ok(o.length > 40);
		assert.ok(o.every(([x, y]) => x >= 99.9 && x <= 300.1 && y >= 59.9 && y <= 260.1));
		assert.ok(inPolygon(o, 200, 160));
		assert.ok(!inPolygon(o, 105, 65), 'the corner is outside the ellipse');
	});

	it('wraps a cylinder: its corners, its centre line and its aspect', () => {
		const [tl, tr, br, bl] = cylinderCorners(CUP);
		assert.ok(tl[0] < 200 && tr[0] > 200 && Math.abs(tl[1] - tr[1]) < 1e-9);
		assert.ok(bl[1] > tl[1] && br[1] > tr[1]);
		const map = cylinderMap(CUP, 100, 50);
		const [x, y] = map(50, 0);
		assert.equal(x, 200);
		assert.equal(y, 90, 'the front of the top edge sags by its ry');
		// the art bunches up towards the sides
		assert.ok(map(10, 0)[0] - map(0, 0)[0] < map(55, 0)[0] - map(45, 0)[0]);
		assert.ok(cylinderAspect(CUP) > 1);
		assert.ok(outline({ corners: [tl, tr, br, bl], cylinder: CUP }).length > 90);
	});

	it('grows a polygon and measures a short side', () => {
		const g = spread(QUAD, 10);
		assert.ok(g[0][0] < 100 && g[0][1] < 60);
		assert.equal(shortSide(QUAD), 200);
	});

	it('checks the new fields', () => {
		assert.doesNotThrow(() => checkPlate(handmade({ shape: 'ellipse', light: 200, displace: 4, finish: { type: 'deboss', depth: 0.4 } })));
		assert.doesNotThrow(() => checkPlate(handmade({ kind: 'fabric' })));
		assert.throws(() => checkPlate(handmade({ shape: 'star' })), /shape/);
		assert.throws(() => checkPlate(handmade({ cylinder: { top: [1, 2, 3] } })), /cylinder/);
		assert.throws(() => checkPlate(handmade({ finish: 'glitter' })), /finish/);
		assert.throws(() => checkPlate(handmade({ finish: { type: 'deboss', depth: 2 } })), /depth/);
		assert.throws(() => checkPlate(handmade({ displace: -1 })), /displace/);
	});
});

describe('plates: finishes', () => {
	it('fills each finish in from its defaults', () => {
		assert.deepEqual(resolveFinish(undefined), { type: 'ink', depth: 0, edge: 0, tone: 0, ink: true, color: undefined, metal: 'gold' });
		assert.equal(resolveFinish('deboss').ink, false);
		assert.equal(resolveFinish('engrave').ink, true);
		assert.equal(resolveFinish({ type: 'foil', metal: '#a0a0a0' }).metal, '#a0a0a0');
		assert.throws(() => resolveFinish({ type: 'foil', metal: 'tin' }), /metal/);
		assert.throws(() => resolveFinish({ type: 'engrave', color: 'brown' }), /color/);
	});

	it('lights a deboss from the screen\'s light, and leaves the art\'s ink out', () => {
		const { svg } = plate(handmade({ light: 180 }), { art: MARK, finish: 'deboss' });
		assert.match(svg, /feDiffuseLighting/);
		assert.match(svg, /azimuth="0"/, 'a deboss is lit from the far side');
		assert.match(svg, /mix-blend-mode:hard-light/);
		const emboss = plate(handmade({ light: 180 }), { art: MARK, finish: 'emboss' }).svg;
		assert.match(emboss, /azimuth="180"/);
	});

	it('colours an engraving and fills foil with metal', () => {
		const engrave = plate(handmade({}), { art: MARK, finish: { type: 'engrave', color: '#3b2410' } }).svg;
		assert.match(engrave, /feColorMatrix[^>]*values="0 0 0 0 0.231/);
		const foil = plate(handmade({}), { art: MARK, finish: { type: 'foil', metal: 'gold' } }).svg;
		assert.match(foil, /linearGradient/);
		assert.match(foil, new RegExp(PLATE_METALS.gold[3]));
	});

	it('takes a finish per screen from the options, over the plate\'s', () => {
		const { svg } = plate(handmade({ finish: 'deboss' }), { art: MARK, finish: 'ink' });
		assert.doesNotMatch(svg, /feDiffuseLighting/);
	});

	it('renders a deboss that darkens one inner edge and lightens the other', async () => {
		const png = await renderImage(plate(handmade({ light: 180 }), { art: MARK, finish: { type: 'deboss', depth: 1, edge: 0.02 } }), { format: 'png' });
		// the mark spans 140–260 across; light from the left: the left wall of the pressed square is in shadow
		const left = await mean(png, [140, 150, 8, 20]);
		const right = await mean(png, [252, 150, 8, 20]);
		assert.ok(left < right - 10, `left ${left} right ${right}`);
	});
});

describe('plates: round signs, cylinders and cloth', () => {
	it('clips round art to an ellipse', () => {
		const { svg } = plate(handmade({ shape: 'ellipse' }), { art: MARK });
		assert.match(svg, /<clipPath[^>]*><ellipse/);
	});

	it('displaces the art on cloth by the photo\'s folds', () => {
		const shading = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
		const { svg } = plate(handmade({ kind: 'fabric', shading }), { art: MARK });
		assert.match(svg, /feDisplacementMap/);
		assert.doesNotMatch(plate(handmade({ shading }), { art: MARK }).svg, /feDisplacementMap/);
	});

	it('makes and renders a cylinder plate', async () => {
		const photo = await sharp({ create: { width: 400, height: 320, channels: 3, background: '#d8c9a8' } }).png().toBuffer();
		const made = await makePlate(photo, { name: 'cup', screens: [{ kind: 'print', cylinder: CUP, occluders: false }] });
		const s = made.plate.screens[0];
		assert.deepEqual(s.cylinder, CUP);
		assert.ok(s.aspect > 1);
		assert.ok(s.box[3] > 160, 'the box takes in the bottom edge\'s sag');
		const inline = (f) => `data:image/jpeg;base64,${Buffer.from(made.files.get(f)).toString('base64')}`;
		const loaded = { ...made.plate, photo: inline(made.plate.photo), screens: [{ ...s, shading: inline(s.shading) }] };
		const png = await renderImage(plate(loaded, { art: MARK, fit: 'contain' }), { format: 'png' });
		assert.ok((await mean(png, [190, 150, 20, 20])) < 60, 'the mark lands in the middle of the band');
	});
});

describe('plates: no ground', () => {
	it('prints only where the art is, the photo round it', async () => {
		const white = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="3" y="3" width="4" height="4" fill="#fff"/></svg>';
		const dark = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="320"><rect width="400" height="320" fill="#222"/></svg>').toString('base64');
		const p = { ...handmade({}), photo: dark };
		assert.throws(() => plate(p, { art: white, background: 'chalk' }), /background/);
		assert.doesNotThrow(() => checkPlate(handmade({ background: 'none' })));
		const png = await renderImage(plate(p, { art: white, background: 'none' }), { format: 'png' });
		assert.ok((await mean(png, [190, 150, 20, 20])) > 200, 'the white ink shows');
		assert.ok((await mean(png, [110, 70, 20, 20])) < 50, 'round it, the dark photo');
	});
});

describe('plates: coloured stock', () => {
	it('keeps the stock as photographed with stock, and lifts its brightest to white without', async () => {
		const photo = await sharp({ create: { width: 400, height: 320, channels: 3, background: '#b08a5a' } }).png().toBuffer();
		const level = async (stock) => {
			const made = await makePlate(photo, { name: 'kraft', screens: [{ kind: 'print', corners: QUAD, occluders: false, stock }] });
			const px = await sharp(Buffer.from(made.files.get('shading.jpg'))).extract({ left: 90, top: 90, width: 10, height: 10 }).raw().toBuffer();
			return px[0];
		};
		assert.ok(Math.abs((await level(true)) - 0xb0) < 6, 'the stock is as photographed');
		assert.ok((await level(false)) > 245, 'its brightest taken for white');
	});
});

describe('plates: the halftone print', () => {
	it('prints art in one ink, solid in the middle, gone at the edges', async () => {
		const art = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#000"/></svg>';
		const svg = await halftonePrint(art, { sharp, width: 200, height: 200, ink: '#cc0000', start: 0.3, end: 0.9, cell: 8 });
		const png = await sharp(Buffer.from(svg)).png().toBuffer();
		const px = async (x, y) => [...(await sharp(png).extract({ left: x, top: y, width: 1, height: 1 }).ensureAlpha().raw().toBuffer())];
		const centre = await px(100, 100);
		assert.ok(centre[3] > 240 && centre[0] > 180 && centre[1] < 40, `the centre is the ink: ${centre}`);
		assert.ok((await px(100, 1))[3] < 20, 'the edge has faded out');
	});

	it('refuses a bad ink or fade', async () => {
		await assert.rejects(() => halftonePrint(MARK, { ink: 'red' }), /ink/);
		await assert.rejects(() => halftonePrint(MARK, { start: 0.9, end: 0.2 }), /start/);
	});
});
