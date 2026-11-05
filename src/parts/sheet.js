/**
 * @module @logomarks/mockups/parts/sheet
 *
 * A flat printed sheet lying on a surface, seen from above: a card, a
 * letter, an envelope, a ticket, a pass. Its outline (a rectangle with
 * rounded corners, or a path of its own) is filled with the paper, the art
 * cut to it, and the stock's finish. Its thickness shows as a thin band of
 * edge along the side nearer the camera (painted, for an edge-painted
 * card), the cut edge catches the light, and it casts three soft shadows:
 * a tight contact line, a near shadow and a wide ambient one, spreading as
 * the sheet lifts off the surface. Sizes are in pixels; shadows are
 * measured in millimetres, so every sheet in a frame shares one light.
 */

import { el } from '../render/svg.js';
import { finish } from '../materials/paper.js';
import { mix } from '../util/color.js';
import { clamp, n } from '../util/num.js';

/**
 * A rectangle with rounded corners as path data, centred on the origin.
 *
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @param {number} [r=0] The corners' radius.
 * @returns {string} Path data.
 */
export function outline(w, h, r = 0) {
	const x = -w / 2;
	const y = -h / 2;
	const k = clamp(r, 0, Math.min(w, h) / 2);
	if (!k) return `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;
	return (
		`M${n(x + k)} ${n(y)}h${n(w - 2 * k)}a${n(k)} ${n(k)} 0 0 1 ${n(k)} ${n(k)}v${n(h - 2 * k)}a${n(k)} ${n(k)} 0 0 1 ${n(-k)} ${n(k)}` +
		`h${n(-(w - 2 * k))}a${n(k)} ${n(k)} 0 0 1 ${n(-k)} ${n(-k)}v${n(-(h - 2 * k))}a${n(k)} ${n(k)} 0 0 1 ${n(k)} ${n(-k)}z`
	);
}

/**
 * The shadows a flat thing casts on what it lies on, in screen space (they fall away from the light whatever its turn).
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The caster.
 * @param {string} o.d Its outline as path data, centred on the origin.
 * @param {number} o.cx Its centre, x.
 * @param {number} o.cy Its centre, y.
 * @param {number} [o.angle=0] Its turn, in degrees.
 * @param {number} o.mm Pixels per millimetre.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} [o.lift=0.3] How far it's off the surface, 0 (flat) to 1 (curling up, or held over it).
 * @param {number} [o.strength=1] How dark, 1 natural.
 * @returns {string} The shadow layers.
 */
export function flatShadow(sc, { d, cx, cy, angle = 0, mm, light, lift = 0.3, strength = 1 }) {
	if (strength <= 0) return '';
	const away = -clamp(light, -1, 1);
	const L = clamp(lift, 0, 3);
	const layer = (off, sigma, alpha) =>
		el('path', {
			d,
			transform: `translate(${n(cx + away * off * 0.6 * mm)} ${n(cy + off * mm)}) rotate(${n(angle)})`,
			fill: '#000',
			opacity: clamp(alpha * strength),
			filter: sc.blur(Math.max(0.4, sigma * mm)),
		});
	return layer(0.25 + 0.4 * L, 0.45 + 0.4 * L, 0.32) + layer(0.8 + 2.4 * L, 1.1 + 3 * L, 0.2) + layer(2 + 6 * L, 4 + 10 * L, 0.11);
}

/**
 * A sheet, with its shadows.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./sheet.js').SheetPart} o The sheet.
 * @returns {string} The markup: shadows, then the sheet.
 */
export function sheet(sc, o) {
	const { cx, cy, w, h, angle = 0, radius = 0, art = null, stock, mm, light, thickness = 0, lift = 0.25, shadow = 1, seed = 0 } = o;
	const d = o.d ?? outline(w, h, radius);
	const clip = sc.id('sheet');
	sc.def(el('clipPath', { id: clip }, el('path', { d })));
	const paper = o.color ?? stock.color;
	const edge = o.edge ?? mix(paper, '#000000', 0.12);
	const t = Math.max(0, thickness);
	const lx = clamp(light, -1, 1);
	// the band of edge towards the camera: the sheet's outline dropped by its thickness, shaded where it turns from the light
	const band =
		t > 0.15
			? el('path', { d, transform: `translate(${n(cx)} ${n(cy + t)}) rotate(${n(angle)})`, fill: mix(edge, '#000000', 0.18) }) +
				el('path', { d, transform: `translate(${n(cx)} ${n(cy + t * 0.55)}) rotate(${n(angle)})`, fill: edge })
			: '';
	const rim = sc.id('rim');
	const a = (-angle * Math.PI) / 180;
	const dx = 0.5 * lx;
	const dy = -0.5;
	sc.def(
		el(
			'linearGradient',
			{ id: rim, x1: 0.5 + dx * Math.cos(a) - dy * Math.sin(a), y1: 0.5 + dx * Math.sin(a) + dy * Math.cos(a), x2: 0.5 - dx * Math.cos(a) + dy * Math.sin(a), y2: 0.5 - dx * Math.sin(a) - dy * Math.cos(a) },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.55 }),
			el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0.12 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.22 }),
		),
	);
	const face = el(
		'g',
		{ transform: `translate(${n(cx)} ${n(cy)}) rotate(${n(angle)})` },
		el(
			'g',
			{ 'clip-path': `url(#${clip})` },
			el('path', { d, fill: paper }),
			art ? art(-w / 2, -h / 2, w, h) : '',
			o.overlay ?? '',
			o.finish === false ? '' : finish(sc, { stock, shape: el('path', { d }), mm, light, angle, seed }),
		),
		el('path', { d, fill: 'none', stroke: `url(#${rim})`, 'stroke-width': Math.max(0.6, 0.12 * mm) }),
	);
	return flatShadow(sc, { d, cx, cy: cy + t, angle, mm, light, lift, strength: shadow }) + band + face;
}
