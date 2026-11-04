/**
 * @module @arraypress/mockups/parts/sticker
 *
 * A die-cut vinyl sticker: the art, a white border cut round it (a circle,
 * a rounded square, or the art's own contour, grown from its alpha and
 * smoothed the way a plotter cuts), the vinyl's thin raised edge and its
 * glossy sheen, and soft shadows. A sticker can be part peeled: the fold
 * mirrors the lifted corner over, showing the paler adhesive back. On a
 * sticker sheet, each one sits in its kiss-cut slot on the liner.
 */

import { el } from '../render/svg.js';
import { outline } from './sheet.js';
import { clamp, n } from '../util/num.js';

/** The shapes a sticker can be cut to. */
export const STICKER_SHAPES = /** @type {const} */ (['circle', 'rounded', 'contour']);

/**
 * A sticker's art, silhouette and face, defined once so it can be drawn several times (flat, wrapped, peeled).
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./sticker.js').StickerSpec} o The art and its cut.
 * @returns {import('./sticker.js').StickerDef} The ids, and the sticker's extent.
 */
export function defineSticker(sc, { place, w, h, shape, border, radius = 0, light }) {
	const sil = sc.id('sil');
	const face = sc.id('face');
	const b = Math.max(0, border);
	const art = place(-w / 2, -h / 2, w, h);
	if (shape === 'contour') {
		const f = sc.id('cut');
		const sigma = Math.max(0.5, b / 1.5);
		const reach = 0.5 * erfc(b / (sigma * Math.SQRT2));
		sc.def(
			el(
				'filter',
				{ id: f, filterUnits: 'userSpaceOnUse', x: -w / 2 - 3 * b - 4, y: -h / 2 - 3 * b - 4, width: w + 6 * b + 8, height: h + 6 * b + 8, 'color-interpolation-filters': 'sRGB' },
				// grow the art's alpha by the border: blur it and cut at the level the blur reaches that far out
				// (a Gaussian costs the same at any border, where a morphology grows with it, and it rounds the corners as a plotter does)
				el('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: sigma, result: 's' }),
				el('feComponentTransfer', { in: 's', result: 't' }, el('feFuncA', { type: 'linear', slope: 60, intercept: n(0.5 - 60 * reach) })),
				el('feFlood', { 'flood-color': '#ffffff' }),
				el('feComposite', { in2: 't', operator: 'in' }),
			),
		);
		sc.def(el('g', { id: sil }, el('g', { filter: `url(#${f})` }, art)));
		sc.def(el('g', { id: face }, el('use', { href: `#${sil}` }), art));
	} else {
		const d = shape === 'circle' ? circleD(w / 2 + b) : outline(w + 2 * b, h + 2 * b, radius + b);
		const inner = sc.id('inner');
		sc.def(el('clipPath', { id: inner }, el('path', { d: shape === 'circle' ? circleD(w / 2) : outline(w, h, radius) })));
		sc.def(el('path', { id: sil, d, fill: '#ffffff' }));
		sc.def(el('g', { id: face }, el('use', { href: `#${sil}` }), el('g', { 'clip-path': `url(#${inner})` }, art)));
	}
	// the vinyl's sheen: a soft diagonal sweep from the light's side, masked to the sticker
	const mask = sc.id('vmask');
	const g = sc.id('vsheen');
	const lx = clamp(light, -1, 1);
	sc.def(el('mask', { id: mask, maskUnits: 'userSpaceOnUse', x: -w, y: -h, width: 2 * w, height: 2 * h }, el('use', { href: `#${sil}` })));
	sc.def(
		el(
			'linearGradient',
			{ id: g, x1: 0.5 + 0.5 * lx, y1: 0, x2: 0.5 - 0.5 * lx, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.28 }),
			el('stop', { offset: 0.3, 'stop-color': '#fff', 'stop-opacity': 0.06 }),
			el('stop', { offset: 0.42, 'stop-color': '#fff', 'stop-opacity': 0.2 }),
			el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0.02 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.06 }),
		),
	);
	const half = Math.max(w, h) / 2 + b;
	return { sil, face, sheen: el('rect', { x: -half, y: -half, width: 2 * half, height: 2 * half, fill: `url(#${g})`, mask: `url(#${mask})` }), extent: half };
}

