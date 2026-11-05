/**
 * @module @arraypress/mockups/materials/cuttingmat
 *
 * A self-healing cutting mat: matte PVC with a fine speckle, a printed
 * grid (a line every centimetre, a bolder one every five), the
 * centimetres numbered along the top and left, two 45° guides, and a few
 * healed knife scores. Drawn at true size, so a centimetre on the mat is a
 * centimetre of the print lying on it.
 */

import { el } from '../render/svg.js';
import { mottle, speckTile } from './noise.js';
import { rng, hash } from '../util/rng.js';
import { mix } from '../util/color.js';
import { n } from '../util/num.js';

/** The printed lines' colour, and the numbers'. */
const LINE = '#e8f2e8';
const FIGURE = '#ece5a2';

/**
 * A cutting mat's print and texture, drawn over its colour.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} color The mat's colour.
 * @param {string} seed The seed.
 * @param {number} mm Pixels per millimetre.
 * @returns {string} The layers.
 */
export function cuttingMat(sc, color, seed, mm) {
	const { width: w, height: h } = sc;
	const s = hash(seed);
	const span = Math.max(w, h) / mm;
	const r = rng(`${seed}:mat`);
	// the grid starts a little in from the frame's top left, so a bold line sits near each edge
	const ox = (r.range(6, 14) % 10) * mm;
	const oy = (r.range(6, 14) % 10) * mm;
	const grid = (step, width, opacity) => {
		const id = sc.id('grid');
		const t = step * mm;
		const line = (d) => el('path', { d, stroke: LINE, 'stroke-width': width * mm, 'stroke-opacity': opacity, fill: 'none' });
		sc.def(
			el(
				'pattern',
				{ id, patternUnits: 'userSpaceOnUse', x: ox, y: oy, width: t, height: t },
				line(`M0 0V${n(t)}M${n(t)} 0V${n(t)}`),
				line(`M0 0H${n(t)}M0 ${n(t)}H${n(t)}`),
			),
		);
		return el('rect', { width: w, height: h, fill: `url(#${id})` });
	};
	// the numbers: each centimetre along the top, and down the left
	const size = 2.3 * mm;
	const type = { fill: FIGURE, 'fill-opacity': 0.8, 'font-family': "'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': n(size), 'font-weight': 500 };
	let figures = '';
	for (let i = 1, x = ox + 10 * mm; x < w - size; i++, x += 10 * mm) figures += el('text', { ...type, x: n(x + 0.6 * mm), y: n(oy - 1.4 * mm + 10 * mm) }, String(i));
	for (let i = 1, y = oy + 10 * mm; y < h - size; i++, y += 10 * mm) figures += el('text', { ...type, x: n(ox + 0.8 * mm), y: n(y - 0.9 * mm) }, String(i));
	// the 45° guides from the grid's corner, and the knife's healed scores
	const reach = Math.hypot(w, h);
	const guides = el(
		'path',
		{ d: `M${n(ox)} ${n(oy)}l${n(reach)} ${n(reach)}M${n(ox + 100 * mm)} ${n(oy)}l${n(-reach)} ${n(reach)}`, stroke: LINE, 'stroke-width': n(0.3 * mm), 'stroke-opacity': 0.22, 'stroke-dasharray': `${n(3 * mm)} ${n(1.5 * mm)}` },
	);
	let scores = '';
	for (let i = 0; i < 7; i++) {
		const x = r.range(0, w);
		const y = r.range(0, h);
		const a = r.range(0, Math.PI);
		const l = r.range(20, 90) * mm;
		scores += el('path', { d: `M${n(x)} ${n(y)}l${n(Math.cos(a) * l)} ${n(Math.sin(a) * l)}`, stroke: mix(color, '#ffffff', 0.3), 'stroke-width': n(0.25 * mm), 'stroke-opacity': r.range(0.15, 0.35) });
	}
	const speck = speckTile(sc, { size: 288, freq: [0.8 / Math.max(1, mm * 0.3), 0.8 / Math.max(1, mm * 0.3)], octaves: 2, dark: 0.07, light: 0.06, seed: s });
	return (
		mottle(sc, `${seed}:m`, Math.max(2, span / 60), 0.04, 2) +
		el('rect', { width: w, height: h, fill: speck }) +
		scores +
		grid(10, 0.22, 0.2) +
		grid(50, 0.42, 0.42) +
		guides +
		figures
	);
}
