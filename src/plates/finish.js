/**
 * @module @logomarks/mockups/plates/finish
 *
 * How the art sits in a sign's surface beyond ink: pressed into it
 * (`deboss`: a blind deboss in card or leather), raised out of it
 * (`emboss`), cut into it and filled (`engrave`: a laser on wood, an
 * engraved and filled plaque), or stamped in metal foil (`foil`). Each is
 * drawn from the art's own shape (its alpha) after it's warped into the
 * photo, lit from the direction the photo's light comes from: the shape is
 * blurred into a height and lit as a surface (`feDiffuseLighting`), and the
 * light laid over the sign with `hard-light`, so the edge facing the light
 * catches it and the other falls into shadow, and everywhere flat is left
 * as the photo had it.
 *
 * Also here: cloth (`displace`), the art pushed about by the photo's own
 * folds, as a print on a hanging tote or an apron follows them.
 */

import { el } from '../render/svg.js';
import { isHex } from '../util/color.js';
import { n } from '../util/num.js';

/** The finishes. */
export const PLATE_FINISHES = Object.freeze(/** @type {const} */ (['ink', 'deboss', 'emboss', 'engrave', 'foil']));

/** The metals foil comes in: dark, mid, light and the highlight of each. */
export const PLATE_METALS = Object.freeze({
	gold: Object.freeze(['#6b4f1d', '#b8913e', '#e8cd86', '#fff3cf']),
	silver: Object.freeze(['#55595e', '#9ea3a8', '#d9dde0', '#ffffff']),
	copper: Object.freeze(['#5e2f1c', '#a8603e', '#e0a07a', '#ffe0cc']),
	rose: Object.freeze(['#6e4440', '#b88276', '#e6bdb2', '#fff0ea']),
});

/** Each finish's defaults: how deep (0–1), how wide its edge (a fraction of the sign's short side), how much darker inside (0–1), whether the art's ink shows. */
const DEFAULTS = Object.freeze({
	ink: Object.freeze({ depth: 0, edge: 0, tone: 0, ink: true }),
	deboss: Object.freeze({ depth: 0.5, edge: 0.006, tone: 0.06, ink: false }),
	emboss: Object.freeze({ depth: 0.5, edge: 0.006, tone: 0, ink: false }),
	engrave: Object.freeze({ depth: 0.35, edge: 0.0025, tone: 0, ink: true }),
	foil: Object.freeze({ depth: 0.25, edge: 0.0025, tone: 0, ink: false }),
});

/** Where the light comes from when a screen doesn't say: the top left (degrees clockwise from the +x axis, y down). */
export const DEFAULT_LIGHT = 225;

/** The light's elevation over the surface, in degrees. */
const ELEVATION = 45;

/**
 * A finish from its option.
 *
 * @param {unknown} v A finish's name, or `{ type, depth, edge, tone, ink, color, metal }`.
 * @param {string} at Where it was given, for errors.
 * @returns {import('./finish.js').ResolvedFinish} The finish, every field set.
 * @throws {TypeError} For an unknown finish or a bad field.
 */
export function resolveFinish(v, at = 'plate') {
	const o = typeof v === 'string' ? { type: v } : v === undefined || v === null ? { type: 'ink' } : /** @type {Record<string, unknown>} */ (v);
	if (typeof o !== 'object' || !PLATE_FINISHES.includes(/** @type {any} */ (o.type))) throw new TypeError(`${at}: finish is one of ${PLATE_FINISHES.join(', ')}, or { type, … } (got ${JSON.stringify(v)})`);
	const type = /** @type {import('./finish.js').FinishType} */ (o.type);
	const d = DEFAULTS[type];
	const unit = (k, def) => {
		const x = o[k] ?? def;
		if (typeof x !== 'number' || !Number.isFinite(x) || x < 0 || x > 1) throw new TypeError(`${at}: finish.${k} is a number, 0–1 (got ${JSON.stringify(o[k])})`);
		return x;
	};
	if (o.color !== undefined && !isHex(o.color)) throw new TypeError(`${at}: finish.color is a hex colour (got ${JSON.stringify(o.color)})`);
	const metal = o.metal ?? 'gold';
	if (!(typeof metal === 'string' && (Object.hasOwn(PLATE_METALS, metal) || isHex(metal)))) throw new TypeError(`${at}: finish.metal is ${Object.keys(PLATE_METALS).join(', ')} or a hex colour (got ${JSON.stringify(o.metal)})`);
	return {
		type,
		depth: unit('depth', d.depth),
		edge: unit('edge', d.edge),
		tone: unit('tone', d.tone),
		ink: o.ink === undefined ? d.ink : Boolean(o.ink),
		color: /** @type {string | undefined} */ (o.color),
		metal: /** @type {string} */ (metal),
	};
}

