/**
 * @module @arraypress/mockups/parts/screen/browser
 *
 * A browser window, maximised, no one browser's: a tab strip with one tab
 * (the brand's icon and name), plain window controls, a toolbar with
 * back, forward and reload, and the address field holding the brand's
 * domain behind a padlock. The page below is the art, read from the top.
 */

import { el } from '../../render/svg.js';
import { fitArt } from '../../render/fit.js';
import { THEMES, text } from './ui.js';

/** Each theme's tab strip, as `[strip, field]` colours. */
const CHROME = Object.freeze({ light: Object.freeze(['#dfe2e7', '#eef0f3']), dark: Object.freeze(['#1c1e22', '#2a2d32']) });

/**
 * A browser window.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The window.
 * @param {number} o.width Its width (1600 units is a laptop's).
 * @param {number} o.height Its height.
 * @param {import('../../types.js').Art} o.page The page.
 * @param {string} o.domain The address shown (`'hollowfern.example'`).
 * @param {string} [o.title] The tab's title (the domain).
 * @param {import('../../types.js').Art} [o.icon] The tab's icon (a plain globe).
 * @param {'cover' | 'contain' | 'top'} [o.fill='top'] How the page fills the window.
 * @param {'light' | 'dark'} [o.theme='light'] The window's theme.
 * @returns {string} The markup, in `[0, width] × [0, height]`.
 */
export function browserWindow(sc, { width: W, height: H, page, domain, title = domain, icon, fill = 'top', theme = 'light' }) {
	const t = THEMES[theme];
	const [strip, field] = CHROME[theme];
	const s = W / 1600;
	const tabH = 48 * s;
	const barH = 54 * s;
	const top = tabH + barH;
	const stroke = { fill: 'none', stroke: t.ink, 'stroke-width': 2.4 * s, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
	// the tab: rounded on top, flaring into the toolbar
	const [x0, x1, ty] = [14 * s, 330 * s, 9 * s];
	const r = 10 * s;
	const tab = el('path', { d: `M${x0 - r} ${tabH}Q${x0} ${tabH} ${x0} ${tabH - r}V${ty + r}Q${x0} ${ty} ${x0 + r} ${ty}H${x1 - r}Q${x1} ${ty} ${x1} ${ty + r}V${tabH - r}Q${x1} ${tabH} ${x1 + r} ${tabH}Z`, fill: t.bg });
	const clip = sc.id('favicon');
	sc.def(el('clipPath', { id: clip }, el('rect', { x: 30 * s, y: 19 * s, width: 20 * s, height: 20 * s, rx: 5 * s })));
	const glyph = icon
		? el('g', { 'clip-path': `url(#${clip})` }, fitArt(sc, icon, { x: 30 * s, y: 19 * s, width: 20 * s, height: 20 * s }))
		: el('circle', { cx: 40 * s, cy: 29 * s, r: 9 * s, ...stroke, 'stroke-width': 1.8 * s }) + el('path', { d: `M${31 * s} ${29 * s}H${49 * s}M${40 * s} ${20 * s}C${35 * s} ${25 * s} ${35 * s} ${33 * s} ${40 * s} ${38 * s}C${45 * s} ${33 * s} ${45 * s} ${25 * s} ${40 * s} ${20 * s}`, ...stroke, 'stroke-width': 1.6 * s });
	const tabText = text(title.length > 26 ? title.slice(0, 25) + '…' : title, 62 * s, 35 * s, 17 * s, t.ink, { weight: 500 });
	const close = el('path', { d: `M${306 * s} ${23 * s}l${12 * s} ${12 * s}m0 ${-12 * s}l${-12 * s} ${12 * s}`, ...stroke, 'stroke-width': 1.8 * s, opacity: 0.6 });
	const plus = el('path', { d: `M${358 * s} ${22 * s}v${14 * s}m${-7 * s} ${-7 * s}h${14 * s}`, ...stroke, opacity: 0.7 });
	const controls = el('path', { d: `M${W - 150 * s} ${29 * s}h${16 * s}M${W - 96 * s} ${22 * s}h${13 * s}v${13 * s}h${-13 * s}z M${W - 44 * s} ${22 * s}l${13 * s} ${13 * s}m0 ${-13 * s}l${-13 * s} ${13 * s}`, ...stroke, 'stroke-width': 1.8 * s, opacity: 0.75 });
	// the toolbar
	const cy = tabH + barH / 2;
	const nav =
		el('path', { d: `M${40 * s} ${cy}h${-18 * s}m${8 * s} ${-8 * s}l${-8 * s} ${8 * s}l${8 * s} ${8 * s}`, ...stroke }) +
		el('path', { d: `M${66 * s} ${cy}h${18 * s}m${-8 * s} ${-8 * s}l${8 * s} ${8 * s}l${-8 * s} ${8 * s}`, ...stroke, opacity: 0.35 }) +
		el('path', { d: `M${127 * s} ${cy - 3 * s}a${9 * s} ${9 * s} 0 1 0 ${1 * s} ${8 * s}M${127 * s} ${cy - 11 * s}v${8 * s}h${-8 * s}`, ...stroke });
	const fx0 = 156 * s;
	const fx1 = W - 120 * s;
	const lock = el('rect', { x: fx0 + 20 * s, y: cy - 2 * s, width: 13 * s, height: 10 * s, rx: 2 * s, fill: t.muted }) + el('path', { d: `M${fx0 + 23 * s} ${cy - 2 * s}v${-3 * s}a${3.5 * s} ${3.5 * s} 0 0 1 ${7 * s} 0v${3 * s}`, fill: 'none', stroke: t.muted, 'stroke-width': 2 * s });
	const address = el('rect', { x: fx0, y: cy - 19 * s, width: fx1 - fx0, height: 38 * s, rx: 19 * s, fill: field }) + lock + text(domain, fx0 + 46 * s, cy + 6.5 * s, 18 * s, t.ink);
	const tools = el('circle', { cx: W - 82 * s, cy, r: 13 * s, fill: t.bar }) + [0, 1, 2].map((i) => el('circle', { cx: W - 36 * s, cy: cy - 8 * s + i * 8 * s, r: 2.2 * s, fill: t.ink })).join('');
	// the page
	const pageClip = sc.id('page');
	sc.def(el('clipPath', { id: pageClip }, el('rect', { x: 0, y: top, width: W, height: H - top })));
	return el(
		'g',
		{},
		el('rect', { width: W, height: tabH, fill: strip }),
		tab,
		glyph,
		tabText,
		close,
		plus,
		controls,
		el('rect', { y: tabH, width: W, height: barH, fill: t.bg }),
		nav,
		address,
		tools,
		el('rect', { y: top, width: W, height: H - top, fill: t.bg }),
		el('g', { 'clip-path': `url(#${pageClip})` }, fitArt(sc, page, { x: 0, y: top, width: W, height: H - top }, fill)),
		el('rect', { y: top - 1.2 * s, width: W, height: 1.2 * s, fill: t.line }),
	);
}
