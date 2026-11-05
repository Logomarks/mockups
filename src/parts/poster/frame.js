/**
 * @module @logomarks/mockups/parts/poster/frame
 *
 * A framed print: a thin moulding (black, white or oak) mitred at the
 * corners, each side shaded by which way it faces the light; a white mat
 * with its bevel cut showing the board's core, lit on the sides that face
 * the light; the print in the mat's window; the frame's shadow on the mat
 * and the glass's sheen over everything. Drawn in pixels from millimetres.
 */

import { el } from '../../render/svg.js';
import { glass } from '../../materials/glass.js';
import { mix } from '../../util/color.js';
import { hash } from '../../util/rng.js';
import { clamp, n } from '../../util/num.js';

/** The mouldings: face colour, and how much it shines. */
export const FRAMES = Object.freeze({
	black: Object.freeze({ color: '#1c1c1e', shine: 0.5 }),
	white: Object.freeze({ color: '#efeeea', shine: 0.25 }),
	wood: Object.freeze({ color: '#b98a5c', shine: 0.15 }),
});

/** The moulding's face width, and the bevel's, in mm. */
export const MOULDING = 20;
const BEVEL = 1.6;

/**
 * A framed print, its outside `(w + 2 * (mat + MOULDING)) × (h + …)`.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The frame.
 * @param {number} o.cx Its centre, x (px).
 * @param {number} o.cy Its centre, y (px).
 * @param {number} o.w The print's width showing (px).
 * @param {number} o.h The print's height showing (px).
 * @param {number} o.mat The mat's border (px).
 * @param {number} o.mm Pixels per millimetre.
 * @param {'black' | 'white' | 'wood'} o.frame The moulding.
 * @param {import('../../render/scene.js').PlaceArt} o.art The print, placed in its box.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {string} o.seed The seed (the wood's grain).
 * @returns {string} The markup.
 */
