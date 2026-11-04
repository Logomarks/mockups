/**
 * @module @arraypress/mockups/parts/poster/pole
 *
 * Flyers stapled round a wooden street pole: the pole a weathered cylinder
 * (grain running up it, darker towards its edges, a soft highlight on the
 * light's side, rusty old staples), and the flyers wrapped round it, the
 * newest on top and older ones under and around it, faded and torn. Each
 * flyer is drawn flat once and wrapped in narrow strips, each squeezed as
 * the curve turns away (x = r sin(s / r)), so its sides pinch in towards
 * the pole's edges; the pole's shading then falls over paper and wood.
 */

import { el } from '../../render/svg.js';
import { rng, hash } from '../../util/rng.js';
import { clamp, n } from '../../util/num.js';
import { tornSheet } from './torn.js';
import { encodePng } from '../../render/png.js';
import { base64 } from '../../render/art.js';

/** The pole's diameter, mm (a timber utility pole). */
export const POLE = 240;

/** How finely the wrap's map is sampled across the pole. */
const MAP = 512;

/**
 * Where the flyers go, back to front, in mm about the pole's front line: across it (`s`, along the curve), down it, how faded and how torn.
 *
 * @param {number} count How many flyers.
 * @param {number} w A flyer's width (mm).
 * @param {number} h A flyer's height (mm).
 * @param {string} seed The seed.
 * @returns {{ s: number, y: number, fade: number, wear: number, staples: number }[]} The flyers, the newest last.
 */
export function flyerLayout(count, w, h, seed) {
	const r = rng(`${seed}:flyers`);
	const out = [];
	for (let i = 1; i < count; i++) {
		const up = i % 2 ? -1 : 1;
		out.push({ s: r.range(-0.35, 0.35) * w, y: up * h * r.range(0.55, 0.8), fade: r.range(0.25, 0.5), wear: r.range(1.2, 2.2), staples: 2 + Math.floor(r.next() * 3) });
	}
	out.push({ s: r.range(-0.04, 0.04) * w, y: 0, fade: 0, wear: 0.35, staples: 4 });
	return out;
}

/**
 * A pole with flyers on it.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The pole.
 * @param {number} o.cx The pole's centre line, x (px).
 * @param {number} o.cy Where the newest flyer's centre is, y (px).
 * @param {number} o.top The frame's top (px).
 * @param {number} o.bottom The frame's bottom (px).
 * @param {number} o.w A flyer's width (px).
 * @param {number} o.h A flyer's height (px).
 * @param {number} o.mm Pixels per millimetre.
 * @param {import('../../render/scene.js').PlaceArt} o.art The flyer, placed in its box.
 * @param {number} o.count How many flyers.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {string} o.seed The seed.
 * @returns {string} The markup.
 */
export function pole(sc, { cx, cy, top, bottom, w, h, mm, art, count, light, seed }) {
	const R = (POLE / 2) * mm;
	const lx = clamp(light, -1, 1);
	const r = rng(`${seed}:pole`);
	const ids = { wood: sc.id('timber'), shade: sc.id('round'), grain: sc.id('pgrain') };
	sc.def(
		el(
			'filter',
			{ id: ids.grain, x: 0, y: 0, width: '100%', height: '100%', filterUnits: 'objectBoundingBox' },
			el('feTurbulence', { type: 'fractalNoise', baseFrequency: `${n(0.18 / mm)} ${n(0.004 / mm)}`, numOctaves: 4, seed: hash(seed) % 997 }),
			el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.12  0 0 0 0 0.08  0 0 0 0 0.05  1.6 0 0 0 -0.62' }),
		),
	);
	// the round: dark at both edges, a soft highlight towards the light
	sc.def(
		el(
			'linearGradient',
			{ id: ids.shade, x1: 0, y1: 0, x2: 1, y2: 0 },
			el('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.62 }),
			el('stop', { offset: 0.12, 'stop-color': '#000', 'stop-opacity': 0.32 }),
			el('stop', { offset: clamp(0.5 + 0.22 * lx, 0.2, 0.8), 'stop-color': '#fff', 'stop-opacity': 0.12 }),
			el('stop', { offset: 0.88, 'stop-color': '#000', 'stop-opacity': 0.3 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.6 }),
		),
	);
	const body = el('rect', { x: cx - R, y: top, width: 2 * R, height: bottom - top, fill: '#6f5847' }) + el('rect', { x: cx - R, y: top, width: 2 * R, height: bottom - top, filter: `url(#${ids.grain})` });
	// old staples all over it, rust bleeding from some
	let staples = '';
	for (let i = 0; i < 70; i++) {
		const s = r.range(-1.4, 1.4) * R;
		if (Math.abs(s) > R * 1.45) continue;
		staples += staple(cx + R * Math.sin(s / R), r.range(top, bottom), mm, r.range(-25, 25) + (r.next() < 0.5 ? 90 : 0), r.next() < 0.4);
	}
	// the flyers, flat, then wrapped
	const flyers = flyerLayout(count, w / mm, h / mm, seed);
	const defs = flyers.map((f, i) => {
		const id = sc.id('flyer');
		const edge = tornSheet(w, h, mm, `${seed}:${i}`, f.wear);
		const clip = sc.id('fclip');
		sc.def(el('clipPath', { id: clip }, el('path', { d: edge.print })));
		const fr = rng(`${seed}:staples:${i}`);
		let pins = '';
		for (let k = 0; k < f.staples; k++) pins += staple((k % 2 ? 1 : -1) * (w / 2 - fr.range(6, 14) * mm), (k < 2 ? -1 : 1) * (h / 2 - fr.range(6, 14) * mm), mm, fr.range(-20, 20), false);
		sc.def(
			el(
				'g',
				{ id },
				el('path', { d: edge.paper, fill: '#f3efe6' }),
				el('g', { 'clip-path': `url(#${clip})` }, art(-w / 2, -h / 2, w, h), f.fade ? el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: '#efe8d8', opacity: f.fade }) : ''),
				el('path', { d: edge.paper, fill: 'none', stroke: '#000', 'stroke-opacity': 0.12, 'stroke-width': 0.3 * mm }),
				pins,
			),
		);
		return { id, f };
	});
	// the flat flyers, laid out along the curve, then wrapped: each point of the pole's face shows the paper at s = r asin(x / r)
	const flat = defs.map(({ id, f }) => el('use', { href: `#${id}`, transform: `translate(${n(cx + f.s * mm)} ${n(cy + f.y * mm)})` })).join('');
	const S = (Math.PI / 2) * R;
	const face = sc.id('face');
	sc.def(el('clipPath', { id: face }, el('rect', { x: cx - R, y: top, width: 2 * R, height: bottom - top })));
	const wrap = el('g', { 'clip-path': `url(#${face})` }, el('g', { filter: wrapFilter(sc, { cx, R, top, bottom }) }, flat));
	// the flyers stand off the wood a hair: a soft shadow round each on the pole, falling away from the light
	const shadows = flyers
		.map((f) => {
			const a = Math.max(-S, f.s * mm - w / 2);
			const b = Math.min(S, f.s * mm + w / 2);
			const xa = cx + R * Math.sin(a / R);
			const xb = cx + R * Math.sin(b / R);
			return el('rect', { x: xa - lx * mm, y: cy + f.y * mm - h / 2 + 1.5 * mm, width: xb - xa, height: h, fill: '#000' });
		})
		.join('');
	const shade = el('rect', { x: cx - R, y: top, width: 2 * R, height: bottom - top, fill: `url(#${ids.shade})` });
	return el('g', {}, body, staples, el('g', { filter: sc.blur(1.6 * mm), opacity: 0.3 }, shadows), wrap, shade);
}

