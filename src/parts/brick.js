/**
 * @module @arraypress/mockups/parts/brick
 *
 * A brick wall drawn flat (it's warped onto the wall's plane afterwards):
 * stretcher bond with seeded tones brick by brick, recessed mortar, broad
 * weathering (lighter and darker patches, grime rising from the ground),
 * and the light falling across it.
 */

import { el } from '../render/svg.js';
import { rng } from '../util/rng.js';
import { mix } from '../util/color.js';
import { clamp } from '../util/num.js';

/** A brick and its joint, in metres (a UK brick: 215 × 65 mm, 10 mm joints). */
export const BRICK = Object.freeze({ length: 0.215, height: 0.065, joint: 0.01 });

/**
 * A brick wall.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The wall.
 * @param {number} o.width Its width in drawing units.
 * @param {number} o.height Its height in drawing units.
 * @param {number} o.scale Drawing units per metre.
 * @param {string} [o.color='#9b5b45'] The bricks' colour.
 * @param {string} [o.mortar='#b8ab9b'] The mortar's.
 * @param {number} [o.light=0.3] Where the light is, left (-1) to right (1).
 * @param {string} [o.seed='brick'] Seeds the tones and weathering.
 * @param {boolean} [o.coping=false] Whether a stone coping caps the top.
 * @returns {string} The markup, in `[0, width] × [0, height]`.
 */
export function brickWall(sc, { width: w, height: h, scale: k, color = '#9b5b45', mortar = '#b8ab9b', light = 0.3, seed = 'brick', coping = false }) {
	const r = rng(`${seed}:bricks`);
	const bl = (BRICK.length + BRICK.joint) * k;
	const bh = (BRICK.height + BRICK.joint) * k;
	const j = BRICK.joint * k;
	const [cols, rows] = [10, 12];
	let bricks = '';
	for (let y = 0; y < rows; y++) {
		for (let x = -1; x < cols; x++) {
			const tone = r.range(-0.12, 0.12);
			const c = tone > 0 ? mix(color, '#d9a27f', tone) : mix(color, '#3a2118', -tone);
			bricks += el('rect', { x: x * bl + (y % 2 ? bl / 2 : 0), y: y * bh, width: bl - j, height: bh - j, fill: c });
		}
	}
	const tile = sc.id('bricks');
	sc.def(el('pattern', { id: tile, patternUnits: 'userSpaceOnUse', width: cols * bl, height: rows * bh }, el('rect', { width: cols * bl, height: rows * bh, fill: mortar }), bricks));
	// weathering: broad soft patches (radial fades, not blurs: this is drawn once per piece of the warp), and grime from the ground up
	const ids = { grime: sc.id('grime'), sun: sc.id('sun'), dark: sc.id('stain'), pale: sc.id('bleach') };
	for (const [id, c] of [[ids.dark, '#000'], [ids.pale, '#fff']]) sc.def(el('radialGradient', { id }, el('stop', { offset: 0, 'stop-color': c, 'stop-opacity': 1 }), el('stop', { offset: 1, 'stop-color': c, 'stop-opacity': 0 })));
	const wr = rng(`${seed}:weather`);
	let patches = '';
	for (let i = 0; i < 14; i++) {
		patches += el('ellipse', { cx: wr.next() * w, cy: wr.next() * h, rx: wr.range(0.05, 0.2) * w, ry: wr.range(0.04, 0.15) * h, fill: `url(#${wr.next() > 0.5 ? ids.dark : ids.pale})`, opacity: wr.range(0.05, 0.12) });
	}
	sc.def(el('linearGradient', { id: ids.grime, x1: 0, y1: 1, x2: 0, y2: 0 }, el('stop', { offset: 0, 'stop-color': '#1d1611', 'stop-opacity': 0.35 }), el('stop', { offset: 0.12, 'stop-color': '#1d1611', 'stop-opacity': 0.08 }), el('stop', { offset: 0.3, 'stop-color': '#1d1611', 'stop-opacity': 0 })));
	const lx = clamp(light, -1, 1);
	sc.def(el('linearGradient', { id: ids.sun, x1: lx >= 0 ? 1 : 0, y1: 0, x2: lx >= 0 ? 0 : 1, y2: 0.4 }, el('stop', { offset: 0, 'stop-color': '#fff6e6', 'stop-opacity': 0.14 }), el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.12 })));
	return el(
		'g',
		{},
		el('rect', { width: w, height: h, fill: `url(#${tile})` }),
		patches,
		el('rect', { width: w, height: h, fill: `url(#${ids.grime})` }),
		el('rect', { width: w, height: h, fill: `url(#${ids.sun})` }),
		coping && el('rect', { width: w, height: 0.32 * k, fill: '#c9c3b8' }),
		coping && el('rect', { y: 0.32 * k, width: w, height: 0.06 * k, fill: '#000', opacity: 0.25 }),
	);
}
