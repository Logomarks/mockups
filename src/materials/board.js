/**
 * @module @arraypress/mockups/materials/board
 *
 * Packaging board: kraft, white-top, black, or a colour, and the fibre
 * that makes it read as board rather than plastic. Kraft is a warm
 * mid-brown, never flat: cloudy flocs at two or three scales, short
 * visible fibres lying mostly along the machine direction, and a scatter of
 * darker flecks. White-top is off-white with the same structure, faint;
 * black board shows its fibres a little lighter than itself.
 *
 * When the photographed kraft textures are loaded (`materials/textures.js`)
 * kraft is drawn with them, and every other board takes their grain: the
 * texture's lighter and darker than its mean, laid over the board's colour.
 * Without them, the fibre is procedural: a seamless tile (seeded, so the
 * same box always gets the same board) of tone (lighter and darker than the
 * board's colour) and height (the fibres stand a little proud).
 *
 * Either way 2D maps the surface through each face's own transform, with a
 * seeded turn and offset per face so the repeat never lines up, and lays
 * the grain over the print as well, so ink sits in the fibres.
 */

import { el } from '../render/svg.js';
import { field, fbm, ridge, blur, greyPng } from '../util/field.js';
import { rng, hash } from '../util/rng.js';
import { isHex, luma, mix } from '../util/color.js';
import { clamp, n } from '../util/num.js';
import { kraftTextures, KRAFT_SPAN, KRAFT_MEAN } from './textures.js';

/** The board colours by name: kraft, white-top and black. */
export const BOARDS = Object.freeze({ kraft: '#b58b5d', white: '#efede8', black: '#212123' });

/** A board's name. */
const NAMES = /** @type {const} */ (['kraft', 'white', 'black']);

/**
 * How each board's fibre reads: the flocs' strength at three scales (about 16, 5 and 1.4 mm), fine grain, the fibres (per mm², how much lighter or darker, the share that's darker), and the flecks.
 *
 * @type {Readonly<Record<'kraft' | 'white' | 'black', import('./board.js').FibreLook>>}
 */
export const FIBRE_LOOKS = Object.freeze({
	kraft: Object.freeze({ flocs: [0.075, 0.05, 0.03], grain: 0.03, fibres: 0.9, fibreTone: 0.17, darker: 0.65, flecks: 0.035, fleckTone: 0.45, relief: 1 }),
	white: Object.freeze({ flocs: [0.03, 0.022, 0.012], grain: 0.012, fibres: 0.45, fibreTone: 0.035, darker: 0.8, flecks: 0.006, fleckTone: 0.16, relief: 0.6 }),
	black: Object.freeze({ flocs: [0.035, 0.025, 0.015], grain: 0.015, fibres: 0.55, fibreTone: 0.06, darker: 0.15, flecks: 0.006, fleckTone: 0.1, relief: 0.7 }),
});

/**
 * A board from its option.
 *
 * @param {import('./board.js').BoardOption | undefined} v `'kraft'`, `'white'`, `'black'` or a hex colour (`'kraft'`).
 * @param {string} [object='box'] The object, for the error.
 * @returns {import('./board.js').Board} The board: its name (`'custom'` for a colour), colour and fibre.
 * @throws {TypeError} For anything else.
 */
export function resolveBoard(v = 'kraft', object = 'box') {
	if (typeof v === 'string' && Object.hasOwn(BOARDS, v)) {
		const name = /** @type {'kraft' | 'white' | 'black'} */ (v);
		return { name, color: BOARDS[name], look: FIBRE_LOOKS[name] };
	}
	if (isHex(v)) {
		// a colour is a dyed or solid-printed sheet: its fibre reads like white-top's, or black's when it's dark
		const dark = luma(/** @type {string} */ (v)) < 0.3;
		return { name: 'custom', color: /** @type {string} */ (v), look: FIBRE_LOOKS[dark ? 'black' : 'white'] };
	}
	throw new TypeError(`${object}: board is ${NAMES.map((n) => `'${n}'`).join(', ')} or a hex colour (got ${JSON.stringify(v)})`);
}

/**
 * The inside's colour for a board: kraft is a touch lighter and warmer inside; a white-top mailer is kraft inside; a rigid box and black or coloured board are lined in their own colour.
 *
 * @param {import('./board.js').Board} board The board.
 * @param {'mailer' | 'lid'} kind The box.
 * @returns {string} A hex colour.
 */
