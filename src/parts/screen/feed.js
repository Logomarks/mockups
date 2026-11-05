/**
 * @module @logomarks/mockups/parts/screen/feed
 *
 * A post in a social feed, deliberately no one app's: a header with a
 * placeholder wordmark, the brand's avatar and name over its post, the
 * image, a row of rounded action chips with counts, the caption as
 * placeholder bars, the next post peeking in, and a tab bar of plain
 * geometric glyphs.
 */

import { el } from '../../render/svg.js';
import { fitArt } from '../../render/fit.js';
import { artHref } from '../../render/art.js';
import { artSize } from '../../render/dims.js';
import { clamp } from '../../util/num.js';
import { THEMES, statusBar, text, bars, avatar } from './ui.js';

/**
 * A feed post.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The screen.
 * @param {number} o.width Its width (1080 units is a phone's).
 * @param {number} o.height Its height.
 * @param {import('../../types.js').Art} o.post The post's image, at its own proportions from 4:5 to 1.91:1, as feeds show them.
 * @param {import('../../types.js').Art} o.avatar The brand's avatar.
 * @param {string} o.name The brand's name.
 * @param {string} [o.handle] A second line under the name (`'@' + name`, slugged).
 * @param {'light' | 'dark'} [o.theme='light'] Light or dark.
 * @param {string} [o.seed='feed'] Seeds the placeholders.
 * @returns {string} The markup, in `[0, width] × [0, height]`.
 */