export function framed(sc, { cx, cy, w, h, mat, mm, frame, art, light, seed }) {
	const lx = clamp(light, -1, 1);
	const f = FRAMES[frame];
	const m = MOULDING * mm;
	const iw = w / 2 + mat; // the opening's half width
	const ih = h / 2 + mat;
	const ow = iw + m;
	const oh = ih + m;
	// each side faces up, right, down or left; the light comes from above, on its side
	const facing = { top: 0.2, right: lx * 0.12, bottom: -0.2, left: -lx * 0.12 };
	const tone = (k) => (k >= 0 ? mix(f.color, '#ffffff', k * (frame === 'black' ? 0.6 : 0.5)) : mix(f.color, '#000000', -k * (frame === 'white' ? 0.5 : 0.8)));
	const sides = {
		top: `M${n(-ow)} ${n(-oh)}H${n(ow)}L${n(iw)} ${n(-ih)}H${n(-iw)}Z`,
		right: `M${n(ow)} ${n(-oh)}V${n(oh)}L${n(iw)} ${n(ih)}V${n(-ih)}Z`,
		bottom: `M${n(ow)} ${n(oh)}H${n(-ow)}L${n(-iw)} ${n(ih)}H${n(iw)}Z`,
		left: `M${n(-ow)} ${n(oh)}V${n(-oh)}L${n(-iw)} ${n(-ih)}V${n(ih)}Z`,
	};
	const grain = frame === 'wood' ? woodGrain(sc, mm, seed) : null;
	// the profile: rounded, so each side is lighter along its outer half and darker into the rebate
	const profile = (key) => {
		const id = sc.id('profile');
		const [x1, y1, x2, y2] = { top: [0, 0, 0, 1], bottom: [0, 1, 0, 0], left: [0, 0, 1, 0], right: [1, 0, 0, 0] }[/** @type {'top'} */ (key)];
		sc.def(
			el(
				'linearGradient',
				{ id, x1, y1, x2, y2 },
				el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.1 + 0.25 * f.shine }),
				el('stop', { offset: 0.35, 'stop-color': '#fff', 'stop-opacity': 0.05 * f.shine }),
				el('stop', { offset: 0.8, 'stop-color': '#000', 'stop-opacity': 0.08 }),
				el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.3 }),
			),
		);
		return `url(#${id})`;
	};
	const moulding = Object.entries(sides)
		.map(([key, d]) => el('path', { d, fill: tone(facing[/** @type {'top'} */ (key)]) }) + (grain ? el('path', { d, fill: key === 'top' || key === 'bottom' ? grain.across : grain.down }) : '') + el('path', { d, fill: profile(key) }))
		.join('');
	const mitres = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => el('line', { x1: sx * ow, y1: sy * oh, x2: sx * iw, y2: sy * ih, stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': Math.max(0.5, 0.15 * mm) })).join('');
	// the mat: white board, its window's bevel showing the core, lit where it faces the light
	const ax = w / 2;
	const ay = h / 2;
	const b = BEVEL * mm;
	const bevel = {
		top: `M${n(-ax - b)} ${n(-ay - b)}H${n(ax + b)}L${n(ax)} ${n(-ay)}H${n(-ax)}Z`,
		right: `M${n(ax + b)} ${n(-ay - b)}V${n(ay + b)}L${n(ax)} ${n(ay)}V${n(-ay)}Z`,
		bottom: `M${n(ax + b)} ${n(ay + b)}H${n(-ax - b)}L${n(-ax)} ${n(ay)}H${n(ax)}Z`,
		left: `M${n(-ax - b)} ${n(ay + b)}V${n(-ay - b)}L${n(-ax)} ${n(-ay)}V${n(ay)}Z`,
	};
	// the bevel faces into the window: the bottom edge's bevel faces up (lit), the top's faces down
	const lit = { top: -0.3, right: -0.2 * lx, bottom: 0.25, left: 0.2 * lx };
	const matBoard = mat > 0 ? el('path', { d: `M${n(-iw)} ${n(-ih)}H${n(iw)}V${n(ih)}H${n(-iw)}Z`, fill: '#f5f3ee' }) + Object.entries(bevel).map(([k, d]) => el('path', { d, fill: lit[/** @type {'top'} */ (k)] >= 0 ? '#ffffff' : mix('#f5f3ee', '#000', -lit[/** @type {'top'} */ (k)] * 0.5) })).join('') : '';
	const clip = sc.id('window');
	sc.def(el('clipPath', { id: clip }, el('rect', { x: -ax, y: -ay, width: 2 * ax, height: 2 * ay })));
	const print = el('g', { 'clip-path': `url(#${clip})` }, el('rect', { x: -ax, y: -ay, width: 2 * ax, height: 2 * ay, fill: '#fff' }), art(-ax, -ay, 2 * ax, 2 * ay));
	// the moulding's shadow on the mat (or the print), falling away from the light
	const inset = sc.id('inset');
	sc.def(el('clipPath', { id: inset }, el('rect', { x: -iw, y: -ih, width: 2 * iw, height: 2 * ih })));
	const away = -lx;
	const rebate = el('g', { 'clip-path': `url(#${inset})` }, el('rect', { x: -iw, y: -ih, width: 2 * iw, height: 2 * ih, fill: 'none', stroke: '#000', 'stroke-opacity': 0.32, 'stroke-width': 3 * mm, transform: `translate(${n(away * 1.2 * mm)} ${n(1.6 * mm)})`, filter: sc.blur(1.6 * mm) }));
	// the window's own shadow on the print, from the mat's thickness
	const sunk = mat > 0 ? el('g', { 'clip-path': `url(#${clip})` }, el('rect', { x: -ax, y: -ay, width: 2 * ax, height: 2 * ay, fill: 'none', stroke: '#000', 'stroke-opacity': 0.18, 'stroke-width': 1.2 * mm, transform: `translate(${n(away * 0.4 * mm)} ${n(0.6 * mm)})`, filter: sc.blur(0.6 * mm) })) : '';
	const outer = el('rect', { x: -ow, y: -oh, width: 2 * ow, height: 2 * oh, fill: 'none', stroke: '#000', 'stroke-opacity': 0.35, 'stroke-width': Math.max(0.6, 0.2 * mm) });
	const pane = glass(sc, { outline: [[-iw, -ih], [iw, -ih], [iw, ih], [-iw, ih]], light, strength: 1.2, band: 0.3 });
	return el('g', { transform: `translate(${n(cx)} ${n(cy)})` }, matBoard, print, sunk, rebate, pane, moulding, mitres, outer);
}

/**
 * The oak's grain, along the moulding: turbulence stretched along the wood, as two fills (across for the top and bottom, down the sides).
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {number} mm Pixels per millimetre.
 * @param {string} seed The seed.
 * @returns {{ across: string, down: string }} The fills (`url(#…)`).
 */
function woodGrain(sc, mm, seed) {
	const make = (fx, fy) => {
		const f = sc.id('grain');
		const p = sc.id('wood');
		const size = 400 * mm;
		sc.def(
			el(
				'filter',
				{ id: f, x: 0, y: 0, width: '100%', height: '100%', filterUnits: 'objectBoundingBox' },
				el('feTurbulence', { type: 'fractalNoise', baseFrequency: `${n(fx / mm)} ${n(fy / mm)}`, numOctaves: 3, seed: hash(seed) % 997 }),
				el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.24  0 0 0 0 0.14  0 0 0 0 0.06  1.4 0 0 0 -0.55' }),
			),
		);
		sc.def(el('pattern', { id: p, patternUnits: 'userSpaceOnUse', width: size, height: size }, el('rect', { width: size, height: size, fill: '#fff', filter: `url(#${f})` })));
		return `url(#${p})`;
	};
	return { across: make(0.004, 0.35), down: make(0.35, 0.004) };
}
