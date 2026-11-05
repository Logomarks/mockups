/**
 * @arraypress/mockups — photo plates: the quad map, finding a blank sign and
 * its proportions, the maps cut from it, the format, the compositor, and a
 * plate made, saved, loaded and rendered.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { plate, checkPlate, PLATE_KINDS, quadMap } from '../src/plates/index.js';
import { homography, quadBox, inQuad } from '../src/plates/quad.js';
import { findSigns, quadAspect } from '../src/plates/detect.js';
import { signMaps } from '../src/plates/maps.js';
import { makePlate, savePlate } from '../src/plates/extract.js';
import { loadPlate } from '../src/plates/node.js';
import { renderImage } from '../src/render/node.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 10"><rect width="30" height="10" fill="#c0392b"/></svg>';
const SIGN = /** @type {[number, number][]} */ ([[120, 80], [520, 110], [515, 300], [125, 320]]);

/**
 * A photo as pixels: a dim, noisy ground, a blank sign lit brighter on the left, and a dark post in front of it.
 *
 * @returns {import('../src/plates/detect.js').Pixels} The pixels.
 */
function photo() {
	const [width, height] = [640, 400];
	const data = new Uint8Array(width * height * 3);
	let seed = 7;
	const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 6;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 3;
			const sign = inQuad(SIGN, x + 0.5, y + 0.5);
			const post = x >= 300 && x < 312 && y > 150;
			const v = post ? 40 : sign ? 245 - (x - 120) * 0.12 : 90 + y * 0.05;
			for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, Math.round(v + noise() - (sign && !post && c === 2 ? 12 : 0))));
		}
	}
	return { data, width, height };
}

/**
 * A plate described by hand, its files given as inline SVG.
 *
 * @param {import('../src/plates/format.js').PlateKind} kind The screen's kind.
 * @returns {import('../src/plates/format.js').Plate} The plate.
 */
const handmade = (kind) => ({
	name: 'test',
	width: 640,
	height: 400,
	photo: 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#556"/></svg>').toString('base64'),
	screens: [{ kind, corners: SIGN, aspect: 2, box: quadBox(SIGN, 640, 400), shading: 'data:image/png;base64,AA==', mask: 'data:image/png;base64,AA==' }],
});

describe('plates: the quad', () => {
	it('carries the rectangle\'s corners onto the quadrilateral\'s', () => {
		const map = quadMap(SIGN, 300, 100);
		for (const [[x, y], p] of [[[0, 0], SIGN[0]], [[300, 0], SIGN[1]], [[300, 100], SIGN[2]], [[0, 100], SIGN[3]]]) {
			const q = map(x, y);
			assert.ok(Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6);
		}
	});

	it('is affine for a parallelogram, and boxes the quad inside the photo', () => {
		const h = homography([[0, 0], [10, 0], [12, 5], [2, 5]]);
		assert.equal(h[6], 0);
		assert.equal(h[7], 0);
		assert.deepEqual(quadBox([[-5, 2], [10, 2], [10, 8], [-5, 8]], 8, 20, 1), [0, 1, 8, 8]);
	});
});

describe('plates: finding the sign', () => {
	it('finds a blank sign\'s corners to within a pixel', () => {
		const [sign] = findSigns(photo());
		assert.ok(sign, 'a sign');
		sign.corners.forEach((p, k) => assert.ok(Math.hypot(p[0] - SIGN[k][0], p[1] - SIGN[k][1]) < 1.5, `corner ${k}: ${p}`));
	});

	it('recovers a rectangle\'s proportions from its perspective', () => {
		// a 3:1 board seen through a lens centred on a 1600 × 1200 photo: turned 35° (one vanishing point, so the lens is
		// assumed: 1600 px), then turned and tilted (two, so the lens is solved: 1100 px)
		const view = (f, turn, tilt) => ([x, y]) => {
			const [a, b] = [(turn * Math.PI) / 180, (tilt * Math.PI) / 180];
			const [X, Z0] = [x * Math.cos(a), x * Math.sin(a)];
			const [Y, Z] = [y * Math.cos(b) - Z0 * Math.sin(b), 12 + y * Math.sin(b) + Z0 * Math.cos(b)];
			return /** @type {[number, number]} */ ([800 + (f * X) / Z, 600 + (f * Y) / Z]);
		};
		const board = [[-3, -1.5], [3, -1.5], [3, 0.5], [-3, 0.5]];
		for (const [f, turn, tilt] of [[1600, 35, 0], [1100, 35, 20]]) {
			const a = quadAspect(board.map(view(f, turn, tilt)), 1600, 1200);
			assert.ok(Math.abs(a - 3) < 0.06, `${f} px, ${turn}°, ${tilt}°: ${a}`);
		}
		assert.ok(Math.abs(quadAspect([[0, 0], [300, 0], [300, 100], [0, 100]], 400, 300) - 3) < 1e-9);
	});
});

