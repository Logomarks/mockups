/**
 * @module @logomarks/mockups/parts/wristband
 *
 * Event wristbands lying on a table, in millimetres round each band's
 * centre. A fabric band is a woven loop (a little out of round, as one
 * lies) with the name woven round it again and again, hemmed edges, the
 * inside of the loop in shadow, and a plastic slider with the mark on it,
 * the cut tail running out of it. A Tyvek band is the flat paper strip
 * before it's closed: its colour, the mark, the words and a serial
 * number printed along it, the fibres of the stock, and the peel tab at
 * its end with its die line.
 */

import { el, esc } from '../render/svg.js';
import { smooth } from './curve.js';
import { walk } from './strap.js';
import { outline, sheet } from './sheet.js';
import { resolveStock } from '../materials/paper.js';
import { speckTile } from '../materials/desk.js';
import { rng } from '../util/rng.js';
import { mix, luma } from '../util/color.js';
import { n } from '../util/num.js';

/** The kinds of band. */
export const WRISTBAND_KINDS = /** @type {const} */ (['fabric', 'tyvek']);

/** A fabric band's loop (lying, mm) and width; a Tyvek strip's length, width and peel tab. */
export const WRISTBAND = Object.freeze({
	fabric: Object.freeze({ rx: 38, ry: 21, width: 15 }),
	tyvek: Object.freeze({ length: 254, width: 25, tab: 28 }),
});

/** The type bands are printed in. */
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Each kind's colours, in turn, when a band names none. */
const COLORS = Object.freeze({ fabric: Object.freeze(['#e5372b', '#151515', '#2b4cd6', '#f2c230']), tyvek: Object.freeze(['#ff5fa8', '#3ad4ff', '#d4ff3a']) });

/**
 * The bands from the option, resolved.
 *
 * @param {unknown} list The option: each band a kind (`'fabric'`, `'tyvek'`) or `{ kind, color, ink, text, number, clasp }`.
 * @param {string} name The words a band carries when it names none.
 * @param {string} object The object's name, for errors.
 * @returns {import('./wristband.js').Band[]} The bands.
 * @throws {TypeError} For anything else.
 */
