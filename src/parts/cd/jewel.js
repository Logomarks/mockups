/**
 * @module @arraypress/mockups/parts/cd/jewel
 *
 * A jewel case, front on: 142 × 125 mm of clear polystyrene over a black
 * (or clear) tray, the 120 mm booklet held under the lid by its tabs, the
 * hinge down the left with its knuckles top and bottom and the inlay's
 * spine showing through, and the plastic itself: ridges where the lid
 * steps, bright edges on the light's side, a sheen and a soft glare
 * band. Drawn in millimetres inside a group scaled to pixels.
 */

import { el } from '../../render/svg.js';
import { glass } from '../../materials/glass.js';
import { roundRect } from '../../util/shape.js';
import { clamp, n } from '../../util/num.js';

/** A jewel case's size, and where the booklet sits in it, in mm. */
export const JEWEL = Object.freeze({ width: 142, height: 125, booklet: Object.freeze({ x: 16, y: 2.5, size: 120 }), hinge: 6.5 });

/**
 * A jewel case.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The case.
 * @param {number} o.x Its left edge (px).
 * @param {number} o.y Its top edge (px).
 * @param {number} o.mm Pixels per millimetre.
 * @param {import('../../render/scene.js').PlaceArt} o.booklet The booklet's front, placed in its square.
 * @param {'black' | 'clear'} o.tray The tray's plastic.
 * @param {string} o.ground The ground's colour (a clear tray shows it).
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @returns {string} The markup.
 */
export function jewel(sc, { x, y, mm, booklet, tray, ground, light }) {
	const { width: W, height: H, booklet: b, hinge } = JEWEL;
	const lx = clamp(light, -1, 1);
	const ids = { clip: sc.id('jewel'), edge: sc.id('jedge'), spine: sc.id('spine') };
	const body = roundRect(0, 0, W, H, 1.2, 4);
	sc.def(el('clipPath', { id: ids.clip }, el('rect', { width: W, height: H, rx: 1.2 })));
	sc.def(el('clipPath', { id: ids.spine }, el('rect', { x: 0.8, y: 0.8, width: hinge - 1.4, height: H - 1.6 })));
	sc.def(
		el(
			'linearGradient',
			{ id: ids.edge, x1: 0.5 + 0.5 * lx, y1: 0, x2: 0.5 - 0.5 * lx, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.9 }),
			el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0.25 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.35 }),
		),
	);
	const line = (x1, y1, x2, y2, color, alpha, w = 0.25) => el('line', { x1, y1, x2, y2, stroke: color, 'stroke-opacity': alpha, 'stroke-width': w });
	const box = (bx, by, bw, bh, attrs) => el('rect', { x: bx, y: by, width: bw, height: bh, ...attrs });
	const black = tray === 'black';
	// the tray under the lid, and the inlay's spine wrapped round its side, seen through the hinge
	const under =
		box(0, 0, W, H, { fill: black ? '#121214' : ground, 'fill-opacity': black ? 1 : 0.9 }) +
		(black ? '' : box(0, 0, W, H, { fill: '#000', 'fill-opacity': 0.06 })) +
		el('g', { 'clip-path': `url(#${ids.spine})` }, el('g', { filter: sc.blur(0.6) }, booklet(0.8, 0.8, b.size, H - 1.6)), box(0.8, 0.8, hinge - 1.4, H - 1.6, { fill: '#000', 'fill-opacity': 0.35 }));
	// the booklet: its front, a hair of shadow round it where it sits in the lid
	const paper = box(b.x - 0.3, b.y - 0.2, b.size + 0.6, b.size + 0.6, { fill: '#000', 'fill-opacity': black ? 0.5 : 0.18, filter: sc.blur(0.4) });
	const bclip = sc.id('booklet');
	sc.def(el('clipPath', { id: bclip }, box(b.x, b.y, b.size, b.size, {})));
	const front = el('g', { 'clip-path': `url(#${bclip})` }, box(b.x, b.y, b.size, b.size, { fill: '#f4f2ee' }), booklet(b.x, b.y, b.size, b.size), box(b.x, b.y, b.size, b.size, { fill: 'none', stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': 0.2 }));
	// the lid: its tabs, the step round its face, the hinge's ridges and knuckles
	const tabs =
		[22, H - 30].map((ty) => box(b.x + b.size - 0.2, ty, 3, 8, { fill: '#fff', 'fill-opacity': 0.08, stroke: '#fff', 'stroke-opacity': 0.35, 'stroke-width': 0.2, rx: 0.4 })).join('') +
		[16, H - 26].map((ty) => box(b.x - 3.4, ty, 3.2, 10, { fill: '#fff', 'fill-opacity': 0.06, stroke: '#fff', 'stroke-opacity': 0.3, 'stroke-width': 0.2, rx: 0.4 })).join('');
	const step =
		line(hinge + 1.2, 1.4, W - 1.4, 1.4, '#fff', 0.55) +
		line(W - 1.4, 1.4, W - 1.4, H - 1.4, lx > 0 ? '#fff' : '#000', lx > 0 ? 0.45 : 0.3) +
		line(hinge + 1.2, H - 1.4, W - 1.4, H - 1.4, '#000', 0.35) +
		line(hinge + 1.2, 1.4, hinge + 1.2, H - 1.4, '#fff', 0.4);
	const knuckle = (ky) => box(0.3, ky, hinge - 0.2, 9, { rx: 0.8, fill: '#fff', 'fill-opacity': black ? 0.16 : 0.3, stroke: '#fff', 'stroke-opacity': 0.55, 'stroke-width': 0.25 });
	const hingeLines =
		line(hinge, 0, hinge, H, '#fff', 0.55, 0.35) +
		line(hinge + 0.5, 0, hinge + 0.5, H, '#000', 0.35, 0.3) +
		line(2.4, 10, 2.4, H - 10, '#fff', 0.3, 0.25) +
		knuckle(0.6) +
		knuckle(H - 9.6);
	return el(
		'g',
		{ transform: `translate(${n(x)} ${n(y)}) scale(${n(mm)})` },
		el('g', { 'clip-path': `url(#${ids.clip})` }, under, paper, front, el('rect', { width: W, height: H, fill: '#fff', 'fill-opacity': 0.03 }), tabs, step, hingeLines, glass(sc, { outline: body, light, strength: 1.6, band: 0.36 })),
		el('rect', { x: 0.15, y: 0.15, width: W - 0.3, height: H - 0.3, rx: 1.1, fill: 'none', stroke: `url(#${ids.edge})`, 'stroke-width': 0.5 }),
		el('rect', { width: W, height: H, rx: 1.2, fill: 'none', stroke: '#000', 'stroke-opacity': 0.3, 'stroke-width': 0.15 }),
	);
}
