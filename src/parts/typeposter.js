/**
 * @module @logomarks/mockups/parts/typeposter
 *
 * A type-led poster composed from a brand: a headline set large across
 * the top, the lockup at the bottom left and an address at the bottom
 * right, on the brand's colour, with the layout's grid drawn in as thin
 * rules (the margins, the line under the headline, the column the address
 * sits in), as a designer leaves them showing. Used when a sign is given
 * a mark rather than finished art.
 */

import { el, esc } from '../render/svg.js';
import { lockupIn, typeWidth } from './lockup.js';
import { FONT } from './screen/ui.js';

/** The headline's typeface: a book serif. */
export const SERIF = "Georgia, 'Times New Roman', Times, serif";

/** The grid, as shares of the poster's height: the margin, the rule under the headline, the band the lockup sits in. */
export const TYPE_GRID = Object.freeze({ margin: 0.075, rule: 0.56, foot: 0.82 });

/**
 * A headline broken into lines that fit a width.
 *
 * @param {string} words The headline.
 * @param {number} size Its size.
 * @param {number} width The measure.
 * @returns {string[]} The lines.
 */
export function breakLines(words, size, width) {
	const lines = [];
	let line = '';
	for (const w of words.split(/\s+/).filter(Boolean)) {
		const next = line ? `${line} ${w}` : w;
		if (line && typeWidth(next, size * 0.86) > width) {
			lines.push(line);
			line = w;
		} else line = next;
	}
	if (line) lines.push(line);
	return lines;
}

/**
 * A type poster.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./typeposter.js').TypePosterSpec & { width: number, height: number }} o The poster and its size.
 * @returns {string} The markup, in `[0, width] × [0, height]`.
 */
export function typePoster(sc, { width: W, height: H, mark, name = '', headline, url = '', color, ink }) {
	const G = TYPE_GRID;
	const m = H * G.margin;
	const rule = { stroke: ink, 'stroke-opacity': 0.32, 'stroke-width': Math.max(1, H * 0.0016) };
	const line = (x1, y1, x2, y2) => el('line', { x1, y1, x2, y2, ...rule });
	const col = W - m - (W - 2 * m) * 0.34;
	// the headline: as large as fits two or three lines above the rule
	let size = H * 0.2;
	let lines = breakLines(headline, size, W - 2 * m);
	while (size > H * 0.05 && (lines.length * size * 1.08 > H * (G.rule - G.margin) - m * 0.6 || lines.some((l) => typeWidth(l, size * 0.86) > W - 2 * m))) {
		size *= 0.94;
		lines = breakLines(headline, size, W - 2 * m);
	}
	const type = lines.map((l, i) => el('text', { x: m * 1.35, y: m * 1.45 + size * (0.82 + i * 1.04), fill: ink, 'font-family': SERIF, 'font-size': size, 'letter-spacing': size * -0.02 }, esc(l))).join('');
	const footY = H * G.foot;
	const lock = lockupIn(sc, { mark, name, ink, size: H * 0.09, x: m * 1.35, y: footY - H * 0.06, width: col - m * 2.5, height: H * 0.12, align: 'start' });
	const address = url ? el('text', { x: col + m * 0.6, y: footY + H * 0.012, fill: ink, 'font-family': FONT, 'font-size': H * 0.028, opacity: 0.9 }, esc(url)) : '';
	return el(
		'g',
		{},
		el('rect', { width: W, height: H, fill: color }),
		// the grid: margins, the rule under the headline, the address's column, the foot
		line(m, 0, m, H),
		line(W - m, 0, W - m, H),
		line(0, m, W, m),
		line(0, H - m, W, H - m),
		line(0, H * G.rule, W, H * G.rule),
		line(col, H * G.rule, col, H - m),
		type,
		lock,
		address,
	);
}