export function resolveBands(list, name, object) {
	if (!Array.isArray(list)) throw new TypeError(`${object}: wristbands is a list of 'fabric', 'tyvek' or { kind, color, ink, text, number }`);
	const seen = { fabric: 0, tyvek: 0 };
	return list.map((b, i) => {
		const o = /** @type {Record<string, unknown>} */ (typeof b === 'string' ? { kind: b } : b && typeof b === 'object' ? b : {});
		const kind = /** @type {'fabric' | 'tyvek'} */ (o.kind ?? 'fabric');
		if (!WRISTBAND_KINDS.includes(kind)) throw new TypeError(`${object}: band ${i} is 'fabric' or 'tyvek' (got ${JSON.stringify(b)})`);
		const pick = COLORS[kind];
		const color = /** @type {string} */ (o.color ?? pick[seen[kind]++ % pick.length]);
		for (const k of ['color', 'ink', 'clasp']) {
			if (o[k] !== undefined && !/^#[0-9a-f]{6}$/i.test(String(o[k]))) throw new TypeError(`${object}: band ${i}'s ${k} is a hex colour (got ${JSON.stringify(o[k])})`);
		}
		for (const k of ['text', 'number']) {
			if (o[k] !== undefined && typeof o[k] !== 'string') throw new TypeError(`${object}: band ${i}'s ${k} is a string (got ${JSON.stringify(o[k])})`);
		}
		return {
			kind,
			color,
			ink: /** @type {string} */ (o.ink ?? (luma(color) < 0.5 ? '#ffffff' : '#141414')),
			text: /** @type {string} */ (o.text ?? name.toUpperCase()),
			number: /** @type {string} */ (o.number ?? ''),
			clasp: /** @type {string} */ (o.clasp ?? '#1b1b1d'),
		};
	});
}

/**
 * Where bands lie, in mm round their group's centre: down a column, each turned a little the other way to the last.
 *
 * @param {import('./wristband.js').Band[]} bands The bands.
 * @param {string} seed The seed.
 * @returns {{ x: number, y: number, angle: number, w: number, h: number }[]} Each band's centre, turn and unturned size.
 */
export function bandPlacements(bands, seed) {
	const r = rng(`${seed}:bands`);
	const F = WRISTBAND.fabric;
	const T = WRISTBAND.tyvek;
	const sizes = bands.map((b) => (b.kind === 'fabric' ? [2 * F.rx + F.width + 14, 2 * F.ry + F.width] : [T.length, T.width]));
	const total = sizes.reduce((a, [, h]) => a + h * 0.82, 0);
	let y = -total / 2;
	return bands.map((b, i) => {
		const [w, h] = sizes[i];
		const at = { x: (i % 2 ? -1 : 1) * r.range(4, 14), y: y + (h * 0.82) / 2, angle: (i % 2 ? 1 : -1) * r.range(b.kind === 'tyvek' ? 6 : 12, b.kind === 'tyvek' ? 12 : 24), w, h };
		y += h * 0.82;
		return at;
	});
}

/**
 * A fabric band, its loop lying round the origin.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./wristband.js').Band} b The band.
 * @param {{ light: number, mark?: import('../render/scene.js').PlaceArt | null, seed: string }} o Where the light is, the mark for the slider, and the seed.
 * @returns {{ shadow: string, body: string }} Its silhouette in black, and the band.
 */
export function fabricBand(sc, b, { light, mark = null, seed }) {
	const { rx, ry, width } = WRISTBAND.fabric;
	const r = rng(`${seed}:loop`);
	// the loop's spine: an ellipse a little out of round, flatter where it lies on the table
	const wobble = Array.from({ length: 3 }, () => r.range(-0.025, 0.025));
	/** @type {[number, number][]} */
	const spine = [];
	const N = 64;
	for (let i = 0; i < N; i++) {
		const t = (i / N) * Math.PI * 2;
		const k = 1 + wobble.reduce((a, v, j) => a + v * Math.sin((j + 2) * t + j), 0);
		spine.push([Math.cos(t) * rx * k, Math.sin(t) * ry * k]);
	}
	const offset = (d) => spine.map((p, i) => {
		const a = spine[(i + N - 1) % N];
		const c = spine[(i + 1) % N];
		const l = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
		return /** @type {[number, number]} */ ([p[0] + ((c[1] - a[1]) / l) * d, p[1] - ((c[0] - a[0]) / l) * d]);
	});
	const ring = smooth(offset(width / 2)) + smooth(offset(-width / 2));
	const clip = sc.id('band');
	sc.def(el('clipPath', { id: clip }, el('path', { d: ring, 'clip-rule': 'evenodd' })));
	// the words, round the loop clockwise from the slider, so they read along the bottom
	// a whole number of repeats round the loop, so the words don't run into each other where it closes
	const size = width * 0.5;
	const word = `${b.text}  ·  `;
	const round = walk([...spine, spine[0]], 0.5).length * 0.5;
	const reps = Math.max(1, Math.round(round / (word.length * size * 0.72)));
	const glyphs = walk([...spine, spine[0]], round / (reps * word.length)).slice(0, reps * word.length);
	const type = b.text
		? el(
				'g',
				{ fill: b.ink, 'font-family': FONT, 'font-weight': 800, 'font-size': n(size), 'text-anchor': 'middle', opacity: 0.94 },
				...glyphs.map((g, i) => {
					const c = word[i % word.length];
					return c === ' ' ? '' : el('text', { transform: `translate(${n(g.x)} ${n(g.y)}) rotate(${n(g.a)}) translate(0 ${n(size * 0.36)})` }, esc(c));
				}),
			)
		: '';
	const edge = mix(b.color, '#000000', 0.3);
	const weave = speckTile(sc, { size: 12, freq: [2.2, 1.1], octaves: 1, dark: 0.12, light: 0.08, seed: 5 });
	const lit = sc.id('bandlit');
	sc.def(
		el(
			'linearGradient',
			{ id: lit, x1: n(0.5 + 0.4 * light), y1: 0, x2: n(0.5 - 0.4 * light), y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.14 }),
			el('stop', { offset: 0.55, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.16 }),
		),
	);
	// the slider where the ends meet, at the bottom of the loop, and the tail running out of it
	const [sx, sy] = spine[N / 4];
	const sw = 13;
	const sh = width + 5;
	const tail = smooth(
		[
			[sx - 2, sy - width / 2 + 1],
			[sx + 10, sy - width / 2 + 3],
			[sx + 24, sy - width / 2 + 9],
			[sx + 31, sy + width / 2 + 7],
			[sx + 18, sy + width / 2 + 2],
			[sx - 2, sy + width / 2 - 1],
		],
		true,
	);
	const slider = outline(sw, sh, 3);
	const sliderAt = `translate(${n(sx)} ${n(sy)})`;
	const plastic = sc.id('slider');
	sc.def(
		el(
			'linearGradient',
			{ id: plastic, x1: 0, y1: 0, x2: 1, y2: 1 },
			el('stop', { offset: 0, 'stop-color': mix(b.clasp, '#ffffff', 0.28) }),
			el('stop', { offset: 0.5, 'stop-color': b.clasp }),
			el('stop', { offset: 1, 'stop-color': mix(b.clasp, '#000000', 0.4) }),
		),
	);
	const body = el(
		'g',
		{},
		el('path', { d: tail, fill: b.color }),
		el('path', { d: tail, fill: weave, opacity: 0.8 }),
		el('path', { d: tail, fill: '#000', opacity: 0.12 }),
		el('path', { d: ring, 'fill-rule': 'evenodd', fill: b.color }),
		el(
			'g',
			{ 'clip-path': `url(#${clip})` },
			type,
			el('path', { d: ring, fill: weave, opacity: 0.85 }),
			el('path', { d: smooth(offset(width / 2 - 1.3)) + smooth(offset(-width / 2 + 1.3)), fill: 'none', stroke: edge, 'stroke-width': 0.35, 'stroke-dasharray': '1.1 0.7', opacity: 0.55 }),
			// the inside of the loop: where the band turns up off the table, it's in its own shadow
			el('path', { d: smooth(offset(-width / 2)), fill: 'none', stroke: '#000', 'stroke-width': 3, opacity: 0.35, filter: sc.blur(1.2) }),
			el('path', { d: smooth(offset(width / 2)), fill: 'none', stroke: edge, 'stroke-width': 1.4, opacity: 0.5, filter: sc.blur(0.4) }),
			el('path', { d: ring, fill: `url(#${lit})` }),
		),
		el('g', { transform: sliderAt }, el('path', { d: slider, fill: `url(#${plastic})` }), el('path', { d: outline(sw - 3, sh - 4, 2), fill: mix(b.clasp, '#ffffff', 0.14) })),
		mark ? el('g', { transform: sliderAt, opacity: 0.92 }, mark(-(sw - 5) / 2, -(sw - 5) / 2, sw - 5, sw - 5)) : '',
	);
	const shadow = el('g', {}, el('path', { d: ring, 'fill-rule': 'evenodd', fill: '#000' }), el('path', { d: tail, fill: '#000' }), el('path', { d: slider, transform: sliderAt, fill: '#000' }));
	return { shadow, body };
}

