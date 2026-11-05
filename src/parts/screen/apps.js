/**
 * @module @logomarks/mockups/parts/screen/apps
 *
 * A phone's home screen seen close: the time, the status icons, a camera
 * hole, and a grid of apps with their names, the brand's first (its mark
 * on a rounded tile). The other apps are generic: soft gradient tiles,
 * each with a plain white shape (a ring, a wave, a grid of dots), their
 * names soft bars. None of them is any maker's or platform's icon.
 */

import { el } from '../../render/svg.js';
import { fitArt } from '../../render/fit.js';
import { ink as inked } from '../../render/ink.js';
import { mix, luma } from '../../util/color.js';
import { statusBar, text } from './ui.js';

/** The generic apps: each a tile's colour and an abstract glyph (no stock app's picture). Their names are soft bars. */
export const APPS = Object.freeze([
	Object.freeze({ color: '#3a8ff0', glyph: 'wave' }),
	Object.freeze({ color: '#f4b93c', glyph: 'lines' }),
	Object.freeze({ color: '#4fbf6a', glyph: 'ring' }),
	Object.freeze({ color: '#6c5ce7', glyph: 'dots' }),
	Object.freeze({ color: '#ef6f53', glyph: 'half' }),
	Object.freeze({ color: '#19a7a0', glyph: 'grid' }),
	Object.freeze({ color: '#ec4f87', glyph: 'arcs' }),
	Object.freeze({ color: '#8a8f99', glyph: 'plus' }),
	Object.freeze({ color: '#2f6fe4', glyph: 'bars' }),
	Object.freeze({ color: '#c9a227', glyph: 'diamond' }),
]);

/** The names of the glyphs: plain shapes. */
export const GLYPHS = /** @type {const} */ (['wave', 'lines', 'ring', 'dots', 'half', 'grid', 'arcs', 'plus', 'bars', 'diamond']);

/**
 * A glyph, drawn in a 100-unit box.
 *
 * @param {typeof GLYPHS[number]} name The glyph.
 * @param {string} ink Its colour.
 * @returns {string} The markup, in `[0, 100]²`.
 */
