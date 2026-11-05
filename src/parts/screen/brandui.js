/**
 * @module @logomarks/mockups/parts/screen/brandui
 *
 * A brand's own small site on a phone, composed from its mark, name and
 * colour: a rounded header bar carrying the lockup, a headline, body copy
 * as soft bars and a call-to-action button; or the same page with its
 * menu open over it (the page behind blurred and faded). Drawn on a
 * 1080-unit-wide screen.
 */

import { el } from '../../render/svg.js';
import { mix, luma } from '../../util/color.js';
import { lockupIn, typeWidth } from '../lockup.js';
import { statusBar, text, bars } from './ui.js';

/** The two states: the page, and the page with its menu open. */
export const BRAND_UI_STATES = /** @type {const} */ (['page', 'menu']);

/** The menu's items: plain words, nobody's. */
export const MENU = Object.freeze(['About', 'How it works', 'Pricing', 'Help', 'Contact']);

/**
 * The brand's page.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {import('./brandui.js').BrandUi} o The screen.
 * @returns {string} The markup, in `[0, width] × [0, height]`.
 */
export function brandUi(sc, { width: W, height: H, mark, name, color, state = 'page', seed = 'ui' }) {
	const s = W / 1080;
	const paper = mix('#f6f1e6', color, 0.04);
	const type = '#17181b';
	const bar = luma(color) > 0.55 ? '#26272b' : color;
	const barInk = '#f4f2ee';
	const pad = 36 * s;
	const head = { x: pad, y: 150 * s, width: W - 2 * pad, height: 190 * s };
	const open = state === 'menu';
	const panel = open ? { ...head, height: 980 * s } : head;
	const icon = (x, y) =>
		open
			? el('path', { d: `M${x - 26 * s} ${y - 26 * s}L${x + 26 * s} ${y + 26 * s}M${x + 26 * s} ${y - 26 * s}L${x - 26 * s} ${y + 26 * s}`, stroke: barInk, 'stroke-width': 5 * s, 'stroke-linecap': 'round' })
			: el('path', { d: `M${x - 30 * s} ${y}H${x + 30 * s}M${x} ${y - 30 * s}V${y + 30 * s}`, stroke: barInk, 'stroke-width': 5 * s, 'stroke-linecap': 'round' });
	const headline = `Meet ${name}.`;
	const size = Math.min(112 * s, ((W - 2 * 90 * s) / Math.max(1, typeWidth(headline, 1))) * 0.98);
	const page =
		text(headline, 90 * s, 520 * s, size, type, { weight: 600, spacing: -size * 0.02 }) +
		bars({ x: 90 * s, y: 610 * s, width: W - 190 * s, lines: 2, size: 26 * s, fill: type, seed: `${seed}:a`, gap: 64 * s }).replace(/<rect /g, '<rect opacity="0.32" ') +
		bars({ x: 90 * s, y: 860 * s, width: W - 190 * s, lines: 7, size: 26 * s, fill: type, seed: `${seed}:b`, gap: 64 * s }).replace(/<rect /g, '<rect opacity="0.32" ');
	const button = el('rect', { x: pad, y: H - 330 * s, width: W - 2 * pad, height: 170 * s, rx: 85 * s, fill: 'none', stroke: type, 'stroke-width': 3 * s, 'stroke-dasharray': open ? 'none' : `${4 * s} ${6 * s}` }) + text('GET STARTED', 110 * s, H - 230 * s, 40 * s, type, { weight: 500, spacing: 6 * s }) + el('path', { d: `M${W - 190 * s} ${H - 245 * s}h${80 * s}m${-22 * s} ${-16 * s}l${22 * s} ${16 * s}l${-22 * s} ${16 * s}`, stroke: type, 'stroke-width': 3 * s, fill: 'none' });
	const blur = sc.blur(14 * s);
	const body = open ? el('g', { filter: blur, opacity: 0.45 }, page) + el('g', { opacity: 0.4 }, button) : page + button;
	const menu = open ? MENU.map((m, i) => text(m, head.x + 50 * s, head.y + 330 * s + i * 120 * s, 50 * s, barInk, { weight: 400 })).join('') : '';
	return el(
		'g',
		{},
		el('rect', { width: W, height: H, fill: paper }),
		statusBar(W, type, 10 * s, '9:41'),
		body,
		el('rect', { ...panel, rx: 36 * s, fill: bar }),
		lockupIn(sc, { mark, name, ink: barInk, size: 84 * s, x: head.x + 50 * s, y: head.y + 40 * s, width: head.width * 0.62, height: 110 * s, align: 'start' }),
		icon(head.x + head.width - 90 * s, head.y + head.height / 2),
		menu,
	);
}