export function liningFor(board, kind) {
	if (board.name === 'kraft') return mix(board.color, '#e2c08f', 0.22);
	if (board.name === 'white' && kind === 'mailer') return mix(BOARDS.kraft, '#e2c08f', 0.22);
	return board.color;
}

/**
 * A seamless tile of board fibre: tone (lighter above 0, darker below) and height (0 flat, up to about 1 on a fibre).
 *
 * @param {import('./board.js').FibreLook} look How the fibre reads.
 * @param {object} o The tile.
 * @param {string} o.seed The seed.
 * @param {number} [o.size=256] Its side, in cells.
 * @param {number} [o.span=40] Its side, in mm.
 * @returns {{ tone: import('../util/field.js').Field, height: import('../util/field.js').Field, span: number }} The tile.
 */
export function fibreField(look, { seed, size = 256, span = 40 }) {
	const tone = field(size, size);
	const height = field(size, size);
	// the flocs: cloudy, at three scales, like pulp settling unevenly
	[16, 5, 1.4].forEach((mm, i) => fbm(tone, { seed: `${seed}:floc${i}`, scale: span / mm, octaves: 2, amp: look.flocs[i], wrap: true }));
	fbm(height, { seed: `${seed}:floch`, scale: span / 5, octaves: 2, amp: 0.25, wrap: true });
	const r = rng(`${seed}:fibre`);
	// a segment added to a field and wrapped round its edges, so the tile stays seamless
	const wrapped = (f, a, b, w, h, taper) => {
		for (const dx of [-1, 0, 1]) {
			for (const dy of [-1, 0, 1]) {
				const xs = [a[0] + dx, b[0] + dx];
				const ys = [a[1] + dy, b[1] + dy];
				const pad = w * 3;
				if (Math.max(...xs) < -pad || Math.min(...xs) > 1 + pad || Math.max(...ys) < -pad || Math.min(...ys) > 1 + pad) continue;
				ridge(f, [xs[0], ys[0]], [xs[1], ys[1]], w, h, taper);
			}
		}
	};
	// the fibres: short, fine, lying mostly along the machine direction (across the tile)
	const count = Math.round(look.fibres * span * span);
	for (let i = 0; i < count; i++) {
		const len = r.range(0.6, 3.2) / span;
		const a = r.range(-0.75, 0.75) + (r.next() < 0.2 ? Math.PI / 2 : 0);
		const x = r.next();
		const y = r.next();
		const ex = x + Math.cos(a) * len;
		const ey = y + Math.sin(a) * len;
		const w = r.range(0.06, 0.14) / span;
		const t = look.fibreTone * r.range(0.45, 1) * (r.next() < look.darker ? -1 : 1);
		wrapped(tone, [x, y], [ex, ey], w, t, 0.3);
		wrapped(height, [x, y], [ex, ey], w * 1.3, r.range(0.4, 1), 0.3);
	}
	// the flecks: specks of bark and shive, darker than the sheet
	const flecks = Math.round(look.flecks * span * span);
	for (let i = 0; i < flecks; i++) {
		const c = /** @type {[number, number]} */ ([r.next(), r.next()]);
		const rad = r.range(0.08, 0.3) / span;
		wrapped(tone, c, [c[0] + 1e-4, c[1]], rad, -look.fleckTone * r.range(0.4, 1), 0);
		wrapped(height, c, [c[0] + 1e-4, c[1]], rad, 0.3, 0);
	}
	// fine grain, cell by cell
	const g = rng(`${seed}:grain`);
	for (let i = 0; i < tone.v.length; i++) tone.v[i] += (g.next() + g.next() - 1) * look.grain;
	blur(height, 0.6);
	return { tone, height, span };
}

/** Tiles already drawn, by look and seed (they're deterministic, and a scene asks for the same one per face). */
const tiles = new Map();

/**
 * Board fibre as a grey-and-alpha PNG `data:` URI to lay over the board's colour (and its print): black where it's darker, white where it's lighter. The height lights it faintly from above, so the fibres stand proud.
 *
 * @param {import('./board.js').FibreLook} look How the fibre reads.
 * @param {string} seed The seed.
 * @param {number} [size=256] The tile's side, in pixels.
 * @param {number} [span=40] The tile's side, in mm.
 * @returns {string} The PNG.
 */
