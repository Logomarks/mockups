/**
 * @module @logomarks/mockups/parts/clasp
 *
 * A lanyard's hardware, in millimetres: the metal crimp the strap's two
 * ends are sewn into, a swivel ring, and a lobster clasp hooked through a
 * badge pocket's slot. Brushed steel: lit across its round, a bright
 * specular line, a dark edge.
 */

import { el } from '../render/svg.js';
import { smooth } from './curve.js';
import { n } from '../util/num.js';

/**
 * The steel's gradient across a part, defined once per direction.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {boolean} [across=true] Lit across the part's width (else along its height).
 * @returns {string} A `url(#…)` fill.
 */
function steel(sc, across = true) {
	const g = sc.id('steel');
	sc.def(
		el(
			'linearGradient',
			{ id: g, x1: 0, y1: 0, x2: across ? 1 : 0, y2: across ? 0 : 1 },
			el('stop', { offset: 0, 'stop-color': '#55585d' }),
			el('stop', { offset: 0.22, 'stop-color': '#c9ccd0' }),
			el('stop', { offset: 0.34, 'stop-color': '#f7f8f9' }),
			el('stop', { offset: 0.5, 'stop-color': '#a7abb0' }),
			el('stop', { offset: 0.8, 'stop-color': '#6d7176' }),
			el('stop', { offset: 1, 'stop-color': '#3d4044' }),
		),
	);
	return `url(#${g})`;
}

/**
 * The hardware from the strap's end down to the slot, and its shadow.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o Where it runs.
 * @param {number} o.top The crimp's top (where the strap ends go in), y in mm.
 * @param {number} o.slot The slot's centre, y in mm (the clasp hooks through it).
 * @param {number} o.strap The strap's width, mm.
 * @returns {{ shadow: string, body: string }} Its silhouette in black, and the hardware.
 */
export function clasp(sc, { top, slot, strap }) {
	const cw = strap + 2;
	const ch = 9;
	const crimp = `M${n(-cw / 2)} ${n(top)}h${n(cw)}l-1.5 ${ch}h${n(-cw + 3)}z`;
	const ringY = top + ch + 4;
	const ring = { cx: 0, cy: ringY, r: 3.6 };
	// the lobster clasp: a teardrop from below the ring to the slot, its gate a thin bar on one side
	const y0 = ringY + 4.5;
	const y1 = slot + 1.2;
	const len = y1 - y0;
	const body = smooth([
		[0, y0],
		[3.2, y0 + len * 0.18],
		[4.6, y0 + len * 0.55],
		[3.4, y1 - 1.5],
		[0, y1],
		[-3.4, y1 - 1.5],
		[-4.6, y0 + len * 0.55],
		[-3.2, y0 + len * 0.18],
	]);
	const shapes = el('path', { d: crimp }) + el('circle', { ...ring, fill: 'none', stroke: '#000', 'stroke-width': 1.5 }) + el('path', { d: body });
	const hw = el(
		'g',
		{},
		el('circle', { ...ring, fill: 'none', stroke: steel(sc, false), 'stroke-width': 1.5 }),
		el('circle', { ...ring, r: ring.r + 0.6, fill: 'none', stroke: '#000', 'stroke-width': 0.2, opacity: 0.35 }),
		el('path', { d: body, fill: steel(sc) }),
		el('path', { d: `M-1.6 ${n(y0 + len * 0.22)}Q-2.6 ${n(y0 + len * 0.55)} -1.6 ${n(y1 - 3)}`, fill: 'none', stroke: '#2c2e31', 'stroke-width': 0.5, opacity: 0.6 }),
		el('path', { d: body, fill: 'none', stroke: '#1d1f22', 'stroke-width': 0.25, opacity: 0.6 }),
		el('path', { d: crimp, fill: steel(sc) }),
		el('path', { d: `M${n(-cw / 2 + 0.6)} ${n(top + 1.2)}h${n(cw - 1.2)}`, stroke: '#fff', 'stroke-width': 0.5, opacity: 0.7 }),
		el('path', { d: crimp, fill: 'none', stroke: '#1d1f22', 'stroke-width': 0.25, opacity: 0.6 }),
		// the slot's lip, where the clasp passes under the plastic
		el('rect', { x: -6, y: slot - 0.4, width: 12, height: 1.6, rx: 0.8, fill: '#000', opacity: 0.25, filter: sc.blur(0.4) }),
	);
	return { shadow: shapes, body: hw };
}