export function glyph(name, ink) {
	const stroke = { fill: 'none', stroke: ink, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
	switch (name) {
		case 'wave':
			return el('path', { d: 'M18 52c10-18 22-18 32 0s22 18 32 0', ...stroke, 'stroke-width': 9 });
		case 'lines':
			return [30, 46, 62].map((y, i) => el('rect', { x: 22, y, width: i === 2 ? 34 : 56, height: 8, rx: 4, fill: ink })).join('');
		case 'ring':
			return el('circle', { cx: 50, cy: 50, r: 26, ...stroke, 'stroke-width': 10 }) + el('circle', { cx: 50, cy: 50, r: 9, fill: ink, opacity: 0.7 });
		case 'dots':
			return [0, 1, 2].flatMap((j) => [0, 1, 2].map((i) => el('circle', { cx: 28 + i * 22, cy: 28 + j * 22, r: 6.5, fill: ink, opacity: (i + j) % 2 ? 0.65 : 1 }))).join('');
		case 'half':
			return el('path', { d: 'M22 58a28 28 0 0 1 56 0z', fill: ink }) + el('rect', { x: 22, y: 66, width: 56, height: 7, rx: 3.5, fill: ink, opacity: 0.7 });
		case 'grid':
			return [0, 1].flatMap((j) => [0, 1].map((i) => el('rect', { x: 24 + i * 28, y: 24 + j * 28, width: 22, height: 22, rx: 6, fill: ink, opacity: i === j ? 1 : 0.6 }))).join('');
		case 'arcs':
			return [14, 24, 34].map((r) => el('path', { d: `M${50 - r} 68a${r} ${r} 0 0 1 ${2 * r} 0`, ...stroke, 'stroke-width': 6 })).join('');
		case 'plus':
			return el('path', { d: 'M50 26v48M26 50h48', ...stroke, 'stroke-width': 11 });
		case 'bars':
			return [0, 1, 2].map((i) => el('rect', { x: 22 + i * 21, y: 70 - (i + 1) * 14, width: 14, height: (i + 1) * 14, rx: 4, fill: ink })).join('');
		case 'diamond':
			return el('rect', { x: 32, y: 32, width: 36, height: 36, rx: 6, fill: ink, transform: 'rotate(45 50 50)' });
		default:
			return '';
	}
}

/**
 * One generic app's tile: its colour in a soft vertical gradient, its glyph in white (or its own ink).
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {(typeof APPS)[number]} app The app.
 * @param {{ x: number, y: number, size: number }} box Where.
 * @returns {string} The markup.
 */
export function appTile(sc, app, { x, y, size }) {
	const g = sc.id('tile');
	sc.def(el('linearGradient', { id: g, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': mix(app.color, '#ffffff', 0.16) }), el('stop', { offset: 1, 'stop-color': mix(app.color, '#000000', 0.08) })));
	const ink = luma(app.color) > 0.7 ? '#1b1c20' : '#ffffff';
	return el('rect', { x, y, width: size, height: size, rx: size * 0.225, fill: `url(#${g})` }) + el('g', { transform: `translate(${x + size * 0.14} ${y + size * 0.14}) scale(${(size * 0.72) / 100})` }, glyph(/** @type {typeof GLYPHS[number]} */ (app.glyph), ink));
}

/**
 * A home screen with the brand's app first.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {import('./apps.js').AppsScreen} o The screen.
 * @returns {string} The markup, in `[0, width] × [0, height]`.
 */
export function appsScreen(sc, { width: W, height: H, mark, name, color, ink, wallpaper, time = '9:41', hole = 0 }) {
	const s = W / 1080;
	const dark = luma(wallpaper) < 0.5;
	const type = dark ? '#ffffff' : '#111215';
	const wall = sc.id('wall');
	sc.def(el('linearGradient', { id: wall, x1: 0.2, y1: 0, x2: 0.8, y2: 1 }, el('stop', { offset: 0, 'stop-color': mix(wallpaper, '#ffffff', dark ? 0.06 : 0.1) }), el('stop', { offset: 1, 'stop-color': mix(wallpaper, '#000000', dark ? 0.3 : 0.12) })));
	const margin = 64 * s;
	const cell = (W - 2 * margin) / 4;
	const size = cell * 0.74;
	const pitch = cell * 1.24;
	const top = 230 * s;
	let apps = '';
	for (let k = 0; k < 20; k++) {
		const cx = margin + cell * ((k % 4) + 0.5);
		const y = top + Math.floor(k / 4) * pitch;
		const x = cx - size / 2;
		if (k === 0) {
			const clip = sc.id('brand');
			sc.def(el('clipPath', { id: clip }, el('rect', { x, y, width: size, height: size, rx: size * 0.225 })));
			const p = size * 0.18;
			apps += el('g', { 'clip-path': `url(#${clip})` }, el('rect', { x, y, width: size, height: size, fill: color }), fitArt(sc, inked(mark, ink), { x: x + p, y: y + p, width: size - 2 * p, height: size - 2 * p }, 'contain'));
			apps += el('rect', { x, y, width: size, height: size, rx: size * 0.225, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.1, 'stroke-width': 2 * s });
		} else apps += appTile(sc, APPS[(k - 1) % APPS.length], { x, y, size });
		// the brand's name; the others' names as soft bars of seeded lengths
		if (k === 0) apps += text(name, cx, y + size + 46 * s, 30 * s, type, { anchor: 'middle', weight: 450 });
		else {
			const h = Math.sin(k * 12.9898) * 43758.5453;
			const bw = size * (0.45 + 0.35 * (h - Math.floor(h)));
			apps += el('rect', { x: cx - bw / 2, y: y + size + 24 * s, width: bw, height: 18 * s, rx: 9 * s, fill: type, opacity: 0.42 });
		}
	}
	return el(
		'g',
		{},
		el('rect', { width: W, height: H, fill: `url(#${wall})` }),
		statusBar(W, type, 20 * s, time),
		hole ? el('circle', { cx: W / 2, cy: 70 * s, r: hole, fill: '#000' }) : '',
		apps,
	);
}
