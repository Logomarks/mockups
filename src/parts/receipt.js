/**
 * @module @logomarks/mockups/parts/receipt
 *
 * A till receipt composed from the brand, as a thermal printer prints it:
 * the mark and name at the head in the printer's black, the address, the
 * table and time, the items with their quantities and prices, the
 * subtotal, service and total, the card line, a thank-you, and a barcode
 * at the foot. Monospaced, on 80 mm paper. The items are placeholders
 * unless the caller gives its own.
 */

import { scene } from '../render/scene.js';
import { el, esc } from '../render/svg.js';
import { rng } from '../util/rng.js';
import { lockup, lockupSize } from './lockup.js';
import { CONTACT, domainOf } from './stationery.js';

/** The receipt's width and its printed column, mm, and the thermal black. */
export const RECEIPT = Object.freeze({ width: 80, margin: 6, ink: '#232323' });

/** The placeholder items: a quantity, a name and a unit price. */
export const RECEIPT_ITEMS = Object.freeze([
	Object.freeze({ qty: 2, name: 'Sourdough', price: 5 }),
	Object.freeze({ qty: 1, name: 'Burrata', price: 11 }),
	Object.freeze({ qty: 1, name: 'Roast hake', price: 24 }),
	Object.freeze({ qty: 1, name: 'Lamb rump', price: 27 }),
	Object.freeze({ qty: 2, name: 'House red', price: 7 }),
	Object.freeze({ qty: 1, name: 'Burnt honey tart', price: 9 }),
]);

/** The monospaced type a till prints in. */
const MONO = "Menlo, 'DejaVu Sans Mono', 'Courier New', monospace";

/**
 * Checks a caller's items.
 *
 * @param {unknown} v The items.
 * @returns {import('./receipt.js').ReceiptItem[]} The items.
 * @throws {TypeError} When they aren't `[{ name, price, qty? }]`.
 */
export function resolveItems(v) {
	if (v === undefined) return /** @type {import('./receipt.js').ReceiptItem[]} */ (/** @type {unknown} */ (RECEIPT_ITEMS));
	if (!Array.isArray(v) || !v.length || !v.every((d) => d && typeof d.name === 'string' && typeof d.price === 'number' && Number.isFinite(d.price) && (d.qty === undefined || (Number.isInteger(d.qty) && d.qty > 0)))) {
		throw new TypeError('receiptScene: items is [{ name, price, qty }]');
	}
	return /** @type {import('./receipt.js').ReceiptItem[]} */ (v);
}

/**
 * The bill's sums: the subtotal, a service charge and the total.
 *
 * @param {import('./receipt.js').ReceiptItem[]} items The items.
 * @param {number} [service=0.125] The service charge, a share of the subtotal.
 * @returns {{ subtotal: number, service: number, total: number }} The sums, to the penny.
 */
export function receiptTotals(items, service = 0.125) {
	const subtotal = Math.round(items.reduce((t, d) => t + (d.qty ?? 1) * d.price * 100, 0)) / 100;
	const charge = Math.round(subtotal * service * 100) / 100;
	return { subtotal, service: charge, total: Math.round((subtotal + charge) * 100) / 100 };
}

/**
 * The receipt's length for its items, mm.
 *
 * @param {number} count How many items.
 * @param {boolean} named Whether there's a name under the mark.
 * @returns {number} The length.
 */
export const receiptLength = (count, named) => 134 + count * 4.6 + (named ? 6 : 0);

/**
 * A barcode's bars: seeded widths, a quiet zone either side, as a Code 128 reads at a glance.
 *
 * @param {string} seed The seed.
 * @param {number} [count=46] How many bars.
 * @returns {{ x: number, w: number }[]} Each bar's start and width, in modules.
 */
export function barcodeBars(seed, count = 46) {
	const r = rng(`${seed}:barcode`);
	const bars = [];
	let x = 0;
	for (let i = 0; i < count; i++) {
		const w = 1 + Math.floor(r.next() * 3);
		bars.push({ x, w });
		x += w + 1 + Math.floor(r.next() * 3);
	}
	return bars;
}

/**
 * A receipt, as an SVG document.
 *
 * @param {import('../util/brand.js').Brand} brand The brand (the mark and name print in thermal black).
 * @param {{ items?: import('./receipt.js').ReceiptItem[], px?: number, seed?: string, currency?: string }} [o] The items, pixels per mm (10), the seed (the barcode), and the currency sign (`'£'`).
 * @returns {string} The SVG, 80 mm wide.
 */
export function receiptSvg(brand, { items = resolveItems(undefined), px = 10, seed = 'receipt', currency = '£' } = {}) {
	const R = RECEIPT;
	const L = receiptLength(items.length, !!brand.name);
	const k = (v) => v * px;
	const sc = scene({ width: k(R.width), height: k(L), key: `receipt:${brand.name}:${seed}` });
	sc.add(el('rect', { width: k(R.width), height: k(L), fill: '#ffffff' }));
	const size = 3;
	const type = { fill: R.ink, 'font-family': MONO, 'font-size': k(size) };
	const left = k(R.margin);
	const right = k(R.width - R.margin);
	const mid = k(R.width / 2);
	let y = 12;
	const head = lockupSize({ name: brand.name, size: k(14), layout: 'stack' });
	sc.add(lockup(sc, { mark: brand.mark, name: brand.name, ink: R.ink, size: k(14), layout: 'stack', x: mid - head.width / 2, y: k(y), weight: 600 }));
	y += head.height / px + 7;
	const line = (text, { at = 'start', bold = false, big = false } = {}) => {
		const x = at === 'middle' ? mid : at === 'end' ? right : left;
		sc.add(el('text', { ...type, x, y: k(y), 'text-anchor': at, 'font-weight': bold ? 700 : 400, 'font-size': k(big ? size * 1.35 : size) }, esc(text)));
	};
	const pair = (a, b, o = {}) => {
		line(a, o);
		line(b, { ...o, at: 'end' });
		y += o.big ? 6.4 : 4.6;
	};
	const rule = () => {
		sc.add(el('text', { ...type, x: mid, y: k(y), 'text-anchor': 'middle', 'letter-spacing': k(0.15) }, '-'.repeat(36)));
		y += 5;
	};
	const money = (v) => `${currency}${v.toFixed(2)}`;
	for (const t of [CONTACT.street, CONTACT.town]) {
		line(t, { at: 'middle' });
		y += 4.4;
	}
	y += 2;
	pair('06/11/2026 19:42', 'Table 12');
	pair('Server: Sam', 'Covers: 2');
	rule();
	for (const d of items) pair(`${d.qty ?? 1} ${d.name}`, money((d.qty ?? 1) * d.price));
	rule();
	const sums = receiptTotals(items);
	pair('Subtotal', money(sums.subtotal));
	pair('Service 12.5%', money(sums.service));
	y += 1;
	pair('TOTAL', money(sums.total), { bold: true, big: true });
	pair('Card  ************4821', money(sums.total));
	rule();
	line('Thank you!', { at: 'middle', bold: true });
	y += 4.6;
	const web = domainOf(brand.name);
	if (web) {
		line(web, { at: 'middle' });
		y += 4.6;
	}
	y += 2;
	const bars = barcodeBars(seed);
	const modules = bars[bars.length - 1].x + bars[bars.length - 1].w;
	const unit = k(R.width - 2 * R.margin - 12) / modules;
	const bx = left + k(6);
	sc.add(el('path', { d: bars.map((b) => `M${bx + b.x * unit} ${k(y)}h${b.w * unit}v${k(12)}h${-b.w * unit}z`).join(''), fill: R.ink }));
	return sc.svg();
}
