/**
 * @module @logomarks/mockups/materials/glass
 *
 * Glass over a screen or a poster: what a photo of one always shows, faint.
 * A broad sheen falling from the light's corner, a soft diagonal band (a
 * window across the room, reflected), and a darker far corner. It's drawn
 * in the picture's own space over whatever the glass covers, clipped to
 * its outline.
 */

import { el } from '../render/svg.js';
import { polyPath } from '../util/shape.js';
import { clamp, n } from '../util/num.js';

/**
 * The reflections on a pane of glass.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The glass.
 * @param {readonly import('../util/shape.js').Vec2[]} o.outline Its outline in pixels.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} [o.strength=1] How strong the reflections are (0 for none).
 * @param {number} [o.band=0.38] Where the reflected band crosses, 0–1 along the diagonal.
 * @returns {string} The markup, to draw over what's behind the glass.
 */
export function glass(sc, { outline, light, strength = 1, band = 0.38 }) {
	if (strength <= 0 || outline.length < 3) return '';
	const xs = outline.map((p) => p[0]);
	const ys = outline.map((p) => p[1]);
	const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
	const [w, h] = [x1 - x0, y1 - y0];
	const lx = clamp(light, -1, 1);
	const ids = { clip: sc.id('glass'), sheen: sc.id('sheen') };
	const k = strength;
	sc.def(el('clipPath', { id: ids.clip }, el('path', { d: polyPath(outline) })));
	sc.def(
		el(
			'linearGradient',
			{ id: ids.sheen, x1: 0.5 + 0.5 * lx, y1: 0, x2: 0.5 - 0.5 * lx, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.13 * k }),
			el('stop', { offset: 0.42, 'stop-color': '#fff', 'stop-opacity': 0.025 * k }),
			el('stop', { offset: 0.7, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.08 * k }),
		),
	);
	// the band: a strip across the diagonal, leaning with the light
	const d = Math.hypot(w, h);
	const cx = x0 + w * (lx >= 0 ? 1 - band : band);
	const cy = y0 + h * band;
	const ang = (lx >= 0 ? -1 : 1) * 50;
	const bw = Math.max(w, h) * 0.16;
	const strip = (width, alpha, blur) =>
		el('rect', { x: -d, y: -width / 2, width: 2 * d, height: width, fill: '#fff', opacity: alpha * k, filter: blur ? sc.blur(blur) : null });
	return el(
		'g',
		{ 'clip-path': `url(#${ids.clip})` },
		el('rect', { x: x0, y: y0, width: w, height: h, fill: `url(#${ids.sheen})` }),
		el('g', { transform: `translate(${n(cx)} ${n(cy)}) rotate(${n(ang)})` }, strip(bw, 0.045, bw * 0.25), strip(bw * 0.18, 0.03, bw * 0.06), el('g', { transform: `translate(0 ${n(bw * 0.95)})` }, strip(bw * 0.35, 0.025, bw * 0.12))),
	);
}