/**
 * The complementary error function (Abramowitz and Stegun 7.1.26, to 1.5e-7).
 *
 * @param {number} x Its argument, 0 or more.
 * @returns {number} erfc(x).
 */
function erfc(x) {
	const t = 1 / (1 + 0.3275911 * x);
	return t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x);
}

/**
 * A circle as path data, centred on the origin.
 *
 * @param {number} r Its radius.
 * @returns {string} Path data.
 */
function circleD(r) {
	return `M${n(-r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0z`;
}

/**
 * The silhouette recoloured: a filter that keeps the alpha and sets the colour.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} id The silhouette's id.
 * @param {string} color The colour.
 * @param {Record<string, string | number>} [attrs] More attributes for the `<use>`.
 * @returns {string} The markup.
 */
export function tinted(sc, id, color, attrs = {}) {
	return el('use', { href: `#${id}`, filter: tint(sc, color), ...attrs });
}

/** @type {WeakMap<object, Map<string, string>>} */
const tints = new WeakMap();

/**
 * A filter that paints whatever it's on one colour, keeping its alpha (made once per colour per document).
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} color A hex colour.
 * @returns {string} `url(#…)`.
 */
function tint(sc, color) {
	const byColor = tints.get(sc) ?? new Map();
	tints.set(sc, byColor);
	let f = byColor.get(color);
	if (!f) {
		f = sc.id('tint');
		byColor.set(color, f);
		const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
		sc.def(el('filter', { id: f, 'color-interpolation-filters': 'sRGB' }, el('feColorMatrix', { type: 'matrix', values: `0 0 0 0 ${n(r)}  0 0 0 0 ${n(g)}  0 0 0 0 ${n(b)}  0 0 0 1 0` })));
	}
	return `url(#${f})`;
}

/**
 * A sticker drawn: its shadows, its raised edge, its face and sheen, and (when peeled) the folded-back corner.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./sticker.js').StickerDef} def The sticker.
 * @param {import('./sticker.js').StickerPlace} o Where, how far it's lifted, the light, and the peel.
 * @returns {string} The markup.
 */
