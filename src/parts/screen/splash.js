/**
 * @module @logomarks/mockups/parts/screen/splash
 *
 * A screen given over to the brand: a soft field of its colour (lighter
 * where a light falls across it, paler at the sides, or deeper in a
 * corner) with its lockup in the middle. What a keynote's big screen or a laptop
 * left on a title shows.
 */

import { el } from '../../render/svg.js';
import { mix } from '../../util/color.js';
import { inkOn } from '../../util/brand.js';
import { lockupIn } from '../lockup.js';

/** The fields: a glow across from the top (`'glow'`), light falling in from both sides (`'stage'`), or a deep corner (`'corner'`). */
export const SPLASH_STYLES = /** @type {const} */ (['glow', 'stage', 'corner']);

/**
 * A brand splash.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {import('./splash.js').Splash} o The screen.
 * @returns {string} The markup, in `[0, width] × [0, height]`.
 */
export function splashScreen(sc, { width: W, height: H, mark, name, color, ink = inkOn(color), style = 'glow', scale = 0.3 }) {
	const ids = { a: sc.id('field'), b: sc.id('fieldb') };
	let field;
	if (style === 'stage') {
		// the field lit evenly in the middle, washed paler towards both sides
		sc.def(
			el(
				'linearGradient',
				{ id: ids.a, x1: 0, y1: 0, x2: 1, y2: 0 },
				el('stop', { offset: 0, 'stop-color': mix(color, '#ffffff', 0.75) }),
				el('stop', { offset: 0.14, 'stop-color': mix(color, '#ffffff', 0.18) }),
				el('stop', { offset: 0.5, 'stop-color': color }),
				el('stop', { offset: 0.86, 'stop-color': mix(color, '#ffffff', 0.18) }),
				el('stop', { offset: 1, 'stop-color': mix(color, '#ffffff', 0.75) }),
			),
		);
		field = el('rect', { width: W, height: H, fill: `url(#${ids.a})` });
	} else {
		const deep = style === 'corner';
		sc.def(
			el(
				'radialGradient',
				{ id: ids.a, cx: deep ? 0.75 : 0.5, cy: deep ? 0.1 : -0.2, r: deep ? 1.1 : 1.3 },
				el('stop', { offset: 0, 'stop-color': mix(color, '#ffffff', 0.32) }),
				el('stop', { offset: 0.45, 'stop-color': color }),
				el('stop', { offset: 1, 'stop-color': mix(color, '#000000', deep ? 0.88 : 0.45) }),
			),
		);
		sc.def(el('radialGradient', { id: ids.b, cx: 0.95, cy: 0.95, r: 0.5 }, el('stop', { offset: 0, 'stop-color': mix(color, '#ff9a8a', 0.4), 'stop-opacity': 0.5 }), el('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 })));
		field = el('rect', { width: W, height: H, fill: `url(#${ids.a})` }) + (deep ? el('rect', { width: W, height: H, fill: `url(#${ids.b})` }) : '');
	}
	const box = { x: W * 0.15, y: H * (0.5 - scale / 2), width: W * 0.7, height: H * scale };
	return el('g', {}, field, lockupIn(sc, { mark, name, ink, size: H * scale, ...box, layout: 'row' }));
}
