/**
 * @logomarks/mockups — the print-studio scenes without a GPU: binders, the
 * book and slipcase, the stationery flat lay, the menu and the receipt.
 * Their layouts, composed prints and options; three.js only on use.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reader } from '../src/util/reader.js';
import { brandOf, inkOn } from '../src/util/brand.js';
import { coverSvg, spineSvg, volume } from '../src/parts/cover.js';
import { binderScene, binderRow, edgeSvg, BINDER } from '../src/three/binder.js';
import { bookScene, slipcaseSvg, BOOK, BOOK_LAYOUT } from '../src/three/book.js';
import { stationeryScene, stationeryGrid, PIECES } from '../src/three/stationery.js';
import { letterSvg, cardFrontSvg, cardBackSvg, envelopeSvg, domainOf, paperInk, CONTACT } from '../src/parts/stationery.js';
import { menuScene, zigzag, MENU_LAYOUTS } from '../src/three/menu.js';
import { menuCardSvg, menuSpreadSvg, resolveSections, splitSections, priceText, MENU_SECTIONS, MENU_SIZES } from '../src/parts/menu.js';
import { receiptScene, curlPoint, CURL } from '../src/three/receipt.js';
import { receiptSvg, receiptTotals, resolveItems, barcodeBars, receiptLength, RECEIPT } from '../src/parts/receipt.js';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10"/></svg>';
const brand = (o = {}) => brandOf(reader('t', { art: MARK, ...o }), { color: '#1f5c4c' });
const size = (svg) => svg.match(/^<svg[^>]*width="([\d.]+)" height="([\d.]+)"/).slice(1).map(Number);
const canvas = /** @type {any} */ ({ width: 10, height: 10 });

