/**
 * @module @arraypress/mockups/materials/desk
 *
 * What printed things lie on: concrete, oak boards, linen, a paper
 * backdrop, riven slate, a cutting mat and a knit blanket, or any of the
 * plain grounds. Each texture is built in three
 * scales so it never repeats visibly: broad mottling drawn in JS as a small
 * stretched image (so it costs nothing to rasterise), fine tooth from a
 * seamless turbulence tile, and for oak the grain itself, drawn row by row.
 * Over it all, a soft fall of window light from the light's side and a
 * vignette, as a photo of a desk has. Textures are scaled in millimetres,
 * so a card's desk and a T-shirt's read at their true sizes.
 */

import { el } from '../render/svg.js';
import { resolveGround, groundLayer } from './ground.js';
import { mottle, speckTile } from './noise.js';
import { slate } from './slate.js';
import { cuttingMat } from './cuttingmat.js';
import { knit } from './knit.js';
import { field, fbm, ridge, blur, shadePng, greyPng, noise2 } from '../util/field.js';
import { rng, hash } from '../util/rng.js';
import { isHex, luma, mix } from '../util/color.js';
import { clamp, n } from '../util/num.js';

/** The textured surfaces: their colour and how strongly they're textured. */
export const SURFACES = Object.freeze({
	concrete: Object.freeze({ color: '#bfbcb6' }),
	oak: Object.freeze({ color: '#c49a6c' }),
	linen: Object.freeze({ color: '#d8d0c2' }),
	paper: Object.freeze({ color: '#ecebe7' }),
	slate: Object.freeze({ color: '#3d3f43' }),
	'cutting-mat': Object.freeze({ color: '#1f6a55' }),
	knit: Object.freeze({ color: '#e6dccb' }),
});

export { mottle, speckTile };

/** The textures, by name. */
const TEXTURES = /** @type {const} */ (['concrete', 'oak', 'linen', 'paper', 'slate', 'cutting-mat', 'knit']);

/** The textures' names, as an error lists them. */
const NAMES = TEXTURES.map((t) => `'${t}'`).join(', ');

/**
 * A surface resolved from its option.
 *
 * @param {import('./desk.js').SurfaceOption | undefined} s A texture's name, `{ texture, color }`, or a plain ground (`'light'`, `'dark'`, a hex colour, `{ color, vignette }`).
 * @param {string} [fallback='concrete'] The surface when there's none.
 * @param {string} [name='surface'] The option's name, for errors.
 * @returns {import('./desk.js').Surface} The surface.
 * @throws {TypeError} For anything else.
 */
export function resolveSurface(s, fallback = 'concrete', name = 'surface') {
	const v = s ?? fallback;
	/** @type {import('./desk.js').Texture | null} */
	let texture = null;
	let color;
	let vignette = 0.18;
	if (typeof v === 'string' && TEXTURES.includes(/** @type {never} */ (v))) {
		texture = /** @type {import('./desk.js').Texture} */ (v);
		color = SURFACES[texture].color;
	} else if (v && typeof v === 'object' && 'texture' in v) {
		if (!TEXTURES.includes(/** @type {never} */ (v.texture))) throw new TypeError(`${name}.texture: ${NAMES} (got ${JSON.stringify(v.texture)})`);
		if (v.color !== undefined && !isHex(v.color)) throw new TypeError(`${name}.color: a hex colour (got ${JSON.stringify(v.color)})`);
		texture = v.texture;
		color = v.color ?? SURFACES[texture].color;
	} else {
		let g;
		try {
			g = resolveGround(/** @type {import('../types.js').Ground} */ (v));
		} catch {
			throw new TypeError(`${name}: ${NAMES}, { texture, color }, 'light', 'dark', a hex colour or { color, vignette } (got ${JSON.stringify(v)})`);
		}
		return { texture: null, color: g.color, vignette: g.vignette, dark: g.dark, shadow: g.shadow };
	}
	const l = luma(color);
	return { texture, color, vignette, dark: l < 0.4, shadow: l < 0.4 ? 1.6 : l < 0.65 ? 1.2 : 1 };
}

