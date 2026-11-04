/**
 * @module @arraypress/mockups/parts/bottle
 *
 * An insulated steel water bottle standing on a table, seen from a little
 * above: a powder-coated body (a soft matte glaze, so its reflections are
 * broad and dim), shoulders curving in to the neck, a dark screw cap, and a
 * print (a sticker) wrapped round the body.
 */

import { el } from '../render/svg.js';
import { bend, cylinderShade, reflections } from './cylinder.js';
import { footShadow } from './tabletop.js';
import { speckTile } from '../materials/desk.js';
import { mix, luma } from '../util/color.js';
import { n } from '../util/num.js';

/** A 750 ml bottle in mm: the body's diameter, where the shoulder starts, the neck, the cap. */
export const BOTTLE = Object.freeze({ diameter: 73, shoulder: 188, neck: 26.5, neckAt: 224, cap: 28, height: 258 });

/**
 * A bottle and its shadows.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./bottle.js').BottlePart} o The bottle.
 * @returns {string} The markup.
 */
export function bottle(sc, { cx, base, mm, color, light, shadow = 1, cap = '#1b1b1d', print = null, elevation = 10 }) {
	const R = (BOTTLE.diameter / 2) * mm;
	const e = Math.sin((elevation * Math.PI) / 180);
	const ry = R * e;
	const rn = BOTTLE.neck * mm;
	const y = (h) => base - h * mm;
	const p = (a, b) => `${n(a)} ${n(b)}`;
	const bodyD =
		`M${p(cx - R, base)}A${n(R)} ${n(ry)} 0 0 0 ${p(cx + R, base)}V${n(y(BOTTLE.shoulder))}` +
		`C${p(cx + R, y(BOTTLE.shoulder + 22))} ${p(cx + rn, y(BOTTLE.neckAt - 16))} ${p(cx + rn, y(BOTTLE.neckAt))}` +
		`H${n(cx - rn)}C${p(cx - rn, y(BOTTLE.neckAt - 16))} ${p(cx - R, y(BOTTLE.shoulder + 22))} ${p(cx - R, y(BOTTLE.shoulder))}Z`;
	const clip = sc.id('bottle');
	sc.def(el('clipPath', { id: clip }, el('path', { d: bodyD })));
	const dark = luma(color) < 0.35;
	const shoulder = sc.id('shoulder');
	sc.def(
		el(
			'linearGradient',
			{ id: shoulder, gradientUnits: 'userSpaceOnUse', x1: 0, y1: y(BOTTLE.neckAt), x2: 0, y2: y(BOTTLE.shoulder - 6) },
			el('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.25 }),
			el('stop', { offset: 0.45, 'stop-color': '#fff', 'stop-opacity': dark ? 0.12 : 0.2 }),
			el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }),
		),
	);
	const coat = speckTile(sc, { size: 192, freq: [0.9, 0.9], octaves: 1, dark: 0.035, light: 0.03, seed: 41 });
	const body = el(
		'g',
		{ 'clip-path': `url(#${clip})` },
		el('rect', { x: cx - R, y: y(BOTTLE.neckAt + 2), width: 2 * R, height: BOTTLE.neckAt * mm + 2 * ry + 4, fill: color }),
		el('rect', { x: cx - R, y: y(BOTTLE.neckAt + 2), width: 2 * R, height: BOTTLE.neckAt * mm + 2 * ry + 4, fill: coat }),
		print
			? el(
					'g',
					{ filter: bend(sc, { cx, r: R, ry, top: y(print.center + print.height / 2), height: print.height * mm, turn: print.turn ?? 0 }) },
					el('use', { href: `#${print.content}`, transform: `translate(${n(cx)} ${n(y(print.center + print.height / 2))})` }),
				)
			: '',
		el('rect', { x: cx - R, y: y(BOTTLE.neckAt + 2), width: 2 * R, height: BOTTLE.neckAt * mm + 2 * ry + 4, fill: cylinderShade(sc, { cx, r: R, light, dark: dark ? 0.35 : 0.45, bright: 0.08 }) }),
		el('rect', { x: cx - R, y: y(BOTTLE.neckAt + 2), width: 2 * R, height: (BOTTLE.neckAt - BOTTLE.shoulder + 8) * mm, fill: `url(#${shoulder})` }),
		el('g', { filter: sc.blur(R * 0.05) }, reflections(sc, { cx, r: R, top: y(BOTTLE.shoulder - 4), bottom: base - 6 * mm, light, gloss: 0.4 })),
		el('path', { d: `M${p(cx - R, base - 1.5 * mm)}A${n(R)} ${n(ry)} 0 0 0 ${p(cx + R, base - 1.5 * mm)}`, fill: 'none', stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': 2.4 * mm, filter: sc.blur(0.8 * mm) }),
	);
	return footShadow(sc, { cx, cy: base, rx: R, ry, mm, light, strength: shadow, height: BOTTLE.height }) + body + capPart(sc, { cx, top: y(BOTTLE.height), bottom: y(BOTTLE.neckAt - 1), r: BOTTLE.cap * mm, e, color: cap, light, mm });
}

/**
 * The screw cap: a short dark cylinder with a soft top and fine grip ridges.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {{ cx: number, top: number, bottom: number, r: number, e: number, color: string, light: number, mm: number }} o Where it is, its radius, the view's sine of elevation, its colour, the light.
 * @returns {string} The markup.
 */
function capPart(sc, { cx, top, bottom, r, e, color, light, mm }) {
	const ry = r * e;
	const d = `M${n(cx - r)} ${n(top + 3 * mm)}Q${n(cx - r)} ${n(top - ry)} ${n(cx)} ${n(top - ry)}Q${n(cx + r)} ${n(top - ry)} ${n(cx + r)} ${n(top + 3 * mm)}V${n(bottom)}A${n(r)} ${n(ry)} 0 0 1 ${n(cx - r)} ${n(bottom)}Z`;
	const clip = sc.id('cap');
	sc.def(el('clipPath', { id: clip }, el('path', { d })));
	let ridges = '';
	for (let i = -8; i <= 8; i++) {
		const x = cx + r * Math.sin((i / 9) * (Math.PI / 2));
		ridges += el('line', { x1: x, y1: top + 8 * mm, x2: x, y2: bottom - 1 * mm, stroke: '#fff', 'stroke-opacity': 0.06, 'stroke-width': 0.5 * mm });
	}
	// the carry loop: a flat strap arching over the cap
	const lw = 3.2 * mm;
	const loopD = `M${n(cx - r * 0.5)} ${n(top + 2 * mm)}C${n(cx - r * 0.55)} ${n(top - 15 * mm)} ${n(cx + r * 0.55)} ${n(top - 15 * mm)} ${n(cx + r * 0.5)} ${n(top + 2 * mm)}`;
	const loop =
		el('path', { d: loopD, fill: 'none', stroke: color, 'stroke-width': lw, 'stroke-linecap': 'round' }) +
		el('path', { d: loopD, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.22, 'stroke-width': lw * 0.3, transform: `translate(${n(light * 0.8 * mm)} ${n(-0.6 * mm)})`, filter: sc.blur(0.4 * mm) });
	return loop + el(
		'g',
		{ 'clip-path': `url(#${clip})` },
		el('path', { d, fill: color }),
		ridges,
		el('rect', { x: cx - r, y: top - ry, width: 2 * r, height: bottom - top + 2 * ry, fill: cylinderShade(sc, { cx, r, light, dark: 0.5, bright: 0.1 }) }),
		reflections(sc, { cx, r, top: top + 2 * mm, bottom: bottom - 1 * mm, light, gloss: 0.6 }),
		el('ellipse', { cx, cy: top + 1 * mm, rx: r * 0.92, ry: Math.max(1, ry * 0.9), fill: mix(color, '#ffffff', 0.12), opacity: 0.8 }),
		el('rect', { x: cx - r, y: bottom - 2 * mm, width: 2 * r, height: 4 * mm, fill: '#000', opacity: 0.35, filter: sc.blur(0.6 * mm) }),
	);
}