describe('print studio scenes', () => {
	it('import three.js only when a scene is made', async () => {
		for (const f of ['binder', 'book', 'stationery', 'menu', 'receipt']) {
			const src = await readFile(new URL(`../src/three/${f}.js`, import.meta.url), 'utf8');
			assert.doesNotMatch(src, /^import .* from 'three/m, `${f}.js imports three statically`);
		}
	});

	it('refuse bad options before drawing anything', async () => {
		for (const scene of [binderScene, bookScene, stationeryScene, menuScene, receiptScene]) {
			await assert.rejects(scene(canvas, /** @type {any} */ ({})), /art is required/);
			await assert.rejects(scene(canvas, /** @type {any} */ ({ art: MARK, color: 'green' })), /color is a hex colour/);
		}
		await assert.rejects(binderScene(canvas, /** @type {any} */ ({ art: MARK, ground: 'blue' })), /ground/);
		await assert.rejects(bookScene(canvas, /** @type {any} */ ({ art: MARK, tint: 1 })), /tint/);
		await assert.rejects(menuScene(canvas, /** @type {any} */ ({ art: MARK, layout: 'scroll' })), /layout is 'card' or 'folded'/);
		await assert.rejects(menuScene(canvas, /** @type {any} */ ({ art: MARK, sections: [{ title: 'x' }] })), /sections/);
		await assert.rejects(receiptScene(canvas, /** @type {any} */ ({ art: MARK, items: [{ name: 'x' }] })), /items/);
		assert.deepEqual(MENU_LAYOUTS, ['card', 'folded']);
	});
});

describe('brand', () => {
	it('reads the name, colour, ink and paper, the ink reading on the colour', () => {
		const b = brand({ name: 'Covehaus' });
		assert.equal(b.name, 'Covehaus');
		assert.equal(b.color, '#1f5c4c');
		assert.equal(b.ink, inkOn('#1f5c4c'));
		assert.equal(inkOn('#f4f1ea'), '#161616');
		assert.equal(inkOn('#111111'), '#f6f3ec');
		assert.equal(brand({ ink: '#ff0000' }).ink, '#ff0000');
		assert.throws(() => brand({ name: 3 }), /name is a string/);
	});
});

describe('binders', () => {
	it('stand in an even row centred on the origin', () => {
		const row = binderRow(4);
		assert.equal(row.length, 4);
		assert.ok(Math.abs(row[0] + row[3]) < 1e-9);
		assert.ok(Math.abs(row[1] - row[0] - (BINDER.thickness + 2)) < 1e-9);
	});

	it('compose a cover and spine at their size, the same each time', () => {
		const b = brand({ name: 'Gecko' });
		const cover = coverSvg(b, { size: [BINDER.width, BINDER.height], title: 'Brand book', volume: 3, px: 4 });
		assert.deepEqual(size(cover), [BINDER.width * 4, BINDER.height * 4]);
		assert.match(cover, />Gecko</);
		assert.match(cover, />Vol\. 03</);
		assert.match(cover, />Brand book</);
		assert.equal(coverSvg(b, { size: [BINDER.width, BINDER.height], title: 'Brand book', volume: 3, px: 4 }), cover);
		const spine = spineSvg(b, { size: [BINDER.thickness, BINDER.height], volume: 2 });
		assert.match(spine, /rotate\(90\)/);
		assert.match(spine, /Vol\. 02/);
		assert.equal(volume(12), '12');
		assert.match(edgeSvg('#e2552c'), /#e2552c/);
	});
});

describe('book and slipcase', () => {
	it('lie apart, the case printed with the lockup in white', () => {
		assert.ok(BOOK_LAYOUT.slipcase.x - BOOK_LAYOUT.book.x > BOOK.width);
		const svg = slipcaseSvg(brand({ name: 'Covehaus' }), [180, 250]);
		assert.deepEqual(size(svg), [180 * 8, 250 * 8]);
		assert.match(svg, /fill="#ffffff"[^>]*>Covehaus</);
	});
});

describe('stationery', () => {
	it('lays the pieces in a grid without overlaps, with even gutters', () => {
		const grid = stationeryGrid(24);
		const box = (p) => ({ x0: p.x - PIECES[p.piece].width / 2, x1: p.x + PIECES[p.piece].width / 2, z0: p.z - PIECES[p.piece].height / 2, z1: p.z + PIECES[p.piece].height / 2 });
		const boxes = grid.map(box);
		for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
			const a = boxes[i];
			const b = boxes[j];
			assert.ok(a.x1 <= b.x0 || b.x1 <= a.x0 || a.z1 <= b.z0 || b.z1 <= a.z0, `${grid[i].piece} overlaps ${grid[j].piece}`);
		}
		const [letter, envelope, front] = boxes;
		assert.ok(Math.abs(envelope.x0 - letter.x1 - 24) < 1e-9);
		assert.ok(Math.abs(front.z0 - envelope.z1 - 24) < 1e-9);
		assert.ok(Math.abs(Math.min(...boxes.map((b) => b.x0)) + Math.max(...boxes.map((b) => b.x1))) < 1e-9, 'centred');
	});

	it('composes each print from the brand', () => {
		const b = brand({ name: 'Rail Kin' });
		assert.equal(domainOf('Rail Kin'), 'railkin.com');
		assert.equal(domainOf(''), '');
		assert.equal(paperInk(b), '#1f5c4c');
		assert.equal(paperInk(brand({ color: '#f0e68c' })), '#161616');
		assert.deepEqual(size(letterSvg(b)), [210 * 6, 297 * 6]);
		assert.match(letterSvg(b), new RegExp(CONTACT.street));
		assert.match(letterSvg(b), /railkin\.com/);
		assert.match(cardFrontSvg(b), /fill="#1f5c4c"/);
		assert.match(cardBackSvg(b), new RegExp(CONTACT.person));
		assert.deepEqual(size(envelopeSvg(b)), [220 * 6, 110 * 6]);
	});
});

describe('menu', () => {
	it('checks courses, and shares them between columns by length', () => {
		assert.equal(resolveSections(undefined), MENU_SECTIONS);
		assert.throws(() => resolveSections([]), /sections/);
		assert.throws(() => resolveSections([{ title: 'A', items: [{ name: 1 }] }]), /sections/);
		const cols = splitSections(resolveSections(undefined), 2);
		assert.equal(cols.flat().length, MENU_SECTIONS.length);
		assert.deepEqual(cols.map((c) => c.map((s) => s.title)), [['To start', 'Mains'], ['To finish', 'To drink']]);
		assert.deepEqual(splitSections([{ title: 'Only', items: [] }], 3).map((c) => c.length), [1, 0, 0]);
		assert.equal(priceText(9), '9');
		assert.equal(priceText(4.5), '4.50');
		assert.equal(priceText('MP'), 'MP');
		assert.equal(priceText(undefined), '');
	});

	it('composes a card and a tri-fold spread with every dish, the same each time', () => {
		const b = brand({ name: 'Covehaus' });
		const card = menuCardSvg(b);
		assert.deepEqual(size(card), MENU_SIZES.card.map((v) => v * 5));
		for (const d of MENU_SECTIONS.flatMap((s) => s.items)) assert.ok(card.includes(`>${d.name.replace(/&/g, '&amp;')}<`), d.name);
		assert.equal(menuCardSvg(b), card);
		const own = menuSpreadSvg(b, { sections: [{ title: 'Bar', items: [{ name: 'Negroni', price: 10.5 }] }] });
		assert.deepEqual(size(own), [MENU_SIZES.panel[0] * 3 * 6, MENU_SIZES.panel[1] * 6]);
		assert.match(own, />Negroni</);
		assert.match(own, />10\.50</);
		assert.match(own, />MENU</);
	});

	it('stands a tri-fold in a zigzag whose panels meet at their folds', () => {
		const P = MENU_SIZES.panel[0];
		const z = zigzag();
		const end = (p, s) => [p.x + (s * P * Math.cos((p.turn * Math.PI) / 180)) / 2, p.z + (s * P * Math.sin((p.turn * Math.PI) / 180)) / 2];
		for (let i = 0; i < 2; i++) {
			const [ax, az] = end(z[i], 1);
			const [bx, bz] = end(z[i + 1], -1);
			assert.ok(Math.hypot(ax - bx, az - bz) < 1e-9, `fold ${i}`);
		}
		assert.ok(Math.abs(end(z[0], -1)[0] + end(z[2], 1)[0]) < 1e-9, 'centred');
		assert.deepEqual(z.map((p) => Math.sign(p.turn)), [1, -1, 1]);
	});
});

describe('receipt', () => {
	it('sums the bill to the penny', () => {
		const t = receiptTotals(resolveItems(undefined));
		assert.equal(t.subtotal, 95);
		assert.equal(t.service, 11.88);
		assert.equal(t.total, 106.88);
		assert.deepEqual(receiptTotals([{ name: 'a', price: 0.1, qty: 3 }], 0), { subtotal: 0.3, service: 0, total: 0.3 });
		assert.throws(() => resolveItems([{ name: 'x', price: 1, qty: 0 }]), /items/);
	});

	it('prints the brand, the items and the total, its barcode seeded', () => {
		const b = brand({ name: 'Gecko' });
		const svg = receiptSvg(b, { seed: 's' });
		assert.deepEqual(size(svg), [RECEIPT.width * 10, receiptLength(6, true) * 10]);
		assert.match(svg, />Gecko</);
		assert.match(svg, />£106\.88</);
		assert.match(svg, />gecko\.com</);
		assert.equal(receiptSvg(b, { seed: 's' }), svg);
		assert.notEqual(receiptSvg(b, { seed: 't' }), svg);
		assert.match(receiptSvg(b, { currency: '€' }), />€95\.00</);
		assert.deepEqual(barcodeBars('a'), barcodeBars('a'));
		assert.notDeepEqual(barcodeBars('a'), barcodeBars('b'));
	});

	it('lies flat in the middle, curls up at the far end and lifts at the near one', () => {
		const L = 180;
		assert.equal(curlPoint(0, L / 2, L)[1], 0);
		const far = curlPoint(0, L, L);
		assert.ok(far[1] > 10, 'the far end rolls up');
		assert.ok(far[2] > -L / 2, 'and comes back towards the camera as it rolls');
		assert.ok(curlPoint(0, 0, L)[1] > 0 && curlPoint(0, 0, L)[1] <= CURL.lift + 1e-9);
		assert.ok(curlPoint(RECEIPT.width / 2, L / 2, L)[1] > curlPoint(0, L / 2, L)[1], 'cupped across');
		// no jumps along it
		for (let s = 0; s < L; s += 0.5) {
			const a = curlPoint(0, s, L);
			const b = curlPoint(0, s + 0.5, L);
			assert.ok(Math.hypot(a[1] - b[1], a[2] - b[2]) < 0.7, `smooth at ${s}`);
		}
	});
});
