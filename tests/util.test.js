/**
 * @arraypress/mockups — the shared pieces: numbers, colour, seeded
 * randomness, SVG markup, art input, the PNG encoder and the grain.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { n, clamp, lerp } from '../src/util/num.js';
import { rgb, hex, mix, multiply, luma, isHex } from '../src/util/color.js';
import { rng, hash } from '../src/util/rng.js';
import { resolveSize } from '../src/util/size.js';
import { el, esc, circlePath } from '../src/render/svg.js';
import { artHref, sniff } from '../src/render/art.js';
import { encodePng, crc32 } from '../src/render/png.js';
import { grainTile } from '../src/materials/grain.js';

describe('numbers', () => {
	it('writes numbers compactly', () => {
		assert.equal(n(1.23456), '1.235');
		assert.equal(n(-0.0001), '0');
		assert.equal(n(2), '2');
		assert.equal(clamp(2), 1);
		assert.equal(clamp(-5, -1, 1), -1);
		assert.equal(lerp(0, 10, 0.25), 2.5);
	});

	it('reads sizes', () => {
		assert.deepEqual(resolveSize(undefined), { width: 1600, height: 1600 });
		assert.deepEqual(resolveSize({ width: 1200.4, height: 630 }), { width: 1200, height: 630 });
		assert.throws(() => resolveSize(9000), /size/);
	});
});

describe('colour', () => {
	it('parses and writes hex', () => {
		assert.deepEqual(rgb('#f80'), [255, 136, 0]);
		assert.equal(hex([255, 136, 0]), '#ff8800');
		assert.throws(() => rgb('red'), TypeError);
		assert.equal(isHex('#abc'), true);
		assert.equal(isHex('abc'), false);
	});

	it('mixes, multiplies and weighs colours', () => {
		assert.equal(mix('#000000', '#ffffff', 0.5), '#808080');
		assert.equal(multiply('#ffffff', '#336699'), '#336699');
		assert.equal(multiply('#808080', '#ff0000'), '#800000');
		assert.ok(Math.abs(luma('#ffffff') - 1) < 1e-9);
		assert.equal(luma('#000000'), 0);
	});
});

describe('randomness', () => {
	it('is seeded', () => {
		const a = rng('s');
		const b = rng('s');
		const xs = Array.from({ length: 5 }, () => a.next());
		assert.deepEqual(xs, Array.from({ length: 5 }, () => b.next()));
		for (const x of xs) assert.ok(x >= 0 && x < 1);
		assert.notEqual(hash('a'), hash('b'));
		const r = rng('t').range(5, 6);
		assert.ok(r >= 5 && r < 6);
	});
});

describe('svg', () => {
	it('writes elements, leaving empty attributes out', () => {
		assert.equal(el('circle', { r: 1.23456, fill: 'red', stroke: null, opacity: false }), '<circle r="1.235" fill="red"/>');
		assert.equal(el('g', {}, el('rect'), false, ''), '<g><rect/></g>');
		assert.equal(esc(`a<b & "c"`), 'a&lt;b &amp; &quot;c&quot;');
		assert.equal(circlePath(0, 0, 1), 'M-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0z');
	});
});

describe('art', () => {
	it('sniffs image types', () => {
		assert.equal(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0])), 'image/png');
		assert.equal(sniff(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
		assert.equal(sniff(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ')), 'image/webp');
		assert.equal(sniff(new TextEncoder().encode('\0\0\0\x1cftypavif')), 'image/avif');
		assert.equal(sniff(new TextEncoder().encode('<?xml version="1.0"?><svg/>')), 'image/svg+xml');
		assert.equal(sniff(new Uint8Array([1, 2, 3])), null);
	});

	it('turns bytes and markup into data: URIs and keeps URLs', () => {
		assert.match(artHref(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), /^data:image\/jpeg;base64,\/9j\/4A==$/);
		assert.match(artHref('<svg/>'), /^data:image\/svg\+xml;base64,/);
		assert.equal(artHref('https://example.com/a.png'), 'https://example.com/a.png');
		assert.equal(artHref(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer).slice(0, 22), 'data:image/png;base64,');
		assert.throws(() => artHref(''), /empty/);
	});
});

describe('png', () => {
	it('computes CRC-32', () => {
		assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
	});

	it('encodes a grey-and-alpha image sharp can read', async (t) => {
		const sharp = await import('sharp').then((m) => m.default, () => null);
		if (!sharp) return t.skip('sharp is not installed');
		const px = new Uint8Array(3 * 2 * 2).fill(200);
		const meta = await sharp(encodePng(3, 2, px)).metadata();
		assert.equal(meta.width, 3);
		assert.equal(meta.height, 2);
		assert.equal(meta.channels, 2);
		const tile = grainTile('g');
		assert.match(tile, /^data:image\/png;base64,/);
		assert.equal(grainTile('g'), tile, 'made once per seed');
	});
});