export function drawSticker(sc, def, { x, y, angle = 0, mm, light, lift = 0.1, shadow = 1, peel = null }) {
	const away = -clamp(light, -1, 1);
	const t = `translate(${n(x)} ${n(y)}) rotate(${n(angle)})`;
	const shade = (dx, dy, sigma, alpha, body = el('use', { href: `#${def.sil}` })) =>
		el(
			'g',
			{ transform: `translate(${n(x + dx * mm)} ${n(y + dy * mm)})`, filter: sc.blur(Math.max(0.4, sigma * mm)), opacity: clamp(alpha * shadow) },
			el('g', { transform: `rotate(${n(angle)})`, filter: tint(sc, '#000000') }, body),
		);
	const L = clamp(lift, 0, 3);
	let keep = '';
	let flap = '';
	let flapShadow = '';
	if (peel) {
		// the fold: a line across the corner the sticker is peeled from, perpendicular to that direction
		const a = (peel.direction * Math.PI) / 180;
		const dx = Math.cos(a);
		const dy = Math.sin(a);
		const at = def.extent * (1 - 2 * clamp(peel.depth, 0.05, 0.6));
		const big = def.extent * 4;
		const px = dx * at;
		const py = dy * at;
		const half = (side) =>
			`M${n(px - dy * big)} ${n(py + dx * big)}L${n(px - dy * big + side * dx * big)} ${n(py + dx * big + side * dy * big)}L${n(px + dy * big + side * dx * big)} ${n(py - dx * big + side * dy * big)}L${n(px + dy * big)} ${n(py - dx * big)}Z`;
		const kc = sc.id('keep');
		const fc = sc.id('flap');
		sc.def(el('clipPath', { id: kc }, el('path', { d: half(-1) })));
		sc.def(el('clipPath', { id: fc }, el('path', { d: half(1) })));
		keep = `url(#${kc})`;
		// mirror across the fold line
		const deg = (a * 180) / Math.PI;
		const mirror = `translate(${n(px)} ${n(py)}) rotate(${n(deg)}) scale(-1 1) rotate(${n(-deg)}) translate(${n(-px)} ${n(-py)})`;
		const fg = sc.id('fold');
		sc.def(
			el(
				'linearGradient',
				{ id: fg, gradientUnits: 'userSpaceOnUse', x1: px, y1: py, x2: px - dx * def.extent * 0.8, y2: py - dy * def.extent * 0.8 },
				el('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.22 }),
				el('stop', { offset: 0.35, 'stop-color': '#fff', 'stop-opacity': 0.25 }),
				el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.05 }),
			),
		);
		const flapBody = el('g', { transform: mirror }, el('g', { 'clip-path': `url(#${fc})` }, tinted(sc, def.sil, '#e9e6df')));
		// the flap's own shadow, falling on the liner and the sticker
		flapShadow = shade(away * 1.6, 2.2, 2.2, 0.28, flapBody) + shade(away * 0.5, 0.7, 0.6, 0.25, flapBody);
		flap = el('g', { transform: t }, flapBody, el('g', { transform: mirror, 'clip-path': `url(#${fc})` }, el('rect', { x: -def.extent * 2, y: -def.extent * 2, width: def.extent * 4, height: def.extent * 4, fill: `url(#${fg})`, mask: `url(#${sheenMask(sc, def)})` })));
	}
	const body = el(
		'g',
		{ 'clip-path': keep || undefined },
		// the vinyl's thickness: a darker sliver along the edge nearer the camera
		tinted(sc, def.sil, '#b9b7b2', { transform: `translate(0 ${n(0.28 * mm)})` }),
		el('use', { href: `#${def.face}` }),
		def.sheen,
	);
	const shadows = shadow > 0 ? shade(away * (0.25 + 0.6 * L), 0.35 + 0.8 * L, 0.35 + 0.8 * L, 0.3) + shade(away * (1 + 3 * L), 1.4 + 4 * L, 1.8 + 5 * L, 0.14) : '';
	return shadows + el('g', { transform: t }, body) + flapShadow + flap;
}

/**
 * The sticker's mask, as an id (the silhouette in white).
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./sticker.js').StickerDef} def The sticker.
 * @returns {string} The mask's id.
 */
function sheenMask(sc, def) {
	const m = sc.id('fmask');
	const e = def.extent * 2;
	sc.def(el('mask', { id: m, maskUnits: 'userSpaceOnUse', x: -e, y: -e, width: 2 * e, height: 2 * e }, el('use', { href: `#${def.sil}` })));
	return m;
}


/**
 * A kiss-cut slot on a sticker sheet's liner: the cut line round where the sticker sits (seen where the sticker's been lifted).
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./sticker.js').StickerDef} def The sticker.
 * @param {{ x: number, y: number, angle?: number, mm: number, liner: string }} o Where, pixels per mm, and the liner's colour.
 * @returns {string} The markup.
 */
export function slot(sc, def, { x, y, angle = 0, mm, liner }) {
	const t = `translate(${n(x)} ${n(y)}) rotate(${n(angle)})`;
	const grow = 1 + (0.5 * mm) / def.extent;
	return el(
		'g',
		{ transform: t },
		tinted(sc, def.sil, '#9c9a95', { transform: `scale(${n(grow)})`, opacity: 0.55 }),
		tinted(sc, def.sil, liner, { transform: `scale(${n(1 + (0.25 * mm) / def.extent)})` }),
		el('use', { href: `#${def.sil}`, opacity: 0.35 }),
	);
}