describe('plates: the maps', () => {
	it('shades from the sign\'s own light, finds what stands in front, and measures the grain', () => {
		const px = photo();
		const box = quadBox(SIGN, px.width, px.height, 3);
		const { shading, mask, noise, reflection } = signMaps(px, SIGN, box, 'print');
		const at = (x, y) => (y - box[1]) * box[2] + (x - box[0]);
		assert.ok(shading[at(140, 200) * 3] > shading[at(480, 200) * 3], 'brighter on the lit side');
		assert.ok(shading[at(140, 200) * 3 + 2] < shading[at(140, 200) * 3], 'keeps the light\'s colour cast');
		assert.ok(mask && mask[at(305, 250)] > 200 && mask[at(200, 200)] < 30, 'the post is in front');
		assert.ok(noise > 0.5 && noise < 4, `noise ${noise}`);
		assert.equal(reflection, null);
		assert.ok(signMaps(px, SIGN, box, 'glass').reflection);
	});

	it('leaves a given mask out of the measuring, adds it, and fills the light in under every occluder', () => {
		const px = photo();
		const box = quadBox(SIGN, px.width, px.height, 3);
		const at = (x, y) => (y - box[1]) * box[2] + (x - box[0]);
		// a skin-toned thumb on the sign, given as a mask
		for (let y = 180; y < 230; y++) for (let x = 200; x < 230; x++) px.data.set([200, 140, 110], (y * px.width + x) * 3);
		const given = new Uint8Array(box[2] * box[3]);
		for (let y = 180; y < 230; y++) for (let x = 200; x < 230; x++) given[at(x, y)] = 255;
		const { shading, mask, reflection } = signMaps(px, SIGN, box, 'print', { given });
		assert.ok(mask && mask[at(215, 205)] === 255 && mask[at(305, 250)] > 200, 'the thumb and the post');
		const thumb = shading.subarray(at(215, 205) * 3, at(215, 205) * 3 + 3);
		const round = shading.subarray(at(260, 205) * 3, at(260, 205) * 3 + 3);
		assert.ok(thumb.every((v, c) => Math.abs(v - round[c]) < 12), `the light carried under the thumb (${[...thumb]} by ${[...round]})`);
		assert.ok(shading[at(305, 250) * 3] > 200, 'and under the post');
		assert.equal(reflection, null, 'no glare found beside the thumb');
	});
});

describe('plates: the format', () => {
	it('fills in each kind\'s looks, and refuses a malformed plate', () => {
		assert.deepEqual(PLATE_KINDS, ['print', 'paint', 'backlit', 'glass']);
		assert.equal(checkPlate(handmade('backlit')).screens[0].glow, 0.45);
		assert.throws(() => checkPlate({ ...handmade('print'), screens: [{ ...handmade('print').screens[0], kind: /** @type {any} */ ('neon') }] }), /kind is one of/);
		assert.throws(() => checkPlate({ ...handmade('print'), screens: [{ ...handmade('print').screens[0], corners: /** @type {any} */ ([[0, 0]]) }] }), /four/);
		assert.throws(() => checkPlate(/** @type {any} */ ({ name: 'x' })), /width and height/);
	});
});