/**
 * The surface, filling the frame.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./desk.js').Surface} s The surface.
 * @param {{ light: number, seed: string, mm: number }} o Where the light is (-1 left to 1 right), the seed, and how many pixels make a millimetre.
 * @returns {string} The markup.
 */
export function surfaceLayer(sc, s, { light, seed, mm }) {
	const { width: w, height: h } = sc;
	if (!s.texture) return groundLayer(sc, { color: s.color, vignette: s.vignette, dark: s.dark, shadow: s.shadow }) + falloff(sc, light, 0.5);
	const px = Math.max(0.2, mm);
	const base = el('rect', { width: w, height: h, fill: s.color });
	const draw = {
		concrete: () => concrete(sc, seed, px),
		oak: () => oak(sc, s.color, seed, px),
		linen: () => linen(sc, s.color, seed, px, light),
		paper: () => paper(sc, seed, px),
		slate: () => slate(sc, seed, px, light),
		'cutting-mat': () => cuttingMat(sc, s.color, seed, px),
		knit: () => knit(sc, seed, px, light),
	};
	const body = draw[s.texture]();
	return base + body + falloff(sc, light, 1) + vignette(sc, s.vignette);
}

/**
 * Concrete: broad cloudy mottling, fine sandy grain, and a scatter of small pits.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} seed The seed.
 * @param {number} mm Pixels per millimetre.
 * @returns {string} The layers.
 */
function concrete(sc, seed, mm) {
	const { width: w, height: h } = sc;
	const s = hash(seed);
	const span = Math.max(w, h) / mm; // the frame's longer side in mm
	const grain = speckTile(sc, { size: 384, freq: [0.9 / Math.max(1, mm * 0.45), 0.9 / Math.max(1, mm * 0.45)], octaves: 2, dark: 0.11, light: 0.09, seed: s });
	const pits = speckTile(sc, { size: 448, freq: [0.3 / Math.max(1, mm * 0.5), 0.3 / Math.max(1, mm * 0.5)], octaves: 2, dark: 0.9, light: 0, cut: 0.62, seed: s + 7, type: 'turbulence' });
	return (
		mottle(sc, `${seed}:c`, Math.min(span / 45, 9), 0.05, 4) +
		mottle(sc, `${seed}:c2`, Math.min(span / 9, 40), 0.03, 2) +
		el('rect', { width: w, height: h, fill: grain }) +
		el('rect', { width: w, height: h, fill: pits, opacity: 0.85 })
	);
}

/**
 * A paper backdrop: soft formation (the cloudy look of paper fibres) and a fine tooth.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} seed The seed.
 * @param {number} mm Pixels per millimetre.
 * @returns {string} The layers.
 */
function paper(sc, seed, mm) {
	const { width: w, height: h } = sc;
	const span = Math.max(w, h) / mm;
	const tooth = speckTile(sc, { size: 320, freq: [0.7 / Math.max(1, mm * 0.3), 0.7 / Math.max(1, mm * 0.3)], octaves: 2, dark: 0.05, light: 0.05, seed: hash(seed) });
	return mottle(sc, `${seed}:p`, span / 50, 0.035) + mottle(sc, `${seed}:p2`, span / 6, 0.025, 2) + el('rect', { width: w, height: h, fill: tooth });
}

/**
 * Linen: a fine plain weave with slubs (threads thicker for a stretch), its natural mottling, and a few soft creases lit from the light.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} color Its colour.
 * @param {string} seed The seed.
 * @param {number} mm Pixels per millimetre.
 * @param {number} light Where the light is.
 * @returns {string} The layers.
 */
