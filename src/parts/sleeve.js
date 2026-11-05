/**
 * @module @logomarks/mockups/parts/sleeve
 *
 * A printed sleeve, front on: the artwork, a faint paper sheen (a broad
 * diagonal glow, slightly darker away from the light), and its edges: a
 * bright top where the board's edge catches the light, a hairline round it.
 * The art is printed in full colour, or in one ink on coloured stock.
 */

import { el } from '../render/svg.js';
import { clamp } from '../util/num.js';
import { inkFilter } from '../materials/ink.js';

/**
 * A sleeve.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The sleeve.
 * @param {number} o.x Its left edge.
 * @param {number} o.y Its top edge.
 * @param {number} o.size Its side.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} [o.sheen=1] How strong the paper's sheen is.
 * @param {import('../materials/ink.js').InkPrint | null} [o.print] One ink on coloured stock (full colour by default).
 * @returns {string} The markup.
 */
export function sleeve(sc, { x, y, size, light, sheen = 1, print = null }) {
	const g = sc.id('paper');
	const lx = clamp(light, -1, 1);
	sc.def(
		el(
			'linearGradient',
			{ id: g, x1: 0.5 + 0.5 * lx, y1: 0, x2: 0.5 - 0.5 * lx, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.1 * sheen }),
			el('stop', { offset: 0.35, 'stop-color': '#fff', 'stop-opacity': 0.03 * sheen }),
			el('stop', { offset: 0.65, 'stop-color': '#000', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.07 * sheen }),
		),
	);
	const edge = Math.max(1, size * 0.0035);
	const line = (x1, y1, x2, y2, color, alpha) => el('line', { x1, y1, x2, y2, stroke: color, 'stroke-opacity': alpha, 'stroke-width': edge });
	const h = edge / 2;
	return el(
		'g',
		{},
		print ? el('rect', { x, y, width: size, height: size, fill: print.paper }) + sc.useArt(x, y, size, size, { filter: inkFilter(sc, print) }) : sc.useArt(x, y, size, size),
		el('rect', { x, y, width: size, height: size, fill: `url(#${g})` }),
		line(x, y + h, x + size, y + h, '#fff', 0.5),
		line(x + h, y, x + h, y + size, lx < 0 ? '#fff' : '#000', lx < 0 ? 0.3 : 0.1),
		line(x + size - h, y, x + size - h, y + size, lx > 0 ? '#fff' : '#000', lx > 0 ? 0.3 : 0.1),
		line(x, y + size - h, x + size, y + size - h, '#000', 0.18),
		el('rect', { x, y, width: size, height: size, fill: 'none', stroke: '#000', 'stroke-opacity': 0.14, 'stroke-width': 0.6 }),
	);
}