export function fibrePng(look, seed, size = 256, span = 40) {
	const key = `${JSON.stringify(look)}:${seed}:${size}:${span}`;
	if (!tiles.has(key)) {
		const { tone, height } = fibreField(look, { seed, size, span });
		const h = height.v;
		const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
		tiles.set(
			key,
			greyPng(size, size, (x, y) => {
				// relief from a light up and to the left of the face
				const lit = (at(x - 1, y - 1) - at(x + 1, y + 1)) * 0.06 * look.relief;
				const t = tone.v[y * size + x] + lit;
				return [t < 0 ? 0 : 1, clamp(Math.abs(t), 0, 0.85)];
			}),
		);
	}
	return tiles.get(key);
}

/** The procedural tile's size: pixels and millimetres. */
const FIBRE_TILE = { size: 256, span: 40 };

/**
 * How a surface sits on a face: a seeded quarter turn and offset, so neighbouring faces never show the same patch the same way.
 *
 * @param {string} seed The face's seed.
 * @param {number} span The tile's side, mm.
 * @param {number} size The tile's side, pixels.
 * @returns {string} The transform from the tile's pixels to the face's millimetres.
 */
function placement(seed, span, size) {
	const r = rng(seed);
	const turn = Math.floor(r.next() * 4) * 90;
	return `translate(${n(r.next() * span)} ${n(r.next() * span)}) rotate(${turn}) scale(${n(span / size)})`;
}

/**
 * A board's surface on one face, as two fills in the face's own frame: `base`, the board itself (the kraft photograph, or `null` to fill with the flat colour), and `grain`, its fibre to lay over the colour and over any print.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The face.
 * @param {string} o.color The board's colour here.
 * @param {boolean} o.kraft Whether it's kraft (drawn with the photograph when it's loaded).
 * @param {import('./board.js').FibreLook} o.look How its fibre reads.
 * @param {string} o.matrix The face's transform, from its frame in mm to pixels (an SVG `matrix(…)`).
 * @param {string} o.seed The face's seed (its variant, turn and offset).
 * @param {number} [o.grain=1] How strongly the grain shows.
 * @returns {{ base: string | null, grain: string }} The fills (`url(#…)`).
 */
export function boardSurface(sc, { color, kraft, look, matrix, seed, grain: strength = 1 }) {
	const photos = kraftTextures();
	const pattern = (size, span, content) => {
		const id = sc.id('board');
		sc.def(el('pattern', { id, patternUnits: 'userSpaceOnUse', width: size, height: size, patternTransform: `${matrix} ${placement(seed, span, size)}` }, content));
		return `url(#${id})`;
	};
	if (!photos.length) {
		const tile = el('image', { width: FIBRE_TILE.size, height: FIBRE_TILE.size, href: fibrePng(look, `${hash(seed) % 7}`, FIBRE_TILE.size, FIBRE_TILE.span) });
		return { base: null, grain: pattern(FIBRE_TILE.size, FIBRE_TILE.span, `<g opacity="${n(clamp(strength, 0, 1))}">${tile}</g>`) };
	}
	const size = 512;
	const photo = sc.image(photos[hash(`${seed}:variant`) % photos.length], 1)(0, 0, size, size);
	// the photograph's grain: black where it's darker than its mean, white where it's lighter
	const k = 2.2 * strength * (kraft ? 0.6 : look === FIBRE_LOOKS.white ? 0.5 : 0.75);
	const f = sc.id('grain');
	const L = [0.2126, 0.7152, 0.0722];
	sc.def(
		el(
			'filter',
			{ id: f, filterUnits: 'userSpaceOnUse', x: 0, y: 0, width: size, height: size, 'color-interpolation-filters': 'sRGB' },
			el('feColorMatrix', { in: 'SourceGraphic', type: 'matrix', values: `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${L.map((c) => n(-k * c)).join(' ')} 0 ${n(k * KRAFT_MEAN)}`, result: 'd' }),
			el('feColorMatrix', { in: 'SourceGraphic', type: 'matrix', values: `0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${L.map((c) => n(k * c)).join(' ')} 0 ${n(-k * KRAFT_MEAN)}`, result: 'l' }),
			el('feMerge', {}, el('feMergeNode', { in: 'd' }), el('feMergeNode', { in: 'l' })),
		),
	);
	const grain = pattern(size, KRAFT_SPAN, el('g', { filter: `url(#${f})` }, photo));
	if (!kraft) return { base: null, grain };
	// kraft: the photograph itself, tinted a little towards a kraft of another shade (a lining)
	const tint = color === BOARDS.kraft ? '' : el('rect', { width: size, height: size, fill: color, opacity: 0.35 });
	return { base: pattern(size, KRAFT_SPAN, photo + tint), grain };
}
