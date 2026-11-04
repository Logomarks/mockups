/**
 * @module @arraypress/mockups/materials/surface
 *
 * The light on a record's face, over its body: the tracks (bands of groove
 * with glossy gaps between, every few thousandths of the radius a little
 * lighter or darker, which reads as fine grooves without the moiré a
 * repeating pattern gives), the soft specular sweep that grooves throw back
 * towards the light (two opposed fans of nested wedges), the shading across the
 * disc, and the rim (a bright bevel, a dark outer edge, the lead-in). Clear
 * vinyl also bends the ground just past its edge, so it gets a faint bright
 * halo there. Radii are fractions of the record's.
 */

import { el, circlePath } from '../render/svg.js';
import { rng } from '../util/rng.js';
import { clamp, n } from '../util/num.js';

/** Where things are on a record's face, as fractions of its radius (a 12" LP: label 100 mm, lead-in at 146 of 150). */
export const RADII = Object.freeze({ label: 0.333, hole: 0.024, leadIn: 0.958, bevel: 0.982 });


/**
 * The stops of the tracks' gradient: a glossy run-out, grooved tracks of varying density with glossy gaps, a smooth lead-in.
 *
 * @param {string} seed The seed.
 * @param {boolean} dark Whether the record reads dark (grooves drawn in light, not shadow).
 * @param {number} [depth=1] How strongly the grooves show.
 * @param {number} [px=400] The record's radius in pixels: the grooves vary every couple of pixels (finer averages away; a repeating pattern would shimmer).
 * @returns {[number, string, number][]} Offsets (0–1 of the radius), colours and opacities.
 */
export function trackStops(seed, dark, depth = 1, px = 400) {
	const step = Math.max(0.004, 2.2 / px);
	const r = rng(`${seed}:tracks`);
	const ink = dark ? '#ffffff' : '#000000';
	const shine = '#ffffff';
	const groove = (dark ? 0.035 : 0.021) * depth;
	const gloss = (dark ? 0.05 : 0.055) * depth;
	const inner = r.range(0.4, 0.5);
	const count = 3 + Math.floor(r.next() * 4);
	/** @type {[number, string, number][]} */
	const stops = [
		[RADII.label + 0.004, shine, 0],
		[RADII.label + 0.014, shine, gloss],
		[inner - 0.008, shine, gloss * 0.8],
	];
	const cuts = Array.from({ length: count - 1 }, () => r.range(inner + 0.05, RADII.leadIn - 0.05)).sort((a, b) => a - b);
	const edges = [inner, ...cuts, RADII.leadIn - 0.004];
	for (let i = 0; i < edges.length - 1; i++) {
		const a = edges[i];
		const b = edges[i + 1];
		const level = groove * r.range(0.3, 1.7);
		for (let t = a + 0.003; t < b - 0.003; t += step * r.range(0.6, 1.4)) stops.push([t, ink, level * r.range(0.45, 1.55)]);
		if (i < edges.length - 2) stops.push([b - 0.0016, shine, gloss * 1.6], [b + 0.0016, shine, gloss * 1.6]);
	}
	stops.push([RADII.leadIn, shine, gloss * 0.7], [RADII.bevel - 0.012, shine, gloss * 0.5], [1, shine, 0]);
	return stops;
}

/**
 * The light on a record's face, centred on the origin.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o What's lit.
 * @param {number} o.r The record's radius.
 * @param {import('./vinyl.js').Material} o.material Its material.
 * @param {boolean} o.dark Whether it reads dark on its ground.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {string} o.seed The seed.
 * @returns {{ face: string, halo: string }} The layers on the disc (clipped to it), and the halo just outside it (clear and tinted vinyl only).
 */
