/**
 * @module @logomarks/mockups/parts/stationery
 *
 * A brand's stationery composed from its mark, name and colour, for the
 * scenes that lay out a set when there are no print files: a letterhead
 * (the lockup at the head, an address block, a rule and the web address at
 * the foot), a business card's front (the mark on the brand's colour) and
 * back (a name, a role and contact lines), and an envelope (the mark at
 * its top left, the layers folded behind showing through). Drawn at true
 * size in millimetres. The people and addresses are placeholders.
 */

import { scene } from '../render/scene.js';
import { el, esc } from '../render/svg.js';
import { luma } from '../util/color.js';
import { FONT } from './screen/ui.js';
import { lockup } from './lockup.js';
import { envelopeFace } from './envelope.js';

/** The placeholder contact details a composed set prints. */
export const CONTACT = Object.freeze({ person: 'Alex Morgan', role: 'Founder', street: '12 Harbour Row', town: 'Bristol BS1 4QA', phone: '+44 117 496 0321' });

/**
 * The brand's web address, from its name: lower case, letters and digits only.
 *
 * @param {string} name The name.
 * @returns {string} `'name.com'`, or `''` without a name.
 */
export const domainOf = (name) => {
	const s = name.toLowerCase().replace(/[^a-z0-9]/g, '');
	return s ? `${s}.com` : '';
};

/**
 * The ink a brand prints on its paper: its own colour when that's dark enough to read, otherwise near-black.
 *
 * @param {import('../util/brand.js').Brand} brand The brand.
 * @returns {string} The ink, hex.
 */
export const paperInk = (brand) => (luma(brand.color) < 0.55 ? brand.color : '#161616');

/**
 * A document of a sheet's size, its paper laid down.
 *
 * @param {[number, number]} size The sheet, mm.
 * @param {number} px Pixels per mm.
 * @param {string} fill The paper.
 * @param {string} key Its ids' key.
 * @returns {{ sc: import('../render/scene.js').Scene, k: (v: number) => number }} The document and mm-to-pixels.
 */
function sheetDoc([W, H], px, fill, key) {
	const sc = scene({ width: W * px, height: H * px, key });
	sc.add(el('rect', { width: W * px, height: H * px, fill }));
	return { sc, k: (v) => v * px };
}

/**
 * Lines of small type, one under another.
 *
 * @param {string[]} lines The lines.
 * @param {object} o Where and how.
 * @param {number} o.x Their x (or end, with `anchor: 'end'`), pixels.
 * @param {number} o.y The first baseline, pixels.
 * @param {number} o.size The type's size, pixels.
 * @param {string} o.fill The ink.
 * @param {'start' | 'end'} [o.anchor='start'] Which end `x` is.
 * @returns {string} The markup.
 */
function lines(list, { x, y, size, fill, anchor = 'start' }) {
	return list.map((t, i) => el('text', { x, y: y + i * size * 1.45, fill, 'font-family': FONT, 'font-size': size, 'text-anchor': anchor }, esc(t))).join('');
}

/**
 * A letterhead (A4), as an SVG document.
 *
 * @param {import('../util/brand.js').Brand} brand The brand.
 * @param {{ px?: number }} [o] Pixels per mm (6).
 * @returns {string} The SVG.
 */
export function letterSvg(brand, { px = 6 } = {}) {
	const ink = paperInk(brand);
	const { sc, k } = sheetDoc([210, 297], px, brand.paper, `letter:${brand.name}`);
	sc.add(lockup(sc, { mark: brand.mark, name: brand.name, ink, size: k(14), x: k(20), y: k(18) }));
	sc.add(lines([CONTACT.street, CONTACT.town, CONTACT.phone], { x: k(190), y: k(22), size: k(2.8), fill: ink, anchor: 'end' }));
	sc.add(el('rect', { x: k(20), y: k(277), width: k(170), height: k(0.35), fill: ink, opacity: 0.6 }));
	sc.add(lines([domainOf(brand.name)], { x: k(20), y: k(283), size: k(2.8), fill: ink }));
	return sc.svg();
}

/**
 * A business card's front: the mark on the brand's colour.
 *
 * @param {import('../util/brand.js').Brand} brand The brand.
 * @param {{ px?: number }} [o] Pixels per mm (12).
 * @returns {string} The SVG.
 */
export function cardFrontSvg(brand, { px = 12 } = {}) {
	const { sc, k } = sheetDoc([85, 55], px, brand.color, `cardfront:${brand.name}`);
	sc.add(lockup(sc, { mark: brand.mark, ink: brand.ink, size: k(22), x: k(31.5), y: k(16.5) }));
	return sc.svg();
}

/**
 * A business card's back: the name small at the top, a person, a role and contact lines.
 *
 * @param {import('../util/brand.js').Brand} brand The brand.
 * @param {{ px?: number }} [o] Pixels per mm (12).
 * @returns {string} The SVG.
 */
export function cardBackSvg(brand, { px = 12 } = {}) {
	const ink = paperInk(brand);
	const { sc, k } = sheetDoc([85, 55], px, brand.paper, `cardback:${brand.name}`);
	sc.add(lockup(sc, { mark: brand.mark, name: brand.name, ink, size: k(7), x: k(7), y: k(7) }));
	sc.add(lines([CONTACT.person, CONTACT.role], { x: k(7), y: k(34), size: k(2.9), fill: ink }));
	sc.add(lines([CONTACT.phone, domainOf(brand.name)].filter(Boolean), { x: k(78), y: k(43), size: k(2.4), fill: ink, anchor: 'end' }));
	return sc.svg();
}

/**
 * A DL envelope's front: the paper, the layers behind showing through, the mark at its top left.
 *
 * @param {import('../util/brand.js').Brand} brand The brand.
 * @param {{ px?: number }} [o] Pixels per mm (6).
 * @returns {string} The SVG.
 */
export function envelopeSvg(brand, { px = 6 } = {}) {
	const [W, H] = [220, 110];
	const ink = paperInk(brand);
	const { sc, k } = sheetDoc([W, H], px, brand.paper, `envelope:${brand.name}`);
	const logo = (x, y, w) => lockup(sc, { mark: brand.mark, name: brand.name, ink, size: w * 0.6, x, y });
	sc.add(el('g', { transform: `translate(${k(W / 2)} ${k(H / 2)})` }, envelopeFace(sc, { w: k(W), h: k(H), mm: px, logo, logoSize: 16 })));
	return sc.svg();
}
