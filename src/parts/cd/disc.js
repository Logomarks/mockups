/**
 * @module @arraypress/mockups/parts/cd/disc
 *
 * A compact disc, face up: 120 mm across with a 15 mm hole, a clear hub
 * with its stacking ring, a mirror band, and the programme area to 58 mm,
 * either bare (silver, the light breaking into a rainbow either side of
 * its highlight) or printed (the art, a satin coat over it). Drawn in
 * pixels about its centre, from a scale in pixels per millimetre.
 */

import { el, circlePath, wedgePath } from '../../render/svg.js';
import { clamp, n } from '../../util/num.js';

/** Where things are on a disc, radii in mm (IEC 60908). */
export const DISC = Object.freeze({ radius: 60, hole: 7.5, hub: 11, mirror: 23, print: 58.5 });

/** The colours the bare disc breaks the light into, round from its highlight. */
const RAINBOW = ['#ff3b6b', '#ffb02e', '#e8f25a', '#3ddc84', '#2fc6ff', '#5b6cff', '#c45bff'];

/**
 * A disc.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The disc.
 * @param {number} o.cx Its centre, x (px).
 * @param {number} o.cy Its centre, y (px).
 * @param {number} o.mm Pixels per millimetre.
 * @param {import('../../render/scene.js').PlaceArt | null} o.print What's printed on it, placed in its square (`null`: bare silver).
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} [o.turn=0] How far it's turned, degrees (where the print sits).
 * @returns {string} The markup.
 */
export function disc(sc, { cx, cy, mm, print, light, turn = 0 }) {
	const R = DISC.radius * mm;
	const lx = clamp(light, -1, 1);
	const ids = { clip: sc.id('cd'), area: sc.id('cdarea'), metal: sc.id('metal'), shade: sc.id('cdshade') };
	const ring = (r0, r1) => circlePath(0, 0, r1 * mm) + circlePath(0, 0, r0 * mm);
	sc.def(el('clipPath', { id: ids.clip }, el('path', { d: ring(DISC.hole, DISC.radius), 'clip-rule': 'evenodd' })));
	sc.def(el('clipPath', { id: ids.area }, el('path', { d: ring(DISC.mirror, DISC.print), 'clip-rule': 'evenodd' })));
	sc.def(
		el(
			'linearGradient',
			{ id: ids.metal, x1: 0.5 + 0.45 * lx, y1: 0, x2: 0.5 - 0.45 * lx, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#eef0f2' }),
			el('stop', { offset: 0.45, 'stop-color': '#b9bdc2' }),
			el('stop', { offset: 0.7, 'stop-color': '#d6d9dc' }),
			el('stop', { offset: 1, 'stop-color': '#9ea3a8' }),
		),
	);
	sc.def(
		el(
			'linearGradient',
			{ id: ids.shade, x1: 0.5 + 0.3 * lx, y1: 0, x2: 0.5 - 0.3 * lx, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.12 }),
			el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.12 }),
		),
	);
	// the highlight runs from the light's side through the centre; the rainbow fans either side of it
	const axis = -60 + 40 * lx;
	const sweep = (half, alpha, blur) => el('path', { d: wedgePath(R * 1.1, axis, half) + wedgePath(R * 1.1, axis + 180, half * 0.8), fill: '#fff', 'fill-opacity': alpha, filter: sc.blur(blur * mm) });
	const rainbow = (alpha) =>
		RAINBOW.map((c, i) => {
			const off = 9 + i * 4.5;
			return el('path', { d: wedgePath(R * 1.1, axis + off, 2.6) + wedgePath(R * 1.1, axis - off + 180, 2.6) + wedgePath(R * 1.1, axis - off, 2) + wedgePath(R * 1.1, axis + off + 180, 2), fill: c, 'fill-opacity': alpha });
		}).join('');
	const metal =
		el('circle', { r: R, fill: `url(#${ids.metal})` }) +
		el('g', { filter: sc.blur(2.2 * mm) }, rainbow(0.22)) +
		sweep(14, 0.5, 3) +
		sweep(4, 0.45, 1) +
		// the data's edge, a faint step in the mirror
		el('circle', { r: 52 * mm, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.25, 'stroke-width': 0.35 * mm });
	const face = print
		? el('g', { 'clip-path': `url(#${ids.area})` }, el('circle', { r: R, fill: '#f4f2ee' }), el('g', { transform: `rotate(${n(turn)})` }, print(-R, -R, 2 * R, 2 * R)), sweep(20, 0.1, 4), el('circle', { r: R, fill: `url(#${ids.shade})` }))
		: '';
	const line = (r, color, alpha, width) => el('circle', { r: r * mm, fill: 'none', stroke: color, 'stroke-opacity': alpha, 'stroke-width': width * mm });
	return el(
		'g',
		{ transform: `translate(${n(cx)} ${n(cy)})` },
		el(
			'g',
			{ 'clip-path': `url(#${ids.clip})` },
			metal,
			face,
			// the clear hub: plastic over whatever's behind, its stacking ring catching the light
			el('path', { d: ring(DISC.hole, DISC.hub), fill: '#ffffff', 'fill-opacity': 0.35, 'fill-rule': 'evenodd' }),
			line(DISC.hub - 1.2, '#000', 0.18, 0.3),
			line(DISC.hub - 0.6, '#fff', 0.7, 0.35),
			line(DISC.hub, '#000', 0.12, 0.25),
			line(DISC.mirror, '#000', print ? 0.12 : 0.06, 0.25),
			// the rim: clear plastic past the print, a bright lip and a dark edge
			el('path', { d: ring(DISC.print, DISC.radius), fill: '#ffffff', 'fill-opacity': 0.18, 'fill-rule': 'evenodd' }),
			line(DISC.radius - 0.35, '#fff', 0.6, 0.4),
			line(DISC.radius - 0.05, '#000', 0.25, 0.2),
		),
		line(DISC.hole + 0.1, '#000', 0.3, 0.25),
	);
}

/**
 * A disc's silhouette for its shadow, the hole left open.
 *
 * @param {number} cx Its centre, x (px).
 * @param {number} cy Its centre, y (px).
 * @param {number} mm Pixels per millimetre.
 * @returns {string} Path data (even-odd).
 */
export function discOutline(cx, cy, mm) {
	return circlePath(cx, cy, DISC.radius * mm) + circlePath(cx, cy, DISC.hole * mm);
}
