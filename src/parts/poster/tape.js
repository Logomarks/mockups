/**
 * @module @logomarks/mockups/parts/poster/tape
 *
 * A strip of masking tape across a poster's corner: cream crêpe paper a
 * little translucent, its ends torn ragged, the crêpe's faint ribs, a
 * sheen and a tight shadow. Drawn in pixels from millimetres.
 */

import { el } from '../../render/svg.js';
import { rng } from '../../util/rng.js';
import { n } from '../../util/num.js';

/**
 * A strip's outline about its centre: straight sides, torn ends.
 *
 * @param {number} len Its length (px).
 * @param {number} w Its width (px).
 * @param {import('../../util/rng.js').Rng} r The generator.
 * @returns {string} Path data.
 */
export function stripPath(len, w, r) {
	const steps = 7;
	const end = (x, dir) =>
		Array.from({ length: steps + 1 }, (_, i) => {
			const y = -w / 2 + (w * i) / steps;
			return `${n(x + dir * r.range(0, w * 0.09))} ${n(dir > 0 ? y : -y)}`;
		});
	return `M${end(len / 2, 1).join('L')}L${end(-len / 2, -1).join('L')}Z`;
}

/**
 * A piece of tape.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The tape.
 * @param {number} o.x Its centre, x (px).
 * @param {number} o.y Its centre, y (px).
 * @param {number} o.angle Its turn, degrees.
 * @param {number} o.mm Pixels per millimetre.
 * @param {string} o.seed The seed (its torn ends).
 * @param {number} [o.length=52] Its length, mm.
 * @param {number} [o.width=19] Its width, mm.
 * @returns {string} The markup.
 */
export function tape(sc, { x, y, angle, mm, seed, length = 52, width = 19 }) {
	const r = rng(`${seed}:tape`);
	const d = stripPath(length * mm, width * mm, r);
	const ribs = sc.id('crepe');
	sc.def(el('pattern', { id: ribs, patternUnits: 'userSpaceOnUse', width: 1.1 * mm, height: 4 * mm }, el('rect', { width: 0.45 * mm, height: 4 * mm, fill: '#000', 'fill-opacity': 0.05 })));
	return el(
		'g',
		{ transform: `translate(${n(x)} ${n(y)}) rotate(${n(angle)})` },
		el('path', { d, fill: '#000', opacity: 0.16, transform: `translate(${n(-0.3 * mm)} ${n(0.5 * mm)})`, filter: sc.blur(0.6 * mm) }),
		el('path', { d, fill: '#efe3c2', 'fill-opacity': 0.84 }),
		el('path', { d, fill: `url(#${ribs})` }),
		el('path', { d, fill: '#fff', 'fill-opacity': 0.12, transform: `scale(1 0.5) translate(0 ${n(-width * 0.5 * mm)})` }),
		el('path', { d, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.35, 'stroke-width': 0.25 * mm }),
	);
}