export function feedScreen(sc, { width: W, height: H, post, avatar: face, name, handle, theme = 'light', seed = 'feed' }) {
	const t = THEMES[theme];
	const s = W / 1080;
	const at = handle ?? '@' + name.toLowerCase().replace(/[^a-z0-9]+/g, '');
	const pad = 40 * s;
	const bar = 236 * s;
	// the app's header: a placeholder wordmark, two round buttons
	const head =
		el('rect', { x: pad, y: 150 * s, width: 210 * s, height: 40 * s, rx: 20 * s, fill: t.ink, opacity: 0.85 }) +
		[0, 1].map((i) => el('circle', { cx: W - pad - 30 * s - i * 92 * s, cy: 170 * s, r: 28 * s, fill: 'none', stroke: t.ink, 'stroke-width': 5 * s })).join('') +
		el('rect', { x: 0, y: bar - 1.5 * s, width: W, height: 1.5 * s, fill: t.line });
	// the post's byline
	const y0 = bar + 34 * s;
	const by =
		avatar(sc, face, pad + 50 * s, y0 + 50 * s, 50 * s) +
		text(name, pad + 124 * s, y0 + 44 * s, 36 * s, t.ink, { weight: 700 }) +
		text(`${at} · 2h`, pad + 124 * s, y0 + 90 * s, 30 * s, t.muted) +
		[0, 1, 2].map((i) => el('circle', { cx: W - pad - 10 * s - i * 18 * s, cy: y0 + 50 * s, r: 5.5 * s, fill: t.muted })).join('');
	// the image
	const iy = y0 + 132 * s;
	const size = artSize(artHref(post));
	const ih = W / clamp(size ? size.width / size.height : 1, 0.8, 1.91);
	const clip = sc.id('post');
	sc.def(el('clipPath', { id: clip }, el('rect', { x: 0, y: iy, width: W, height: ih })));
	const image = el('g', { 'clip-path': `url(#${clip})` }, fitArt(sc, post, { x: 0, y: iy, width: W, height: ih }));
	// actions: rounded chips with plain glyphs and counts
	const ay = iy + ih + 34 * s;
	const chip = (x, w, glyph, count) =>
		el('rect', { x, y: ay, width: w, height: 76 * s, rx: 38 * s, fill: t.raised }) + glyph(x + 46 * s, ay + 38 * s) + (count ? text(count, x + 82 * s, ay + 49 * s, 30 * s, t.ink, { weight: 600 }) : '');
	const ring = (cx, cy) => el('circle', { cx, cy, r: 15 * s, fill: 'none', stroke: t.ink, 'stroke-width': 5 * s });
	const bubble = (cx, cy) => el('rect', { x: cx - 16 * s, y: cy - 14 * s, width: 32 * s, height: 26 * s, rx: 9 * s, fill: 'none', stroke: t.ink, 'stroke-width': 5 * s });
	const arrow = (cx, cy) => el('path', { d: `M${cx - 14 * s} ${cy + 12 * s}L${cx + 12 * s} ${cy - 12 * s}M${cx - 4 * s} ${cy - 13 * s}H${cx + 13 * s}V${cy + 4 * s}`, fill: 'none', stroke: t.ink, 'stroke-width': 5 * s, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
	const actions = chip(pad, 190 * s, ring, '2.4k') + chip(pad + 210 * s, 170 * s, bubble, '186') + chip(pad + 400 * s, 92 * s, arrow, '') + el('rect', { x: W - pad - 76 * s, y: ay, width: 76 * s, height: 76 * s, rx: 38 * s, fill: t.raised });
	// the caption: the name, then placeholder lines
	const cy = ay + 136 * s;
	const caption = text(name, pad, cy, 32 * s, t.ink, { weight: 700 }) + bars({ x: pad + (name.length * 19 + 24) * s, y: cy - 20 * s, width: W - 2 * pad - (name.length * 19 + 24) * s, lines: 1, size: 20 * s, fill: t.bar, seed }) + bars({ x: pad, y: cy + 30 * s, width: W - 2 * pad, lines: 2, size: 20 * s, fill: t.bar, seed: seed + 'b', gap: 46 * s });
	// the next post, peeking in
	const ny = cy + 170 * s;
	const next = el('rect', { x: 0, y: ny - 30 * s, width: W, height: 1.5 * s, fill: t.line }) + el('circle', { cx: pad + 50 * s, cy: ny + 40 * s, r: 50 * s, fill: t.bar }) + bars({ x: pad + 124 * s, y: ny + 14 * s, width: 300 * s, lines: 2, size: 22 * s, fill: t.bar, seed: seed + 'n', gap: 40 * s }) + el('rect', { x: 0, y: ny + 120 * s, width: W, height: H, fill: t.raised });
	// the tab bar: plain shapes
	const ty = H - 190 * s;
	const glyphs = [
		(x) => el('path', { d: `M${x - 26 * s} ${ty + 70 * s}V${ty + 40 * s}L${x} ${ty + 18 * s}L${x + 26 * s} ${ty + 40 * s}V${ty + 70 * s}Z`, fill: t.ink }),
		(x) => el('circle', { cx: x, cy: ty + 45 * s, r: 24 * s, fill: 'none', stroke: t.ink, 'stroke-width': 5 * s }),
		(x) => el('rect', { x: x - 30 * s, y: ty + 16 * s, width: 60 * s, height: 58 * s, rx: 16 * s, fill: 'none', stroke: t.ink, 'stroke-width': 5 * s }) + el('path', { d: `M${x} ${ty + 31 * s}V${ty + 59 * s}M${x - 14 * s} ${ty + 45 * s}H${x + 14 * s}`, stroke: t.ink, 'stroke-width': 5 * s, 'stroke-linecap': 'round' }),
		(x) => el('rect', { x: x - 24 * s, y: ty + 21 * s, width: 48 * s, height: 48 * s, rx: 8 * s, fill: 'none', stroke: t.ink, 'stroke-width': 5 * s }),
		(x) => avatar(sc, face, x, ty + 45 * s, 27 * s),
	];
	const tabs = el('rect', { x: 0, y: ty - 10 * s, width: W, height: H - ty + 10 * s, fill: t.bg }) + el('rect', { x: 0, y: ty - 10 * s, width: W, height: 1.5 * s, fill: t.line }) + glyphs.map((g, i) => g(W * ((i + 0.5) / 5))).join('') + el('rect', { x: W / 2 - 140 * s, y: H - 36 * s, width: 280 * s, height: 10 * s, rx: 5 * s, fill: t.ink, opacity: 0.85 });
	return el('g', {}, el('rect', { width: W, height: H, fill: t.bg }), statusBar(W, t.ink), head, by, image, actions, caption, next, tabs);
}
