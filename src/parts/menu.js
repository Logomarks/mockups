/**
 * @module @logomarks/mockups/parts/menu
 *
 * A restaurant's menu composed from the brand: the lockup at the head,
 * then courses, each dish's name with its price set flush right and a
 * short note under it, and a line about allergens at the foot. A single
 * card sets the courses in two columns; a tri-fold's inside spread gives the first
 * panel to the lockup and the others to the courses. The dishes are
 * placeholders unless the caller gives its own. Drawn at true size in
 * millimetres, ink on the paper.
 */

import { scene } from '../render/scene.js';
import { el, esc } from '../render/svg.js';
import { FONT } from './screen/ui.js';
import { lockup, lockupSize } from './lockup.js';
import { paperInk } from './stationery.js';

/** The placeholder courses: each a title and its dishes (a name, a note and a price). */
export const MENU_SECTIONS = Object.freeze([
	Object.freeze({
		title: 'To start',
		items: Object.freeze([
			Object.freeze({ name: 'Sourdough', note: 'cultured butter', price: 5 }),
			Object.freeze({ name: 'Charred leeks', note: 'hazelnut, brown butter', price: 8 }),
			Object.freeze({ name: 'Burrata', note: 'blood orange, chilli, mint', price: 11 }),
			Object.freeze({ name: 'Cured trout', note: 'pickled cucumber, dill', price: 10 }),
		]),
	}),
	Object.freeze({
		title: 'Mains',
		items: Object.freeze([
			Object.freeze({ name: 'Roast hake', note: 'mussels, saffron, fennel', price: 24 }),
			Object.freeze({ name: 'Lamb rump', note: 'white beans, salsa verde', price: 27 }),
			Object.freeze({ name: 'Mushroom risotto', note: 'aged parmesan, thyme', price: 19 }),
			Object.freeze({ name: 'Steak frites', note: 'béarnaise, watercress', price: 29 }),
		]),
	}),
	Object.freeze({
		title: 'To finish',
		items: Object.freeze([
			Object.freeze({ name: 'Burnt honey tart', note: 'crème fraîche', price: 9 }),
			Object.freeze({ name: 'Chocolate mousse', note: 'olive oil, sea salt', price: 9 }),
			Object.freeze({ name: 'Cheese', note: 'oatcakes, quince', price: 12 }),
		]),
	}),
	Object.freeze({
		title: 'To drink',
		items: Object.freeze([
			Object.freeze({ name: 'House red', note: 'by the glass', price: 7 }),
			Object.freeze({ name: 'Pale ale', note: 'brewed nearby', price: 6 }),
			Object.freeze({ name: 'Sparkling water', price: 3 }),
		]),
	}),
]);

/** A single card's size, and a tri-fold's panel, mm. */
export const MENU_SIZES = Object.freeze({ card: Object.freeze([230, 330]), panel: Object.freeze([99, 210]) });

/**
 * Checks a caller's courses.
 *
 * @param {unknown} v The courses.
 * @returns {import('./menu.js').MenuSection[]} The courses.
 * @throws {TypeError} When they aren't `[{ title, items: [{ name, note?, price? }] }]`.
 */
export function resolveSections(v) {
	if (v === undefined) return /** @type {import('./menu.js').MenuSection[]} */ (/** @type {unknown} */ (MENU_SECTIONS));
	const ok =
		Array.isArray(v) &&
		v.length > 0 &&
		v.every((s) => s && typeof s.title === 'string' && Array.isArray(s.items) && s.items.every((d) => d && typeof d.name === 'string' && (d.note === undefined || typeof d.note === 'string') && (d.price === undefined || typeof d.price === 'number' || typeof d.price === 'string')));
	if (!ok) throw new TypeError('menu: sections is [{ title, items: [{ name, note, price }] }]');
	return /** @type {import('./menu.js').MenuSection[]} */ (v);
}

/**
 * Courses shared between columns, each column taking whole courses, as evenly by length as they go.
 *
 * @param {import('./menu.js').MenuSection[]} sections The courses.
 * @param {number} columns How many columns.
 * @returns {import('./menu.js').MenuSection[][]} The columns' courses, in order.
 */
export function splitSections(sections, columns) {
	const weight = (s) => s.items.length + 1.2;
	const total = sections.reduce((t, s) => t + weight(s), 0);
	/** @type {import('./menu.js').MenuSection[][]} */
	const out = Array.from({ length: columns }, () => []);
	let at = 0;
	let col = 0;
	for (const s of sections) {
		// move on when this column already holds its share and there are columns left
		if (col < columns - 1 && out[col].length && at + weight(s) / 2 > (total * (col + 1)) / columns) col++;
		out[col].push(s);
		at += weight(s);
	}
	return out;
}

/**
 * A price as the menu prints it: whole numbers bare, others to two places.
 *
 * @param {number | string | undefined} p The price.
 * @returns {string} The price (`''` for none).
 */
export const priceText = (p) => (p === undefined ? '' : typeof p === 'string' ? p : Number.isInteger(p) ? String(p) : p.toFixed(2));

