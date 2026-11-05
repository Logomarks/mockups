/**
 * @module @logomarks/mockups/parts/record
 *
 * One record, front on: its body, the light on its face, its label, and the
 * spindle hole punched through all of them (the ground shows through).
 */

import { el, circlePath } from '../render/svg.js';
import { n } from '../util/num.js';
import { body, isDark } from '../materials/vinyl.js';
import { surface, RADII } from '../materials/surface.js';
import { label } from './label.js';

/**
 * A record.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The record.
 * @param {number} o.cx Its centre, x.
 * @param {number} o.cy Its centre, y.
 * @param {number} o.r Its radius.
 * @param {import('../materials/vinyl.js').Material} o.material What it's pressed in.
 * @param {import('./label.js').Label} o.label Its label.
 * @param {string} o.ground The ground's colour.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {string} o.seed The seed.
 * @param {number} [o.shift=0] How far to move the label's type sideways.
 * @returns {string} The markup.
 */
export function record(sc, { cx, cy, r, material, label: lb, ground, light, seed, shift = 0 }) {
	const disc = sc.id('disc');
	sc.def(el('clipPath', { id: disc }, el('path', { d: circlePath(0, 0, r) + circlePath(0, 0, RADII.hole * r), 'clip-rule': 'evenodd' })));
	const dark = isDark(material, ground);
	const { face, halo } = surface(sc, { r, material, dark, light, seed });
	return el(
		'g',
		{ transform: `translate(${n(cx)} ${n(cy)})` },
		halo,
		el('g', { 'clip-path': `url(#${disc})` }, body(sc, material, r, seed, ground), face, label(sc, lb, RADII.label * r, shift)),
		el('circle', { r: RADII.hole * r, fill: 'none', stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': r * 0.004 }),
	);
}

/**
 * A record's silhouette for its shadow: the label and the rim stop the light; the rest stops as much as the vinyl does.
 * The spindle hole is left open, wider than it is (the blur would close it), so light shows through it as in a photo.
 *
 * @param {number} x Its centre, x.
 * @param {number} y Its centre, y.
 * @param {number} r Its radius.
 * @param {number} opacity How much light the vinyl stops.
 * @param {string} fill The shadow's colour.
 * @returns {string} The markup.
 */
export function silhouette(x, y, r, opacity, fill) {
	const hole = circlePath(x, y, RADII.hole * r * 3);
	if (opacity >= 0.98) return el('path', { d: circlePath(x, y, r) + hole, fill, 'fill-rule': 'evenodd' });
	return (
		el('path', { d: circlePath(x, y, r) + circlePath(x, y, RADII.label * r), fill, 'fill-opacity': opacity, 'fill-rule': 'evenodd' }) +
		el('circle', { cx: x, cy: y, r: r * 0.975, fill: 'none', stroke: fill, 'stroke-width': r * 0.04, 'stroke-opacity': 0.3 }) +
		el('path', { d: circlePath(x, y, RADII.label * r) + hole, fill, 'fill-rule': 'evenodd' })
	);
}

/**
 * Markup with a record's spindle hole cut out of it, so its own shadow doesn't darken the ground seen through the hole.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {number} x The record's centre, x.
 * @param {number} y The record's centre, y.
 * @param {number} r The record's radius.
 * @param {string} markup What to cut the hole out of.
 * @param {number} [hole] The hole's radius (a record's spindle hole, a little wider).
 * @returns {string} The markup, masked.
 */
export function punch(sc, x, y, r, markup, hole = RADII.hole * r * 1.15) {
	if (!markup) return '';
	const m = sc.id('punch');
	const pad = r * 1.5;
	sc.def(
		el(
			'mask',
			{ id: m, maskUnits: 'userSpaceOnUse', x: x - 2 * pad, y: y - 2 * pad, width: 4 * pad, height: 4 * pad },
			el('rect', { x: x - 2 * pad, y: y - 2 * pad, width: 4 * pad, height: 4 * pad, fill: '#fff' }),
			el('circle', { cx: x, cy: y, r: hole, fill: '#000' }),
		),
	);
	return el('g', { mask: `url(#${m})` }, markup);
}