function linen(sc, color, seed, mm, light) {
	const { width: w, height: h } = sc;
	const s = hash(seed);
	const span = Math.max(w, h) / mm;
	const thread = Math.max(1.4, mm * 0.45); // a thread's pitch in pixels
	// the weave itself: a fine over-and-under at the thread's pitch, dashed lines on a tile of many threads (a tile per thread is slow to draw)
	const weave = sc.id('weave');
	const t = thread;
	const reps = Math.max(1, Math.round(96 / (2 * t)));
	const T = reps * 2 * t;
	let lines = '';
	for (let i = 0; i < 2 * reps; i++) {
		const p = (i + 0.75) * t;
		const dash = { 'stroke-dasharray': `${n(t)} ${n(t)}`, 'stroke-dashoffset': i % 2 ? t : 0 };
		lines += el('line', { x1: 0, y1: p, x2: T, y2: p, stroke: '#000', 'stroke-opacity': 0.09, 'stroke-width': t * 0.45, ...dash });
		lines += el('line', { x1: p, y1: 0, x2: p, y2: T, stroke: '#000', 'stroke-opacity': 0.07, 'stroke-width': t * 0.45, ...dash, 'stroke-dashoffset': i % 2 ? 0 : t });
	}
	sc.def(el('pattern', { id: weave, patternUnits: 'userSpaceOnUse', width: T, height: T }, el('rect', { width: T, height: T, fill: '#fff', opacity: 0.05 }), lines));
	// slubs: threads thicker or darker for a few millimetres, both ways, never long enough to read as stripes
	const along = 1 / (7 * mm);
	const across = 1 / (0.55 * mm);
	// (tiles of different sizes, so their repeats never line up into a visible motif)
	const slubX = speckTile(sc, { size: 512, freq: [along, across], octaves: 2, dark: 0.11, light: 0.08, cut: 0.62, seed: s + 5, type: 'turbulence' });
	const slubY = speckTile(sc, { size: 456, freq: [across, along], octaves: 2, dark: 0.08, light: 0.06, cut: 0.62, seed: s + 7, type: 'turbulence' });
	const fine = speckTile(sc, { size: 256, freq: [0.45, 0.45], octaves: 1, dark: 0.04, light: 0.04, seed: s + 9 });
	// creases: a few long soft folds across the cloth
	const r = rng(`${seed}:creases`);
	const f = fbm(field(80, Math.max(8, Math.round((80 * h) / w))), { seed: `${seed}:cloth`, scale: 2.2, octaves: 2, amp: 0.25 });
	for (let i = 0; i < 4; i++) {
		const y = r.range(0.1, 0.9);
		const x = r.range(-0.2, 0.4);
		ridge(f, [x, y], [x + r.range(0.6, 1.1), y + r.range(-0.25, 0.25)], r.range(0.008, 0.02), r.range(-0.25, 0.35));
	}
	blur(f, 1);
	const creases = el('image', { width: w, height: h, href: shadePng(f, { light, relief: 12, dark: 0.07, bright: 0.05 }), preserveAspectRatio: 'none' });
	const tone = luma(color) < 0.4 ? 0.6 : 1;
	return (
		mottle(sc, `${seed}:l`, span / 50, 0.06) +
		el('g', { opacity: tone }, el('rect', { width: w, height: h, fill: `url(#${weave})` }), el('rect', { width: w, height: h, fill: slubX }), el('rect', { width: w, height: h, fill: slubY }), el('rect', { width: w, height: h, fill: fine })) +
		creases
	);
}

/**
 * Oak boards: planks running across the frame, each its own shade, with the grain drawn row by row (latewood lines wandering along the board, rays and pores) and the joints between them.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} color The wood's colour.
 * @param {string} seed The seed.
 * @param {number} mm Pixels per millimetre.
 * @returns {string} The layers.
 */
