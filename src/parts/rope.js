/**
 * @module @logomarks/mockups/parts/rope
 *
 * A twisted rope (a bag's handle) along a path: the rope's body, darker at
 * its sides so it reads round, the lay of its strands as short bands across
 * it, a highlight along its lit side, and the soft shadow it throws on the
 * panel behind it. Drawn in whatever frame the path is in.
 */

import { el } from '../render/svg.js';
import { mix } from '../util/color.js';
import { clamp, n } from '../util/num.js';

/**
 * A rope along a path.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./rope.js').RopePart} o The path, its thickness and colour, the light, and where its shadow may fall.
 * @returns {string} The markup.
 */
export function rope(sc, { d, width, color, light, shade = 0, clip = null, blurUnit = 1 }) {
	const w = width;
	const lx = clamp(light, -1, 1);
	let shadow = '';
	if (clip) {
		const c = sc.id('ropeclip');
		sc.def(el('clipPath', { id: c }, el('rect', { width: clip.width, height: clip.height })));
		shadow = el('g', { 'clip-path': `url(#${c})` }, el('path', { d, fill: 'none', stroke: '#000', 'stroke-width': w, opacity: 0.32, transform: `translate(${n(-lx * w * 0.8)} ${n(w * 0.9)})`, filter: sc.blur(w * 0.45 * blurUnit) }));
	}
	const line = (stroke, sw, extra = {}) => el('path', { d, fill: 'none', stroke, 'stroke-width': sw, 'stroke-linecap': 'round', ...extra });
	return (
		shadow +
		line(mix(color, '#000000', 0.35), w) +
		line(color, w * 0.72) +
		// the strands' lay: short bands across the rope, and a second set offset, so they read as a twist
		line(mix(color, '#000000', 0.3), w * 0.9, { 'stroke-dasharray': `${n(w * 0.32)} ${n(w * 0.38)}`, 'stroke-linecap': 'butt', opacity: 0.55 }) +
		line(mix(color, '#ffffff', 0.25), w * 0.28, { 'stroke-dasharray': `${n(w * 0.3)} ${n(w * 0.4)}`, 'stroke-dashoffset': n(w * 0.15), 'stroke-linecap': 'butt', opacity: 0.6, transform: `translate(${n(lx * w * 0.12)} ${n(-w * 0.14)})` }) +
		(shade > 0 ? line('#000', w, { opacity: shade }) : '')
	);
}
