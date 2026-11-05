/**
 * @module @logomarks/mockups/parts/mug
 *
 * One ceramic mug, upright, seen from a little above: a glazed cylinder
 * with its print wrapped round it, the light across it and the window
 * mirrored in the glaze, the rim's rolled edge catching the light, the
 * inside falling into shade below the front rim, a darker unglazed foot,
 * and a D-shaped handle in profile at one side.
 */

import { el } from '../render/svg.js';
import { wrap, cylinderShade, reflections } from './cylinder.js';
import { footShadow } from './tabletop.js';
import { mix, luma } from '../util/color.js';
import { clamp, n } from '../util/num.js';

/** An 11 oz mug in mm: its diameter, height, wall, and the print area's height and gap at the handle. */
export const MUG = Object.freeze({ diameter: 82, height: 95, wall: 3.2, print: 76, gap: 22 });

/**
 * A mug and its shadows.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./mug.js').MugPart} o The mug.
 * @returns {string} The markup.
 */
export function mug(sc, o) {
	const { cx, base, mm, color, inside, handle, light, print, turn = 0, gloss = 1, shadow = 1, elevation = 12 } = o;
	const R = (MUG.diameter / 2) * mm;
	const H = MUG.height * mm;
	const ry = R * Math.sin((elevation * Math.PI) / 180);
	const top = base - H;
	const ids = { body: sc.id('mugbody'), content: sc.id('print') };
	const bodyD = `M${n(cx - R)} ${n(top)}A${n(R)} ${n(ry)} 0 0 1 ${n(cx + R)} ${n(top)}V${n(base)}A${n(R)} ${n(ry)} 0 0 1 ${n(cx - R)} ${n(base)}Z`;
	sc.def(el('clipPath', { id: ids.body }, el('path', { d: bodyD })));
	const dark = luma(color) < 0.35;

	// the print, unrolled: x is the arc from the front's centre
	const ph = print.height * mm;
	const ptop = top + ((MUG.height - print.height) / 2 + 1.5) * mm;
	sc.def(el('g', { id: ids.content }, print.draw(mm, ph)));
	const strips = wrap(sc, { cx, top: ptop, r: R, ry, content: ids.content, turn, height: ph });

	// the inside: the far wall lit, falling into shade under the front rim
	const ri = R - MUG.wall * mm;
	const ryi = ry * (ri / R);
	const inner = sc.id('inner');
	sc.def(
		el(
			'linearGradient',
			{ id: inner, x1: 0, y1: 0, x2: 0, y2: 1 },
			el('stop', { offset: 0, 'stop-color': mix(inside, '#000', 0.04) }),
			el('stop', { offset: 0.5, 'stop-color': mix(inside, '#000', 0.2) }),
			el('stop', { offset: 1, 'stop-color': mix(inside, '#000', 0.5) }),
		),
	);
	const rimLight = sc.id('rimlight');
	sc.def(
		el(
			'linearGradient',
			{ id: rimLight, x1: 0, y1: 0, x2: 1, y2: 0 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.1 }),
			el('stop', { offset: clamp(0.5 + 0.3 * light), 'stop-color': '#fff', 'stop-opacity': 0.85 }),
			el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0.15 }),
		),
	);

	const body = el(
		'g',
		{ 'clip-path': `url(#${ids.body})` },
		el('rect', { x: cx - R, y: top - ry, width: 2 * R, height: H + 2 * ry, fill: color }),
		strips,
		// the glaze over the print: it warms whites and lifts blacks a touch
		el('rect', { x: cx - R, y: top - ry, width: 2 * R, height: H + 2 * ry, fill: '#fff', opacity: 0.035 }),
		el('rect', { x: cx - R, y: top - ry, width: 2 * R, height: H + 2 * ry, fill: cylinderShade(sc, { cx, r: R, light, dark: dark ? 0.3 : 0.4, bright: dark ? 0.06 : 0.1 }) }),
		reflections(sc, { cx, r: R, top: top + 6 * mm, bottom: base - 4 * mm, light, gloss: gloss * (dark ? 0.75 : 1) }),
		// the foot: unglazed, a shade darker, and the shadow under the curve of the base
		el('path', { d: `M${n(cx - R)} ${n(base - 2.4 * mm)}A${n(R)} ${n(ry)} 0 0 0 ${n(cx + R)} ${n(base - 2.4 * mm)}V${n(base + ry + 2)}H${n(cx - R)}Z`, fill: '#000', opacity: dark ? 0.05 : 0.1, filter: sc.blur(0.4 * mm) }),
	);
	const opening =
		el('ellipse', { cx, cy: top, rx: R, ry, fill: mix(color, '#fff', 0.15) }) +
		el('ellipse', { cx, cy: top, rx: R, ry, fill: 'none', stroke: `url(#${rimLight})`, 'stroke-width': 0.9 * mm }) +
		el('ellipse', { cx, cy: top + 0.15 * mm, rx: ri, ry: ryi, fill: `url(#${inner})` }) +
		el('ellipse', { cx, cy: top + 0.15 * mm, rx: ri, ry: ryi, fill: 'none', stroke: '#000', 'stroke-opacity': 0.18, 'stroke-width': 0.4 * mm });

	return footShadow(sc, { cx, cy: base, rx: R, ry, mm, light, strength: shadow, height: MUG.height }) + handlePart(sc, { cx, R, top, mm, color, light, side: handle, dark }) + el('g', {}, body, opening);
}