/**
 * A Tyvek band's print, centred on the origin: its colour, the mark, the words and the number, the stock's fibres, and the peel tab.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./wristband.js').Band} b The band.
 * @param {{ light: number, mark?: import('../render/scene.js').PlaceArt | null }} o Where the light is, and the mark.
 * @returns {string} The markup, in mm.
 */
export function tyvekPrint(sc, b, { light, mark = null }) {
	const { length: L, width: W, tab } = WRISTBAND.tyvek;
	const x0 = -L / 2;
	const y0 = -W / 2;
	const end = L / 2 - tab;
	const fibre = speckTile(sc, { size: 96, freq: [0.35, 0.5], octaves: 2, dark: 0.08, light: 0.12, cut: 0.55, type: 'turbulence', seed: 11 });
	const curl = sc.id('curl');
	sc.def(
		el(
			'linearGradient',
			{ id: curl, x1: 0, y1: 0, x2: 0, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': n(0.08 + 0.06 * Math.abs(light)) }),
			el('stop', { offset: 0.45, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.08 }),
		),
	);
	const tabColor = mix(b.color, '#ffffff', 0.78);
	const type = { fill: b.ink, 'font-family': FONT };
	return el(
		'g',
		{},
		el('rect', { x: x0, y: y0, width: L, height: W, fill: b.color }),
		el('rect', { x: end, y: y0, width: tab, height: W, fill: tabColor }),
		mark ? mark(x0 + 4, -W * 0.34, W * 0.68, W * 0.68) : '',
		b.text ? el('text', { ...type, x: n(x0 + W * 0.95), y: n(W * 0.16), 'font-size': n(Math.min(W * 0.46, (end - x0 - W * 1.15 - (b.number ? 40 : 8)) / (b.text.length * 0.66))), 'font-weight': 900 }, esc(b.text)) : '',
		b.number ? el('text', { ...type, x: n(end - 5), y: n(W * 0.12), 'text-anchor': 'end', 'font-size': n(W * 0.26), 'font-weight': 700 }, esc(b.number)) : '',
		el('path', { d: `M${n(end)} ${n(y0)}V${n(-y0)}`, stroke: mix(b.color, '#000000', 0.25), 'stroke-width': 0.5, 'stroke-dasharray': '1.2 1' }),
		el('text', { ...type, x: n(end + 4), y: n(W * 0.12), 'font-size': n(W * 0.22), 'font-weight': 700, fill: mix(b.color, '#000000', 0.35) }, 'PEEL'),
		el('rect', { x: x0, y: y0, width: L, height: W, fill: fibre }),
		el('rect', { x: x0, y: y0, width: L, height: W, fill: `url(#${curl})` }),
	);
}

/**
 * Bands lying where they're placed, with their shadows, in pixels.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The bands and the frame.
 * @param {import('./wristband.js').Band[]} o.bands The bands.
 * @param {{ x: number, y: number, angle: number }[]} o.placed Where each lies, in mm round the group's centre.
 * @param {(x: number, y: number) => [number, number]} o.at Where a point in mm is in the frame.
 * @param {number} o.mm Pixels per mm.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} o.shadow How dark the shadows are.
 * @param {import('../render/scene.js').PlaceArt | null} o.mark The mark, for sliders and Tyvek.
 * @param {string} o.seed The seed.
 * @returns {string} The markup, bottom band first.
 */
export function bandLayer(sc, { bands, placed, at, mm, light, shadow, mark, seed }) {
	const away = -light;
	return bands
		.map((b, i) => {
			const p = placed[i];
			const [cx, cy] = at(p.x, p.y);
			if (b.kind === 'tyvek') {
				const { length, width } = WRISTBAND.tyvek;
				return sheet(sc, {
					cx,
					cy,
					w: length * mm,
					h: width * mm,
					angle: p.angle,
					radius: 1.5 * mm,
					stock: { ...resolveStock('matte'), color: b.color },
					overlay: el('g', { transform: `scale(${n(mm)})` }, tyvekPrint(sc, b, { light, mark })),
					mm,
					light,
					thickness: 0.2 * mm,
					lift: 0.35,
					shadow,
					seed: i,
				});
			}
			const frame = (dx = 0, dy = 0) => `translate(${n(cx + dx * mm)} ${n(cy + dy * mm)}) rotate(${n(p.angle)}) scale(${n(mm)})`;
			const band = fabricBand(sc, b, { light, mark, seed: `${seed}:${i}` });
			const cast = (off, sigma, alpha) => (shadow > 0 ? el('g', { transform: frame(away * off * 0.6, off), opacity: n(Math.min(1, alpha * shadow)), filter: sc.blur(sigma) }, band.shadow) : '');
			return cast(0.5, 0.5, 0.4) + cast(1.8, 2, 0.22) + cast(4, 5, 0.1) + el('g', { transform: frame() }, band.body);
		})
		.join('');
}
