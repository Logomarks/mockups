/**
 * @arraypress/mockups — rasterising with sharp: sizes, formats, and that
 * the picture is what was asked for (the ground's colour, clear vinyl a
 * shade under it, the ground through the spindle hole).
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { vinyl, renderImage, loadArt } from '../src/render/node.js';

/** @type {typeof import('sharp') | null} */
let sharp = null;
before(async () => {
	sharp = await import('sharp').then((m) => m.default, () => null);
});

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#20304a"/></svg>';

/**
 * One pixel of an image.
 *
 * @param {Buffer} png The image.
 * @param {number} x Across.
 * @param {number} y Down.
 * @returns {Promise<number[]>} Its channels.
 */
async function pixel(png, x, y) {
	const { data, info } = await /** @type {typeof import('sharp')} */ (sharp)(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	const i = (y * info.width + x) * info.channels;
	return [...data.subarray(i, i + 3)];
}

describe('renderImage', () => {
	it('rasterises a mockup at its size, as PNG, WebP or JPEG', async (t) => {
		if (!sharp) return t.skip('sharp is not installed');
		const m = vinyl({ art: ART, size: 400, grain: 0 });
		const png = await renderImage(m);
		assert.deepEqual([...png.subarray(1, 4)].map((c) => String.fromCharCode(c)).join(''), 'PNG');
		const meta = await sharp(png).metadata();
		assert.equal(meta.width, 400);
		assert.equal(meta.height, 400);
		const webp = await renderImage(m.svg, { format: 'webp', width: 200 });
		assert.equal((await sharp(webp).metadata()).width, 200);
		assert.equal((await sharp(await renderImage(m, { format: 'jpeg' })).metadata()).format, 'jpeg');
		await assert.rejects(renderImage(m, { format: /** @type {any} */ ('bmp') }), /format/);
	});

	it('draws the ground, clear vinyl a shade under it, and the ground through the hole', async (t) => {
		if (!sharp) return t.skip('sharp is not installed');
		const png = await renderImage(vinyl({ art: ART, size: 1000, grain: 0 }));
		assert.deepEqual(await pixel(png, 10, 10), [230, 230, 230]);
		// the left record's body, between its label and its rim (as the reference photo: ~218 on 230)
		const [body] = await pixel(png, 150, 500);
		assert.ok(body >= 212 && body <= 226, `clear vinyl at ${body}`);
		// the spindle hole of the left record shows the true ground (its own shadow is cut out of it)
		const svg = vinyl({ art: ART, size: 1000, grain: 0 }).svg;
		const cx = Number(/translate\(([\d.]+) 500\)/.exec(svg)?.[1]);
		const [hole] = await pixel(png, Math.round(cx), 500);
		assert.ok(hole >= 228, `hole at ${hole}`);
	});
});

describe('loadArt', () => {
	it('scales raster art down and keeps SVG as SVG', async (t) => {
		if (!sharp) return t.skip('sharp is not installed');
		const big = await sharp({ create: { width: 900, height: 600, channels: 3, background: '#f00' } }).png().toBuffer();
		const uri = await loadArt(big, { size: 300 });
		assert.match(uri, /^data:image\/jpeg;base64,/);
		const meta = await sharp(Buffer.from(uri.split(',')[1], 'base64')).metadata();
		assert.equal(meta.width, 300);
		assert.equal(meta.height, 200);
		assert.match(await loadArt(ART), /^data:image\/svg\+xml;base64,/);
		const alpha = await sharp({ create: { width: 10, height: 10, channels: 4, background: '#f000' } }).png().toBuffer();
		assert.match(await loadArt(alpha), /^data:image\/png;base64,/);
	});
});

describe('render: SVG art under a rotation', () => {
	it('draws turned SVG art in its box (librsvg alone stretches it), as a raster', async (t) => {
		const sharp = await import('sharp').then((m) => m.default, () => null);
		if (!sharp) return t.skip('sharp is not installed');
		const { renderImage } = await import('../src/render/node.js');
		const { flattenSvgImages } = await import('../src/render/flatten.js');
		// white, a blue band along its top tenth
		const art = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 1"><rect width="3" height="1" fill="#fff"/><rect width="3" height="0.1" fill="#00f"/></svg>';
		const href = `data:image/svg+xml;base64,${Buffer.from(art).toString('base64')}`;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><g transform="translate(200 200) rotate(8)"><image x="-150" y="-50" width="300" height="100" preserveAspectRatio="xMidYMid slice" href="${href}"/></g></svg>`;
		const flat = await flattenSvgImages(svg, sharp);
		assert.doesNotMatch(flat, /data:image\/svg\+xml/);
		assert.match(flat, /data:image\/jpeg;base64,/);
		// the band, 45 units above the middle along the turned box
		const { data, info } = await sharp(await renderImage(svg)).raw().toBuffer({ resolveWithObject: true });
		const [x, y] = [Math.round(200 + 45 * Math.sin(Math.PI / 22.5)), Math.round(200 - 45 * Math.cos(Math.PI / 22.5))];
		const at = (y * 400 + x) * info.channels;
		assert.ok(data[at + 2] > 200 && data[at] < 80, `blue at the band (${[...data.subarray(at, at + 3)]})`);
	});
});

describe('render: WebP and AVIF images', () => {
	it('draws a WebP image (librsvg alone leaves it blank), re-encoded as JPEG or PNG', async (t) => {
		const sharp = await import('sharp').then((m) => m.default, () => null);
		if (!sharp) return t.skip('sharp is not installed');
		const { renderImage } = await import('../src/render/node.js');
		const { transcodeImages } = await import('../src/render/transcode.js');
		const red = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#ff0000' } }).webp({ quality: 90 }).toBuffer();
		const clear = await sharp({ create: { width: 40, height: 40, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 0.5 } } }).webp({ lossless: true }).toBuffer();
		const img = (b, x) => `<image x="${x}" width="40" height="40" href="data:image/webp;base64,${b.toString('base64')}"/>`;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="#0000ff"/>${img(red, 0)}${img(clear, 40)}</svg>`;
		const out = await transcodeImages(svg, sharp);
		assert.doesNotMatch(out, /data:image\/webp/);
		assert.match(out, /data:image\/jpeg;base64,[^"]+"\/><image x="40"[^>]*data:image\/png;base64,/);
		const { data, info } = await sharp(await renderImage(svg)).raw().toBuffer({ resolveWithObject: true });
		const px = (x) => [...data.subarray((20 * 80 + x) * info.channels, (20 * 80 + x) * info.channels + 3)];
		assert.ok(px(20)[0] > 230 && px(20)[2] < 30, `the WebP is drawn (${px(20)})`);
		assert.ok(px(60)[1] > 100 && px(60)[2] > 100, `its transparency is kept (${px(60)})`);
	});
});