/**
 * The handle in profile: a D-shaped loop off the side, rounded in section, lit on its outer curve.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {{ cx: number, R: number, top: number, mm: number, color: string, light: number, side: 'left' | 'right', dark: boolean }} o Where the body is, the glaze, the light, and which side.
 * @returns {string} The markup.
 */
function handlePart(sc, { cx, R, top, mm, color, light, side, dark }) {
	const e = cx + R - 3 * mm;
	const a = top + 14 * mm;
	const b = top + 75 * mm;
	const m = (a + b) / 2;
	const p = (x, y) => `${n(x)} ${n(y)}`;
	// a loop of round section: the outer and inner curves, and the line along its middle
	const loop = (out, up, down) => `M${p(e, a - up * mm)}C${p(e + (out - 9) * mm, a - (up + 3) * mm)} ${p(e + out * mm, a + 13 * mm)} ${p(e + (out - 0.5) * mm, m)}C${p(e + (out - 1) * mm, b - 12 * mm)} ${p(e + (out - 11) * mm, b + down * mm)} ${p(e, b + down * mm)}`;
	const outer = loop(33, 4, 4) + 'Z';
	const innerD = `M${p(e + 3 * mm, a + 5.5 * mm)}C${p(e + 16 * mm, a + 4.5 * mm)} ${p(e + 24 * mm, a + 18 * mm)} ${p(e + 23.5 * mm, m)}C${p(e + 23 * mm, b - 16 * mm)} ${p(e + 15 * mm, b - 5 * mm)} ${p(e + 3 * mm, b - 5.5 * mm)}Z`;
	const spine = loop(28.4, -0.6, -0.4);
	const clip = sc.id('hclip');
	const shape = { d: outer + innerD, 'fill-rule': 'evenodd' };
	sc.def(el('clipPath', { id: clip }, el('path', { ...shape, 'clip-rule': 'evenodd' })));
	const lit = side === 'right' ? light : -light;
	const flip = side === 'left' ? { transform: `translate(${n(2 * cx)} 0) scale(-1 1)` } : {};
	return el(
		'g',
		flip,
		el('path', { ...shape, fill: '#000', opacity: 0.2, transform: `translate(${n(1.5 * mm)} ${n(2.5 * mm)})`, filter: sc.blur(1.8 * mm) }),
		el(
			'g',
			{ 'clip-path': `url(#${clip})` },
			el('path', { ...shape, fill: color }),
			// round in section: dark towards both curves, light along its middle on the lit side
			el('path', { d: outer + innerD, fill: 'none', stroke: '#000', 'stroke-opacity': dark ? 0.5 : 0.3, 'stroke-width': 4.5 * mm, filter: sc.blur(1.3 * mm) }),
			el('path', { d: spine, fill: 'none', stroke: '#fff', 'stroke-opacity': clamp((dark ? 0.32 : 0.55) * (0.75 + 0.25 * lit)), 'stroke-width': 1.5 * mm, 'stroke-linecap': 'round', filter: sc.blur(0.6 * mm) }),
			el('rect', { x: e - 2 * mm, y: a - 8 * mm, width: 6 * mm, height: b - a + 16 * mm, fill: '#000', opacity: 0.18, filter: sc.blur(1.5 * mm) }),
		),
	);
}
