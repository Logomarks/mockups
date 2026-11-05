/**
 * @module @logomarks/mockups/parts/land
 *
 * Open country under the sky, for a roadside board: a field running from
 * a hazy horizon to darker grass in front, and two rows of distant trees
 * along the horizon (the farther row paler and bluer, as air makes it),
 * all soft, like the background of a photo focused on the board.
 */

import { el } from '../render/svg.js';
import { rng } from '../util/rng.js';
import { mix } from '../util/color.js';

/**
 * A field and treeline below the horizon.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The land.
 * @param {number} o.horizon The horizon, in pixels from the top.
 * @param {string} [o.haze='#dfe6ea'] The sky's colour at the horizon (the far field fades into it).
 * @param {string} [o.seed='land'] Seeds the trees.
 * @returns {string} The markup.
 */
export function land(sc, { horizon, haze = '#dfe6ea', seed = 'land' }) {
	const { width: w, height: h } = sc;
	const g = sc.id('field');
	sc.def(
		el(
			'linearGradient',
			{ id: g, gradientUnits: 'userSpaceOnUse', x1: 0, y1: horizon, x2: 0, y2: h },
			el('stop', { offset: 0, 'stop-color': mix('#93a07c', haze, 0.45) }),
			el('stop', { offset: 0.12, 'stop-color': '#859466' }),
			el('stop', { offset: 0.5, 'stop-color': '#6b7a4c' }),
			el('stop', { offset: 1, 'stop-color': '#4e5a37' }),
		),
	);
	const r = rng(`${seed}:trees`);
	const row = (color, height, blur, step) => {
		let out = '';
		for (let x = -w * 0.05; x < w * 1.05; x += w * step * r.range(0.6, 1.4)) {
			const tall = height * r.range(0.4, 1.3) * (r.next() < 0.15 ? 0.2 : 1);
			out += el('ellipse', { cx: x, cy: horizon, rx: w * step * r.range(0.7, 1.3), ry: tall });
		}
		return el('g', { fill: color, filter: sc.blur(blur) }, out);
	};
	return el(
		'g',
		{},
		row(mix('#5f7064', haze, 0.55), h * 0.022, h * 0.003, 0.03),
		row(mix('#3f4d3b', haze, 0.25), h * 0.016, h * 0.002, 0.022),
		el('rect', { x: 0, y: horizon, width: w, height: h - horizon, fill: `url(#${g})` }),
	);
}
