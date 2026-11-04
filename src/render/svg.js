/**
 * @module @arraypress/mockups/render/svg
 *
 * Writing SVG as strings: an element helper that drops empty attributes and
 * formats numbers, and XML escaping. Everything the 2D compositor draws goes
 * through `el`, so markup stays consistent and compact.
 */

import { n } from '../util/num.js';

/**
 * Text made safe for XML content and attribute values.
 *
 * @param {unknown} s Anything; it's turned into a string.
 * @returns {string} The text with `& < > " '` escaped.
 */
export const esc = (s) =>
	String(s).replace(/[&<>"']/g, (c) => /** @type {Record<string, string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

/**
 * One SVG element.
 *
 * @param {string} tag The element's name (`circle`, `g`…).
 * @param {Record<string, string | number | false | null | undefined>} [attrs] Its attributes. `null`, `undefined` and `false` are left out; numbers are written with at most three decimals.
 * @param {...(string | false | null | undefined)} children Markup inside it; falsy entries are skipped. With none, the element closes itself.
 * @returns {string} The markup.
 */
export function el(tag, attrs = {}, ...children) {
	let a = '';
	for (const [k, v] of Object.entries(attrs)) {
		if (v === null || v === undefined || v === false) continue;
		a += ` ${k}="${typeof v === 'number' ? n(v) : esc(v)}"`;
	}
	const inner = children.filter(Boolean).join('');
	return inner ? `<${tag}${a}>${inner}</${tag}>` : `<${tag}${a}/>`;
}

/**
 * A circle's outline as path data, so it can be combined with others (a disc with a hole: two circles, even-odd).
 *
 * @param {number} cx Its centre, x.
 * @param {number} cy Its centre, y.
 * @param {number} r Its radius.
 * @returns {string} Path data: two arcs, closed.
 */
export const circlePath = (cx, cy, r) => `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0z`;
