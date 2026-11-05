/**
 * @module @logomarks/mockups/materials/paper
 *
 * Paper and board stocks, and what they do to a print: the tooth of the
 * sheet (fine light and dark specks), the paper's own white (ink never
 * prints whiter than the stock, and solid black never reads pure), and its
 * sheen: a broad soft glow towards the light, from almost none on uncoated
 * cotton to a bright sweep on gloss.
 */

import { el } from '../render/svg.js';
import { speckTile } from './desk.js';
import { clamp } from '../util/num.js';

/** The stocks: the paper's colour, how much tooth shows, and how much it shines. */
export const STOCKS = Object.freeze({
	matte: Object.freeze({ color: '#f6f5f1', tooth: 0.6, sheen: 0.5 }),
	uncoated: Object.freeze({ color: '#f4f1ea', tooth: 1, sheen: 0.2 }),
	gloss: Object.freeze({ color: '#fbfbfa', tooth: 0.25, sheen: 1.5 }),
	cotton: Object.freeze({ color: '#f3efe6', tooth: 1.5, sheen: 0.08 }),
	kraft: Object.freeze({ color: '#b48a5e', tooth: 1.4, sheen: 0.15 }),
});

/** A stock's name. */
const NAMES = /** @type {const} */ (['matte', 'uncoated', 'gloss', 'cotton', 'kraft']);

/**
 * A stock from its name.
 *
 * @param {import('./paper.js').StockName | undefined} name The stock (`'matte'`).
 * @param {string} [object='paper'] The object, for the error.
 * @returns {import('./paper.js').Stock} The stock.
 * @throws {TypeError} For an unknown name.
 */
export function resolveStock(name = 'matte', object = 'paper') {
	if (!NAMES.includes(name)) throw new TypeError(`${object}: stock is 'matte', 'uncoated', 'gloss', 'cotton' or 'kraft' (got ${JSON.stringify(name)})`);
	return { name, ...STOCKS[name] };
}

/**
 * The tooth of a sheet, as a fill: a seamless tile of fine specks, scaled to the paper.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {number} mm Pixels per millimetre.
 * @param {number} [seed=0] The seed.
 * @returns {string} A `url(#…)`.
 */
export function toothFill(sc, mm, seed = 0) {
	const f = 0.6 / Math.max(1, mm * 0.18);
	return speckTile(sc, { size: 256, freq: [f, f], octaves: 2, dark: 0.07, light: 0.06, seed });
}

/**
 * What the stock does to a print over a shape: its white and black, its tooth, its sheen. Draw it over the art, clipped to the sheet.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The sheet.
 * @param {import('./paper.js').Stock} o.stock The stock.
 * @param {string} o.shape The sheet's outline, as markup with no fill of its own set (it's given one).
 * @param {number} o.mm Pixels per millimetre.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} [o.angle=0] The sheet's turn, in degrees (the sheen stays with the light, not the sheet).
 * @param {number} [o.seed=0] The seed.
 * @returns {string} The layers.
 */
export function finish(sc, { stock, shape, mm, light, angle = 0, seed = 0 }) {
	const g = sc.id('sheen');
	const lx = clamp(light, -1, 1);
	// the light's direction in the sheet's own frame
	const a = (-angle * Math.PI) / 180;
	const dx = 0.45 * lx;
	const dy = -0.5;
	const rx = dx * Math.cos(a) - dy * Math.sin(a);
	const ry = dx * Math.sin(a) + dy * Math.cos(a);
	const s = stock.sheen;
	sc.def(
		el(
			'linearGradient',
			{ id: g, x1: 0.5 + rx, y1: 0.5 + ry, x2: 0.5 - rx, y2: 0.5 - ry },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': clamp(0.1 * s) }),
			el('stop', { offset: 0.4, 'stop-color': '#fff', 'stop-opacity': clamp(0.025 * s) }),
			el('stop', { offset: 0.7, 'stop-color': '#000', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': clamp(0.05 + 0.02 * s) }),
		),
	);
	const fill = (f, extra = {}) => shape.replace(/^<(\w+)/, (m) => `${m} fill="${f}"${Object.entries(extra).map(([k, v]) => ` ${k}="${v}"`).join('')}`);
	return (
		// ink sits in the paper: whites take the stock's tint, blacks lift a touch
		fill(stock.color, { opacity: 0.1, style: 'mix-blend-mode:multiply' }) +
		fill('#ffffff', { opacity: 0.025 }) +
		fill(toothFill(sc, mm, seed), { opacity: clamp(stock.tooth, 0, 2) / 2 + 0.25 }) +
		fill(`url(#${g})`)
	);
}