/**
 * The wrap, as a filter: a displacement whose map (a one-pixel-high strip of grey across the pole) moves each point of its face
 * to where the flat paper under it is, r asin(x / r) along the curve.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {{ cx: number, R: number, top: number, bottom: number }} o The pole's centre line and radius, and how far it runs (px).
 * @returns {string} The filter's `url(#…)`.
 */
function wrapFilter(sc, { cx, R, top, bottom }) {
	const scale = 1.2 * R;
	const px = new Uint8Array(MAP * 2);
	for (let i = 0; i < MAP; i++) {
		const u = ((i + 0.5) / MAP) * 2 - 1;
		px[i * 2] = Math.round(clamp(0.5 + (Math.asin(u) - u) / 1.2) * 255);
		px[i * 2 + 1] = 255;
	}
	const href = `data:image/png;base64,${base64(encodePng(MAP, 1, px))}`;
	const f = sc.id('wrap');
	const h = bottom - top;
	sc.def(
		el(
			'filter',
			{ id: f, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', x: cx - 1.7 * R, y: top, width: 3.4 * R, height: h, 'color-interpolation-filters': 'sRGB' },
			el('feImage', { href, x: cx - R, y: top, width: 2 * R, height: h, preserveAspectRatio: 'none', result: 'map' }),
			// across from the map's grey; nothing up or down
			el('feColorMatrix', { in: 'map', type: 'matrix', values: '1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1', result: 'xy' }),
			el('feDisplacementMap', { in: 'SourceGraphic', in2: 'xy', scale, xChannelSelector: 'R', yChannelSelector: 'G' }),
		),
	);
	return `url(#${f})`;
}

/**
 * A staple: a short bar of wire, its legs' ends showing as dots.
 *
 * @param {number} x Its centre, x.
 * @param {number} y Its centre, y.
 * @param {number} mm Pixels per millimetre.
 * @param {number} angle Its turn, degrees.
 * @param {boolean} rusty Whether it's old.
 * @returns {string} The markup.
 */
function staple(x, y, mm, angle, rusty) {
	const l = 5.5 * mm;
	const color = rusty ? '#7a5236' : '#c9ccd0';
	return el(
		'g',
		{ transform: `translate(${n(x)} ${n(y)}) rotate(${n(angle)})` },
		el('line', { x1: -l, y1: 0.35 * mm, x2: l, y2: 0.35 * mm, stroke: '#000', 'stroke-opacity': 0.35, 'stroke-width': 0.8 * mm }),
		el('line', { x1: -l, y1: 0, x2: l, y2: 0, stroke: color, 'stroke-width': 0.6 * mm, 'stroke-linecap': 'round' }),
		el('line', { x1: -l, y1: -0.15 * mm, x2: l, y2: -0.15 * mm, stroke: '#fff', 'stroke-opacity': rusty ? 0.15 : 0.6, 'stroke-width': 0.2 * mm }),
	);
}