function oak(sc, color, seed, mm) {
	const { width: w, height: h } = sc;
	const r = rng(`${seed}:oak`);
	const s = hash(seed);
	const board = 140 * mm; // a board's width in pixels
	const rows = Math.min(900, Math.ceil(h / 1.6));
	const cols = 200;
	/** @type {{ top: number, bottom: number, shade: number, phase: number, pitch: number, pith: number }[]} */
	const boards = [];
	for (let y = -r.range(0, board * 0.8); y < h; ) {
		const bw = board * r.range(0.85, 1.15);
		// flat-sawn: the rings round a pith line inside the board
		boards.push({ top: y, bottom: y + bw, shade: r.range(-0.07, 0.07), phase: r.range(0, 100), pitch: r.range(2.4, 3.6) * mm, pith: y + bw * r.range(0.3, 0.7) });
		y += bw;
	}
	const href = greyPng(cols, rows, (cx, cy) => {
		const y = ((cy + 0.5) / rows) * h;
		const x = ((cx + 0.5) / cols) * w;
		const b = boards.find((q) => y < q.bottom) ?? boards[boards.length - 1];
		const bs = s + Math.round(b.phase * 31);
		const wob = noise2(x / (90 * mm), b.phase + 5, bs) * 3 * mm + noise2(x / (25 * mm), b.phase + 6, bs) * 0.8 * mm;
		const dy = y - b.pith + wob;
		// distance from the pith through a cone of growth: where the saw cut nearer the pith the rings close into arches
		const cone = 14 * mm * Math.max(0, 0.9 + noise2(x / (300 * mm), b.phase + 2, bs) + 0.25 * noise2(x / (90 * mm), b.phase + 4, bs));
		const d = Math.sqrt(dy * dy + cone * cone);
		const u = d / b.pitch + 0.9 * noise2(d / (14 * mm), b.phase + 9, bs);
		const late = Math.pow(0.5 + 0.5 * Math.cos(u * Math.PI * 2), 6) * (0.6 + 0.4 * noise2(x / (40 * mm), d / (8 * mm), bs + 11));
		const streak = noise2(x / (220 * mm), y / (4 * mm), bs + 3);
		const pore = noise2(x / (3 * mm), y / (0.3 * mm), bs + 5) * late;
		let v = b.shade + 0.14 * (late - 0.15) + 0.05 * streak + 0.05 * pore;
		// the joint: a dark line and the board's slightly worn arris
		const edge = Math.min(y - b.top, b.bottom - y) / mm;
		if (edge < 0.45) v += 0.5 * (1 - edge / 0.45);
		return [v > 0 ? 0 : 1, Math.min(1, Math.abs(v) * (v > 0 ? 1.4 : 1.1))];
	});
	return mottle(sc, `${seed}:o`, Math.max(w, h) / mm / 90, 0.06, 2) + el('image', { width: w, height: h, href, preserveAspectRatio: 'none' }) + el('rect', { width: w, height: h, fill: mix(color, '#ffffff', 0.5), opacity: 0.04 });
}

/**
 * The fall of window light across the frame: brighter on the light's side towards the top, dimmer away from it.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {number} light Where the light is, left (-1) to right (1).
 * @param {number} amount How strong, 0–1.
 * @returns {string} The layer.
 */
export function falloff(sc, light, amount) {
	const g = sc.id('fall');
	const lx = clamp(light, -1, 1);
	sc.def(
		el(
			'linearGradient',
			{ id: g, x1: 0.5 + 0.45 * lx, y1: 0, x2: 0.5 - 0.45 * lx, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.1 * amount }),
			el('stop', { offset: 0.45, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.1 * amount }),
		),
	);
	return el('rect', { width: sc.width, height: sc.height, fill: `url(#${g})` });
}

/**
 * A soft darkening towards the corners.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {number} amount How dark the corners go, 0–1.
 * @returns {string} The layer, or nothing.
 */
function vignette(sc, amount) {
	if (amount <= 0) return '';
	const { width: w, height: h } = sc;
	const v = sc.id('vig');
	sc.def(
		el(
			'radialGradient',
			{ id: v, gradientUnits: 'userSpaceOnUse', cx: w / 2, cy: h * 0.48, r: Math.hypot(w, h) * 0.6 },
			el('stop', { offset: 0.5, 'stop-color': '#000', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': amount }),
		),
	);
	return el('rect', { width: w, height: h, fill: `url(#${v})` });
}
