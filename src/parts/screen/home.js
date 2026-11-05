/**
 * @module @logomarks/mockups/parts/screen/home
 *
 * A phone's home screen with the brand as an app: its mark on a rounded
 * square, its name beneath, among placeholder apps (plain rounded squares
 * in muted colours, their names soft bars) over a gradient wallpaper, with
 * a dock along the bottom. Nothing in it is any maker's.
 */

import { el } from '../../render/svg.js';
import { fitArt } from '../../render/fit.js';
import { mix, luma } from '../../util/color.js';
import { rng } from '../../util/rng.js';
import { statusBar, text } from './ui.js';

/** The placeholder apps' colours: muted, mid-toned. */
export const MUTED = Object.freeze(['#8fa3b8', '#b8a58f', '#9bb39a', '#b39ab0', '#a3a6b0', '#c4b08e', '#8a9fad', '#a9b7a2', '#b5a0a0', '#9aa8c4', '#c2a9b9', '#a0b4b0']);

/** The grid: columns, rows above the dock, and the slot the brand's app takes. */
export const HOME = Object.freeze({ columns: 4, rows: 5, slot: 5 });

/**
 * A home screen.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The screen.
 * @param {number} o.width Its width (1080 units is a phone's).
 * @param {number} o.height Its height.
 * @param {import('../../types.js').Art} o.icon The brand's app icon (cover-fitted, or contained on `background` when `padding` is set).
 * @param {string} o.name The app's name, under its icon.
 * @param {import('../../types.js').Art | string} [o.wallpaper] A hex colour (a soft gradient from it) or art (`'#56677f'`).
 * @param {string} [o.background] The icon's colour behind the mark.
 * @param {number} [o.padding=0] Space round the mark, as a fraction of the icon.
 * @param {number} [o.slot=5] Which slot the brand's app takes, 0 at the top left.
 * @param {string} [o.seed='home'] Seeds the placeholders.
 * @returns {string} The markup, in `[0, width] × [0, height]`.
 */
export function homeScreen(sc, { width: W, height: H, icon, name, wallpaper = '#56677f', background, padding = 0, slot = HOME.slot, seed = 'home' }) {
	const s = W / 1080;
	const r = rng(`${seed}:apps`);
	const ids = { wall: sc.id('wall'), glow: sc.id('wallglow') };
	let wall;
	if (typeof wallpaper === 'string' && /^#/.test(wallpaper)) {
		sc.def(
			el(
				'linearGradient',
				{ id: ids.wall, x1: 0.1, y1: 0, x2: 0.9, y2: 1 },
				el('stop', { offset: 0, 'stop-color': mix(wallpaper, '#ffffff', 0.28) }),
				el('stop', { offset: 0.55, 'stop-color': wallpaper }),
				el('stop', { offset: 1, 'stop-color': mix(wallpaper, '#000000', 0.45) }),
			),
		);
		sc.def(
			el(
				'radialGradient',
				{ id: ids.glow, cx: 0.85, cy: 0.18, r: 0.75 },
				el('stop', { offset: 0, 'stop-color': mix(wallpaper, '#ffd9b8', 0.5), 'stop-opacity': 0.55 }),
				el('stop', { offset: 1, 'stop-color': mix(wallpaper, '#ffd9b8', 0.5), 'stop-opacity': 0 }),
			),
		);
		wall = el('rect', { width: W, height: H, fill: `url(#${ids.wall})` }) + el('rect', { width: W, height: H, fill: `url(#${ids.glow})` });
	} else wall = fitArt(sc, wallpaper, { x: 0, y: 0, width: W, height: H }) + el('rect', { width: W, height: H, fill: '#000', opacity: 0.12 });
	const ink = typeof wallpaper === 'string' && /^#/.test(wallpaper) && luma(wallpaper) > 0.72 ? '#121418' : '#ffffff';

	const margin = 62 * s;
	const cell = (W - 2 * margin) / HOME.columns;
	const size = cell * 0.76;
	const rad = size * 0.24;
	const pitch = cell * 1.2;
	const top = 200 * s;
	const brandClip = sc.id('appicon');
	let apps = '';
	const app = (cx, y, label, own) => {
		const x = cx - size / 2;
		if (own) {
			sc.def(el('clipPath', { id: brandClip }, el('rect', { x, y, width: size, height: size, rx: rad })));
			const p = size * padding;
			apps += el(
				'g',
				{ 'clip-path': `url(#${brandClip})` },
				background ? el('rect', { x, y, width: size, height: size, fill: background }) : '',
				fitArt(sc, icon, { x: x + p, y: y + p, width: size - 2 * p, height: size - 2 * p }, padding ? 'contain' : 'cover'),
			);
			apps += el('rect', { x: x + 0.75, y: y + 0.75, width: size - 1.5, height: size - 1.5, rx: rad, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.12, 'stroke-width': 1.5 });
		} else {
			const c = MUTED[Math.floor(r.next() * MUTED.length)];
			const g = sc.id('app');
			sc.def(el('linearGradient', { id: g, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': mix(c, '#ffffff', 0.14) }), el('stop', { offset: 1, 'stop-color': mix(c, '#000000', 0.06) })));
			apps += el('rect', { x, y, width: size, height: size, rx: rad, fill: `url(#${g})` });
		}
		if (label === null) return;
		if (own) apps += text(label, cx, y + size + 48 * s, 31 * s, ink, { weight: 500, anchor: 'middle' });
		else {
			const bw = size * r.range(0.45, 0.8);
			apps += el('rect', { x: cx - bw / 2, y: y + size + 26 * s, width: bw, height: 18 * s, rx: 9 * s, fill: ink, opacity: 0.42 });
		}
	};
	for (let j = 0; j < HOME.rows; j++) for (let i = 0; i < HOME.columns; i++) app(margin + cell * (i + 0.5), top + j * pitch, j * HOME.columns + i === slot ? name : '', j * HOME.columns + i === slot);
	// a search pill and the page dots above the dock
	const dockTop = H - 300 * s;
	const dots = [0, 1, 2].map((i) => el('circle', { cx: W / 2 + (i - 1) * 26 * s, cy: dockTop - 50 * s, r: 7 * s, fill: ink, opacity: i === 0 ? 0.9 : 0.4 })).join('');
	const dock = el('rect', { x: 36 * s, y: dockTop, width: W - 72 * s, height: 236 * s, rx: 76 * s, fill: '#ffffff', opacity: 0.2 });
	const grid = apps;
	apps = '';
	for (let i = 0; i < HOME.columns; i++) app(margin + cell * (i + 0.5), dockTop + (236 * s - size) / 2, null, false);
	return el('g', {}, wall, statusBar(W, ink), grid, dots, dock, apps);
}