/**
 * Courses set in a column.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./menu.js').MenuSection[]} sections The courses.
 * @param {{ x: number, y: number, width: number, size: number, ink: string }} o The column's left, top and width, the type's size, and the ink (pixels).
 * @returns {{ markup: string, bottom: number }} The markup, and where the column ends.
 */
export function courses(sc, sections, { x, y, width, size, ink }) {
	const type = { fill: ink, 'font-family': FONT };
	let at = y;
	let out = '';
	for (const s of sections) {
		out += el('text', { ...type, x, y: at + size * 0.9, 'font-size': size * 0.82, 'font-weight': 600, 'letter-spacing': size * 0.16 }, esc(s.title.toUpperCase()));
		at += size * 2.4;
		for (const d of s.items) {
			out += el('text', { ...type, x, y: at + size, 'font-size': size, 'font-weight': 500 }, esc(d.name));
			out += el('text', { ...type, x: x + width, y: at + size, 'font-size': size, 'text-anchor': 'end' }, esc(priceText(d.price)));
			if (d.note) out += el('text', { ...type, x, y: at + size * 2.3, 'font-size': size * 0.8, opacity: 0.7 }, esc(d.note));
			at += size * (d.note ? 3.4 : 2.2);
		}
		at += size * 1.4;
	}
	return { markup: out, bottom: at };
}

/**
 * A single card menu, as an SVG document.
 *
 * @param {import('../util/brand.js').Brand} brand The brand.
 * @param {{ sections?: import('./menu.js').MenuSection[], px?: number, footer?: string }} [o] The courses, pixels per mm (5), and the line at the foot.
 * @returns {string} The SVG.
 */
export function menuCardSvg(brand, { sections = resolveSections(undefined), px = 5, footer = 'Please tell us about any allergies.' } = {}) {
	const [W, H] = MENU_SIZES.card;
	const k = (v) => v * px;
	const ink = paperInk(brand);
	const sc = scene({ width: k(W), height: k(H), key: `menu:${brand.name}` });
	sc.add(el('rect', { width: k(W), height: k(H), fill: brand.paper }));
	const head = lockupSize({ name: brand.name, size: k(20), layout: 'stack' });
	sc.add(lockup(sc, { mark: brand.mark, name: brand.name, ink, size: k(20), layout: 'stack', x: (k(W) - head.width) / 2, y: k(20) }));
	sc.add(el('rect', { x: k(W / 2 - 12), y: k(20) + head.height + k(9), width: k(24), height: k(0.4), fill: ink }));
	const gutter = 16;
	const col = (W - 52 - gutter) / 2;
	// the courses, the block centred between the head and the foot
	const parts = splitSections(sections, 2);
	const tall = Math.max(...parts.map((part) => courses(sc, part, { x: 0, y: 0, width: k(col), size: k(4.8), ink }).bottom));
	const top = k(20) + head.height + k(14);
	const y = top + Math.max(0, (k(H - 30) - top - tall) / 2);
	parts.forEach((part, i) => sc.add(courses(sc, part, { x: k(26 + i * (col + gutter)), y, width: k(col), size: k(4.8), ink }).markup));
	sc.add(el('text', { x: k(W / 2), y: k(H - 16), fill: ink, 'font-family': FONT, 'font-size': k(3), 'text-anchor': 'middle', opacity: 0.7 }, esc(footer)));
	return sc.svg();
}

/**
 * A tri-fold's inside spread (three panels side by side), as an SVG document: the lockup and "Menu" on the first, the courses shared between the other two.
 *
 * @param {import('../util/brand.js').Brand} brand The brand.
 * @param {{ sections?: import('./menu.js').MenuSection[], px?: number }} [o] The courses, and pixels per mm (6).
 * @returns {string} The SVG, three panels wide.
 */
export function menuSpreadSvg(brand, { sections = resolveSections(undefined), px = 6 } = {}) {
	const [P, H] = MENU_SIZES.panel;
	const k = (v) => v * px;
	const ink = paperInk(brand);
	const sc = scene({ width: k(3 * P), height: k(H), key: `menuspread:${brand.name}` });
	sc.add(el('rect', { width: k(3 * P), height: k(H), fill: brand.paper }));
	// the first panel: the brand's colour, the lockup in its ink
	sc.add(el('rect', { width: k(P), height: k(H), fill: brand.color }));
	const head = lockupSize({ name: brand.name, size: k(26), layout: 'stack' });
	sc.add(lockup(sc, { mark: brand.mark, name: brand.name, ink: brand.ink, size: k(26), layout: 'stack', x: (k(P) - head.width) / 2, y: k(H * 0.36) - head.height / 2 }));
	sc.add(el('text', { x: k(P / 2), y: k(H - 18), fill: brand.ink, 'font-family': FONT, 'font-size': k(3.4), 'font-weight': 600, 'letter-spacing': k(1.2), 'text-anchor': 'middle' }, 'MENU'));
	// the courses, shared between the other two panels
	splitSections(sections, 2).forEach((part, i) => sc.add(courses(sc, part, { x: k(P * (i + 1) + 12), y: k(18), width: k(P - 24), size: k(3.6), ink }).markup));
	return sc.svg();
}