export function surface(sc, { r, material: m, dark, light, seed }) {
	const ids = { tracks: sc.id('tracks'), shade: sc.id('shade'), bevel: sc.id('bevel'), annulus: sc.id('annulus') };
	const clear = m.opacity < 0.98;
	const lx = clamp(light, -1, 1);
	const stop = (offset, color, opacity) => el('stop', { offset: clamp(offset), 'stop-color': color, 'stop-opacity': opacity });

	sc.def(el('radialGradient', { id: ids.tracks, gradientUnits: 'userSpaceOnUse', r }, ...trackStops(seed, dark, clear ? 1 : 1.3, r).map(([o, c, a]) => stop(o, c, a))));
	// shading across the disc: lit on the light's side, a little darker away from it
	sc.def(
		el(
			'linearGradient',
			{ id: ids.shade, x1: 0.5 + 0.3 * lx, y1: 0, x2: 0.5 - 0.3 * lx, y2: 1 },
			stop(0, '#ffffff', dark ? 0.05 : 0.07),
			stop(0.45, '#ffffff', 0),
			stop(1, '#000000', clear ? 0.05 : 0.13),
		),
	);
	// the bevel catches the light on its side, and a little at the far side
	sc.def(
		el(
			'linearGradient',
			{ id: ids.bevel, x1: 0.5 + 0.5 * lx, y1: 0, x2: 0.5 - 0.5 * lx, y2: 1 },
			stop(0, '#ffffff', dark ? 0.22 : 0.34),
			stop(0.55, '#ffffff', dark ? 0.06 : 0.12),
			stop(1, '#ffffff', dark ? 0.12 : 0.24),
		),
	);
	sc.def(el('clipPath', { id: ids.annulus }, el('path', { d: circlePath(0, 0, RADII.leadIn * r) + circlePath(0, 0, RADII.label * r), 'clip-rule': 'evenodd' })));

	// the specular sweep: grooves throw light back along the line to the light, both ways
	const axis = -82 + 40 * lx;
	const wedge = (deg, half) => {
		const a = ((axis + deg) * Math.PI) / 180;
		const h = (half * Math.PI) / 180;
		const R = r * 1.1;
		const p = (t) => `${n(Math.cos(t) * R)} ${n(Math.sin(t) * R)}`;
		return `M0 0L${p(a - h)}A${n(R)} ${n(R)} 0 0 1 ${p(a + h)}Z`;
	};
	// nested wedges, each a little light, so the sweep fades smoothly to its sides (cheaper than a blur, and no seams)
	const sweep = (half, alpha, steps = 14) => {
		let out = '';
		for (let i = 1; i <= steps; i++) out += el('path', { d: wedge(0, (half * i) / steps) + wedge(180, (half * i * 0.8) / steps) });
		return el('g', { fill: '#ffffff', 'fill-opacity': (alpha * m.sheen * (clear || dark ? 1 : 1.7)) / steps }, out);
	};
	const ring = (radius, color, alpha, width, filter = '') => el('circle', { r: radius * r, fill: 'none', stroke: color, 'stroke-opacity': alpha, 'stroke-width': width * r, filter });

	const face =
		el('circle', { r, fill: `url(#${ids.tracks})` }) +
		el('g', { 'clip-path': `url(#${ids.annulus})` }, sweep(34, dark ? 0.16 : 0.15), sweep(10, dark ? 0.2 : 0.12)) +
		el('circle', { r, fill: `url(#${ids.shade})` }) +
		ring(RADII.leadIn, dark ? '#fff' : '#000', dark ? 0.08 : 0.05, 0.003) +
		ring(RADII.bevel, `url(#${ids.bevel})`, 1, 0.028) +
		ring(0.9965, dark ? '#fff' : '#000', dark ? 0.1 : clear ? 0.055 : 0.18, 0.007) +
		ring(RADII.label, '#000', 0.16, 0.005);
	const halo = clear ? ring(1.004, '#ffffff', dark ? 0.1 : 0.3, 0.006, sc.blur(r * 0.003)) : '';
	return { face, halo };
}