describe('plates: compositing', () => {
	it('multiplies print by its shading and puts the occluders back', () => {
		const m = plate(handmade('print'), { art: ART });
		assert.equal(m.object, 'plate');
		assert.equal(m.width, 640);
		assert.match(m.svg, /mix-blend-mode:multiply/);
		assert.match(m.svg, /<mask[^>]*-front\d+/);
		assert.doesNotMatch(m.svg, /mix-blend-mode:screen/);
	});

	it('glows round a lightbox, and refuses bad options', () => {
		assert.match(plate(handmade('backlit'), { art: ART }).svg, /mix-blend-mode:screen/);
		assert.doesNotMatch(plate(handmade('backlit'), { art: ART, glow: 0 }).svg, /mix-blend-mode:screen/);
		assert.throws(() => plate(handmade('print'), /** @type {any} */ ({})), /art is required/);
		assert.throws(() => plate(handmade('print'), { art: ART, background: 'red' }), /hex/);
	});

	it('lifts print\'s blacks to ink\'s density before the light falls on it', () => {
		assert.match(plate(handmade('print'), { art: ART }).svg, /fill="#ffffff" opacity="0.04"/);
		assert.doesNotMatch(plate({ ...handmade('print'), screens: [{ ...handmade('print').screens[0], black: 0 }] }, { art: ART }).svg, /fill="#ffffff" opacity="0.04"/);
	});

	it('adds a hand-painted occluder mask to what it finds', async () => {
		const px = photo();
		const jpeg = await sharp(Buffer.from(px.data), { raw: { width: px.width, height: px.height, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
		const hand = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400"/><rect x="400" y="150" width="20" height="20" fill="#fff"/></svg>')).png().toBuffer();
		const made = await makePlate(jpeg, { name: 'hand', screens: [{ kind: 'print', mask: hand }] });
		const [s] = made.plate.screens;
		const { data, info } = await sharp(made.files.get(/** @type {string} */ (s.mask))).greyscale().raw().toBuffer({ resolveWithObject: true });
		const at = (x, y) => data[(y - s.box[1]) * info.width + (x - s.box[0])];
		assert.ok(at(410, 160) > 200, 'the painted square');
		assert.ok(at(305, 250) > 200, 'the post it found');
		assert.ok(at(200, 200) < 30, 'clear elsewhere');
	});

	it('makes a WebP plate (masks lossless) that loads and renders the same', async () => {
		const px = photo();
		const jpeg = await sharp(Buffer.from(px.data), { raw: { width: px.width, height: px.height, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
		const made = await makePlate(jpeg, { name: 'webp', kind: 'print', format: 'webp' });
		assert.deepEqual([...made.files.keys()].sort(), ['mask.webp', 'photo.webp', 'shading.webp']);
		assert.equal(made.plate.photo, 'photo.webp');
		assert.equal((await sharp(made.files.get('mask.webp')).metadata()).format, 'webp');
		const dir = await mkdtemp(join(tmpdir(), 'plates-'));
		try {
			await savePlate(dir, made);
			const loaded = await loadPlate(dir);
			assert.match(loaded.photo, /^data:image\/webp;base64,/);
			const { data } = await sharp(await renderImage(plate(loaded, { art: ART }))).removeAlpha().raw().toBuffer({ resolveWithObject: true });
			const rgb = (x, y) => [...data.subarray((y * 640 + x) * 3, (y * 640 + x) * 3 + 3)];
			assert.ok(rgb(200, 200)[0] > 150 && rgb(200, 200)[1] < 90, `the art is on the sign: ${rgb(200, 200)}`);
			assert.ok(rgb(305, 250).every((v) => v < 80), `the post stays in front: ${rgb(305, 250)}`);
			assert.ok(Math.abs(rgb(40, 40)[0] - 92) < 12, `the photo is drawn round it: ${rgb(40, 40)}`);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
		await assert.rejects(makePlate(jpeg, { name: 'x', format: /** @type {any} */ ('png') }), /format is 'jpeg' or 'webp'/);
	});

	it('makes, saves, loads and renders a plate', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'plates-'));
		try {
			const px = photo();
			const jpeg = await sharp(Buffer.from(px.data), { raw: { width: px.width, height: px.height, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
			const made = await makePlate(jpeg, { name: 'synthetic', kind: 'print', source: { licence: 'CC0-1.0' } });
			const [s] = made.plate.screens;
			assert.ok(s.mask, 'found the post');
			assert.deepEqual([...made.files.keys()].sort(), ['mask.png', 'photo.jpg', 'shading.jpg']);
			await savePlate(dir, made);
			const loaded = await loadPlate(dir);
			assert.match(loaded.photo, /^data:image\/jpeg;base64,/);
			assert.match(/** @type {string} */ (loaded.screens[0].shading), /^data:image\/jpeg;base64,/);
			const { data, info } = await sharp(await renderImage(plate(loaded, { art: ART }))).removeAlpha().raw().toBuffer({ resolveWithObject: true });
			assert.equal(info.width, 640);
			const rgb = (x, y) => [...data.subarray((y * 640 + x) * 3, (y * 640 + x) * 3 + 3)];
			const [r, g] = rgb(200, 200);
			assert.ok(r > 150 && g < 90, `the art is on the sign: ${rgb(200, 200)}`);
			assert.ok(rgb(305, 250).every((v) => v < 80), `the post stays in front: ${rgb(305, 250)}`);
			assert.ok(Math.abs(rgb(40, 40)[0] - 92) < 12, `the photo is untouched round it: ${rgb(40, 40)}`);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