/**
 * A metal's four tones, from its name or a hex colour (its mid tone).
 *
 * @param {string} metal The metal.
 * @returns {readonly string[]} Dark, mid, light, highlight.
 */
function metalTones(metal) {
	if (Object.hasOwn(PLATE_METALS, metal)) return PLATE_METALS[/** @type {keyof typeof PLATE_METALS} */ (metal)];
	return [shade(metal, 0.45), metal, shade(metal, 1.35), '#ffffff'];
}

/**
 * A hex colour scaled in brightness.
 *
 * @param {string} hex The colour.
 * @param {number} k The factor.
 * @returns {string} The new colour.
 */
function shade(hex, k) {
	const v = parseInt(hex.slice(1).padEnd(6, hex.slice(1)), 16);
	const c = [v >> 16, (v >> 8) & 255, v & 255].map((x) => Math.max(0, Math.min(255, Math.round(x * k))));
	return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The filter region round a box, grown so a blur at its edge isn't cut off.
 *
 * @param {readonly number[]} box The box: left, top, width, height.
 * @param {number} m The margin, in pixels.
 * @returns {Record<string, number | string>} The filter's region attributes.
 */
const region = ([x, y, w, h], m) => ({ filterUnits: 'userSpaceOnUse', x: x - m, y: y - m, width: w + 2 * m, height: h + 2 * m, 'color-interpolation-filters': 'sRGB' });

/**
 * The relief filter: the art's alpha blurred into a height, lit from a direction, mapped so flat is mid-grey (for `hard-light`).
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {readonly number[]} box The screen's box.
 * @param {number} sigma The edge's blur, in pixels.
 * @param {number} depth How deep, 0–1.
 * @param {number} azimuth Where the light comes from, degrees.
 * @returns {string} A `url(#…)`.
 */
export function reliefFilter(sc, box, sigma, depth, azimuth) {
	const id = sc.id('relief');
	const flat = Math.sin((ELEVATION * Math.PI) / 180);
	// the slope stays gentle (about 30° at the steepest) and the depth sets how strongly its light shows
	const gain = depth * 1.2;
	const fn = (tag) => el(tag, { type: 'linear', slope: n(gain), intercept: n(0.5 - gain * flat) });
	sc.def(
		el(
			'filter',
			{ id, ...region(box, sigma * 4) },
			el('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: n(sigma), result: 'h' }),
			el('feDiffuseLighting', { in: 'h', surfaceScale: n(sigma * 1.5), diffuseConstant: 1, 'lighting-color': '#ffffff', result: 'lit' }, el('feDistantLight', { azimuth: n(((azimuth % 360) + 360) % 360), elevation: ELEVATION })),
			el('feComponentTransfer', { in: 'lit' }, fn('feFuncR'), fn('feFuncG'), fn('feFuncB')),
		),
	);
	return `url(#${id})`;
}

/**
 * A filter turning the art into one flat colour, its alpha kept (softened a little).
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {readonly number[]} box The screen's box.
 * @param {string} color The colour.
 * @param {number} [soften=0] A blur, in pixels.
 * @returns {string} A `url(#…)`.
 */
export function flatFilter(sc, box, color, soften = 0) {
	const id = sc.id('flat');
	const v = parseInt(color.slice(1).padEnd(6, color.slice(1)), 16);
	const [r, g, b] = [v >> 16, (v >> 8) & 255, v & 255].map((x) => n(x / 255));
	sc.def(
		el(
			'filter',
			{ id, ...region(box, 4) },
			el('feColorMatrix', { in: 'SourceGraphic', type: 'matrix', values: `0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 1 0` }),
			soften > 0 ? el('feGaussianBlur', { stdDeviation: n(soften) }) : '',
		),
	);
	return `url(#${id})`;
}

/**
 * The cloth filter: the art pushed about by the photo's own folds (the shading's broad light, its very broadest taken
 * out so a plain sheet isn't shifted), as a print follows the cloth it's on.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./format.js').PlateScreen} s The screen (its `box` and `shading`).
 * @param {number} amount How far, in pixels.
 * @returns {string} A `url(#…)`.
 */
export function clothFilter(sc, s, amount) {
	const id = sc.id('cloth');
	const [x, y, w, h] = s.box;
	const fold = Math.max(1, Math.hypot(w, h) * 0.004);
	const one = (tag) => el(tag, { type: 'linear', slope: 0, intercept: 1 });
	sc.def(
		el(
			'filter',
			{ id, ...region(s.box, amount * 2) },
			el('feImage', { href: s.shading, x, y, width: w, height: h, preserveAspectRatio: 'none', result: 's' }),
			el('feGaussianBlur', { in: 's', stdDeviation: n(fold), result: 'near' }),
			el('feGaussianBlur', { in: 's', stdDeviation: n(fold * 12), result: 'far' }),
			el('feComposite', { in: 'near', in2: 'far', operator: 'arithmetic', k1: 0, k2: 1.6, k3: -1.6, k4: 0.5, result: 'hp' }),
			el('feComponentTransfer', { in: 'hp', result: 'map' }, one('feFuncA')),
			el('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: n(amount), xChannelSelector: 'G', yChannelSelector: 'G' }),
		),
	);
	return `url(#${id})`;
}

/**
 * The layers a finish lays over a sign, given the art warped into it (with its ground) and alone.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./format.js').PlateScreen} s The screen.
 * @param {object} o What it's drawn from.
 * @param {import('./finish.js').ResolvedFinish} o.finish The finish.
 * @param {string} o.alone The id of the art warped alone (no ground), its alpha its shape.
 * @param {number} o.size The sign's short side, in pixels.
 * @param {string} o.fill The sign's outline, as a path.
 * @returns {string} The markup, to go over the sign's surface (inside its edge mask).
 */
export function finishLayers(sc, s, { finish, alone, size, fill }) {
	if (finish.type === 'ink') return '';
	const sigma = Math.max(0.6, finish.edge * size);
	const azimuth = s.light ?? DEFAULT_LIGHT;
	const art = `#${alone}`;
	let out = '';
	if (finish.type === 'foil') {
		const [dark, mid, light, hi] = metalTones(finish.metal);
		const [x, y, w, h] = s.box;
		const a = ((azimuth + 90) * Math.PI) / 180;
		const [cx, cy, r] = [x + w / 2, y + h / 2, Math.hypot(w, h) / 2];
		const grad = sc.id('metal');
		sc.def(
			el(
				'linearGradient',
				{ id: grad, gradientUnits: 'userSpaceOnUse', x1: n(cx - Math.cos(a) * r), y1: n(cy - Math.sin(a) * r), x2: n(cx + Math.cos(a) * r), y2: n(cy + Math.sin(a) * r) },
				...[[0, mid], [0.22, light], [0.34, hi], [0.48, mid], [0.62, dark], [0.78, light], [0.9, hi], [1, mid]].map(([o, c]) => el('stop', { offset: o, 'stop-color': c })),
			),
		);
		const shape = sc.id('foilshape');
		sc.def(el('mask', { id: shape, maskUnits: 'userSpaceOnUse', x: x - 4, y: y - 4, width: w + 8, height: h + 8 }, el('use', { href: art, filter: flatFilter(sc, s.box, '#ffffff', 0.35) })));
		const grain = sc.id('foilgrain');
		sc.def(el('filter', { id: grain, ...region(s.box, 0) }, el('feTurbulence', { type: 'fractalNoise', baseFrequency: n(Math.min(0.9, 60 / Math.max(60, size))), numOctaves: 2, seed: 3 }), el('feColorMatrix', { type: 'saturate', values: 0 })));
		const foil =
			el('path', { d: fill, fill: `url(#${grad})` }) +
			el('path', { d: fill, fill: '#808080', filter: `url(#${grain})`, opacity: 0.35, style: 'mix-blend-mode:overlay' }) +
			(s.shading ? el('image', { href: s.shading, x, y, width: w, height: h, preserveAspectRatio: 'none', opacity: 0.45, style: 'mix-blend-mode:multiply' }) : '');
		out += el('g', { mask: `url(#${shape})`, style: 'isolation:isolate' }, foil);
		// stamped: pressed a little into the stock
		out += el('use', { href: art, filter: reliefFilter(sc, s.box, sigma, finish.depth, azimuth + 180), style: 'mix-blend-mode:hard-light' });
		return out;
	}
	// a colour for the cut or pressed art, when one is given and it shows (without one, the art prints in its own)
	if (finish.ink && finish.color) out += el('use', { href: art, filter: flatFilter(sc, s.box, finish.color, 0.3), style: 'mix-blend-mode:multiply' });
	if (finish.tone > 0) out += el('use', { href: art, filter: flatFilter(sc, s.box, '#000000', sigma * 0.5), opacity: n(finish.tone) });
	const pressed = finish.type !== 'emboss';
	out += el('use', { href: art, filter: reliefFilter(sc, s.box, sigma, finish.depth, pressed ? azimuth + 180 : azimuth), style: 'mix-blend-mode:hard-light' });
	return out;
}
