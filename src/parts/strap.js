/**
 * @module @arraypress/mockups/parts/strap
 *
 * A woven strap lying in a curve (a lanyard's): a band along a smooth
 * spine, its weave, darker hemmed edges, the name printed along it again
 * and again (set glyph by glyph along the curve, so it renders the same
 * everywhere without `textPath`), and its shadow. In millimetres, in the
 * caller's frame.
 */

import { el, esc } from '../render/svg.js';
import { smooth, tubePoints } from './curve.js';
import { speckTile } from '../materials/desk.js';
import { mix } from '../util/color.js';
import { n } from '../util/num.js';

/** The type a strap is printed in. */
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Points evenly spaced along a smooth path through the spine (Catmull-Rom), with their direction.
 *
 * @param {[number, number][]} spine The spine.
 * @param {number} step The spacing.
 * @returns {{ x: number, y: number, a: number }[]} Points and their angle in degrees.
 */
export function walk(spine, step) {
	/** @type {[number, number][]} */
	const dense = [];
	const k = spine.length;
	const at = (i) => spine[Math.max(0, Math.min(k - 1, i))];
	for (let i = 0; i < k - 1; i++) {
		const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
		for (let t = 0; t < 1; t += 0.02) {
			const t2 = t * t;
			const t3 = t2 * t;
			const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
			dense.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
		}
	}
	dense.push(spine[k - 1]);
	/** @type {{ x: number, y: number, a: number }[]} */
	const out = [];
	let carry = 0;
	for (let i = 1; i < dense.length; i++) {
		const [ax, ay] = dense[i - 1];
		const [bx, by] = dense[i];
		const l = Math.hypot(bx - ax, by - ay);
		let s = carry;
		while (s <= l) {
			const t = l ? s / l : 0;
			out.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, a: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI });
			s += step;
		}
		carry = s - l;
	}
	return out;
}

/**
 * A strap.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./strap.js').StrapPart} o The strap: its spine and width (mm), colours, the words on it, and the light.
 * @returns {{ shadow: string, body: string }} Its silhouette in black (to cast as a shadow) and the strap.
 */
export function strap(sc, { spine, width, color, ink, text = '', light, flip = false }) {
	// the band, drawn through the same smooth curve the type follows
	const path = walk(spine, 3).map((p) => /** @type {[number, number]} */ ([p.x, p.y]));
	const d = smooth(tubePoints(path, path.map(() => width), false));
	const clip = sc.id('strap');
	sc.def(el('clipPath', { id: clip }, el('path', { d })));
	const edge = mix(color, '#000000', 0.25);
	const weave = speckTile(sc, { size: 12, freq: [2.4, 1.2], octaves: 1, dark: 0.1, light: 0.08, seed: 3 });
	// the hems: lines a millimetre in from each edge
	const hem = (off) => smooth(tubePoints(path, path.map(() => width - off * 2), false));
	let type = '';
	if (text) {
		const size = width * 0.42;
		const advance = size * 0.74;
		const word = `${text.toUpperCase()}   `;
		const glyphs = walk(flip ? [...spine].reverse() : spine, advance);
		type = el(
			'g',
			{ fill: ink, 'font-family': FONT, 'font-weight': 700, 'font-size': size, 'text-anchor': 'middle', opacity: 0.92 },
			...glyphs.map((g, i) => {
				const c = word[i % word.length];
				if (c === ' ') return '';
				return el('text', { transform: `translate(${n(g.x)} ${n(g.y)}) rotate(${n(g.a)}) translate(0 ${n(size * 0.36)})` }, esc(c));
			}),
		);
	}
	const lit = sc.id('strapsheen');
	sc.def(
		el(
			'linearGradient',
			{ id: lit, x1: 0.5 + 0.4 * light, y1: 0, x2: 0.5 - 0.4 * light, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.12 }),
			el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.12 }),
		),
	);
	const body = el(
		'g',
		{},
		el('path', { d, fill: color }),
		el(
			'g',
			{ 'clip-path': `url(#${clip})` },
			type,
			el('path', { d, fill: weave, opacity: 0.8 }),
			el('path', { d: hem(1.2), fill: 'none', stroke: edge, 'stroke-width': 0.35, 'stroke-dasharray': '1.2 0.8', opacity: 0.5 }),
			el('path', { d, fill: 'none', stroke: edge, 'stroke-width': 1.6, opacity: 0.55, filter: sc.blur(0.5) }),
			el('path', { d, fill: `url(#${lit})` }),
		),
	);
	const shadow = el('path', { d, fill: '#000' });
	return { shadow, body };
}
