/**
 * @module @arraypress/mockups/materials/surface
 *
 * The light on a record's face, over its body: the tracks (even bands of
 * groove, each a shade lighter or darker than the next, parted by crisp
 * glossy gaps, with a few faint rings inside), the soft specular sweep the
 * grooves throw back towards the light (two opposed wedges, blurred,
 * showing on the grooves ring by ring and not in the gaps), the shading
 * across the disc, and the rim (a bright bevel, a lip lit on the light's
 * side and dark away from it, the lead-in). Clear vinyl also bends the
 * ground just past its edge, so it gets a faint bright halo there. Radii
 * are fractions of the record's.
 */

import { el, circlePath, wedgePath } from '../render/svg.js';
import { rng } from '../util/rng.js';
import { clamp, n } from '../util/num.js';

/** Where things are on a record's face, as fractions of its radius (a 12" LP: label 100 mm, lead-in at 146 of 150). */
export const RADII = Object.freeze({ label: 0.333, hole: 0.024, leadIn: 0.958, bevel: 0.982 });


/**
 * The stops of the tracks' gradient, as a pressed record has them: a glossy run-out by the label, then a few tracks,
 * each an even band of groove a shade lighter or darker than the next, parted by a crisp glossy gap with a dark
 * wall either side; a couple of faint rings inside each track; and the smooth lead-in with its rings by the rim.
 *
 * @param {string} seed The seed.
 * @param {boolean} dark Whether the record reads dark (grooves drawn in light, not shadow).
 * @param {number} [depth=1] How strongly the grooves show.
 * @param {number} [px=400] The record's radius in pixels: the gaps and rings are at least a pixel wide.
 * @returns {[number, string, number][]} Offsets (0–1 of the radius), colours and opacities.
 */
export function trackStops(seed, dark, depth = 1, px = 400) {
	const r = rng(`${seed}:tracks`);
	const line = Math.min(0.004, Math.max(0.0022, 0.9 / px));
	const ink = dark ? '#ffffff' : '#000000';
	const shine = '#ffffff';
	const groove = (dark ? 0.03 : 0.022) * depth;
	const gloss = (dark ? 0.05 : 0.06) * depth;
	const inner = r.range(0.37, 0.42);
	const count = 5 + Math.floor(r.next() * 4);
	/** @type {[number, string, number][]} */
	const stops = [
		[RADII.label + 0.004, shine, 0],
		[RADII.label + 0.012, shine, gloss * 0.9],
		[inner - 0.012, shine, gloss * 0.7],
		[inner - 2 * line, shine, gloss * 1.4],
	];
	// track edges: no track thinner than a fifth of the average
	const span = RADII.leadIn - 0.03 - inner;
	const weights = Array.from({ length: count }, () => 0.45 + r.next());
	const total = weights.reduce((a, b) => a + b, 0);
	let at = inner;
	for (let i = 0; i < count; i++) {
		const a = at;
		const b = (at += (weights[i] / total) * span);
		// the band: one level (alternating lighter and darker, a little seeded), with faint rings inside
		const level = groove * (i % 2 ? r.range(1.05, 1.5) : r.range(0.55, 0.9));
		const first = a + line;
		stops.push([first, ink, level * 0.6], [first + line, ink, level]);
		const rings = Math.floor(r.next() * 3);
		const cuts = Array.from({ length: rings }, () => r.range(a + 0.008, b - 0.008)).sort((x, y) => x - y);
		let last = first + line;
		for (const c of cuts) {
			if (c - line <= last + 0.001 || c + line >= b - 2 * line) continue;
			stops.push([c - line, ink, level], [c, ink, level * r.range(1.25, 1.6)], [c + line, ink, level]);
			last = c + line;
		}
		stops.push([b - 2 * line, ink, level * 1.15]);
		// the gap: a crisp glossy ring (none after the last track: the lead-in follows)
		if (i < count - 1) stops.push([b - line * 0.5, shine, gloss * 1.4], [b + line * 0.5, shine, gloss * 1.4]);
	}
	// the lead-in: smooth and glossy, with two fine rings, then the bevel
	const lead = RADII.leadIn - 0.03;
	stops.push(
		[lead + line, shine, gloss * 0.8],
		[lead + 0.012, shine, gloss * 0.6],
		[lead + 0.012 + line, ink, groove * 1.6],
		[lead + 0.012 + 2 * line, shine, gloss * 0.6],
		[RADII.leadIn - line, shine, gloss * 0.6],
		[RADII.leadIn, ink, groove * 1.8],
		[RADII.leadIn + line, shine, gloss * 0.7],
		[RADII.bevel - 0.012, shine, gloss * 0.5],
		[1, shine, 0],
	);
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
	const ids = { tracks: sc.id('tracks'), rings: sc.id('rings'), ringFill: sc.id('ringfill'), shade: sc.id('shade'), bevel: sc.id('bevel'), annulus: sc.id('annulus'), edge: sc.id('edge') };
	const clear = m.opacity < 0.98;
	const lx = clamp(light, -1, 1);
	const stop = (offset, color, opacity) => el('stop', { offset: clamp(offset), 'stop-color': color, 'stop-opacity': opacity });

	const tracks = trackStops(seed, dark, clear ? 1 : 1.3, r);
	sc.def(el('radialGradient', { id: ids.tracks, gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r }, ...tracks.map(([o, c, a]) => stop(o, c, a))));
	// where the sweep shows: on the grooves, ring by ring (a deeper track throws back more), not in the glossy gaps
	const grooved = dark ? '#ffffff' : '#000000';
	const peak = Math.max(...tracks.map(([, c, a]) => (c === grooved ? a : 0)));
	sc.def(
		el(
			'mask',
			{ id: ids.rings, maskUnits: 'userSpaceOnUse', x: -r, y: -r, width: 2 * r, height: 2 * r },
			el(
				'radialGradient',
				{ id: ids.ringFill, gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r },
				...tracks.map(([o, c, a]) => stop(o, '#ffffff', c === grooved ? 0.45 + 0.55 * (a / peak) : 0.18)),
			),
			el('circle', { r, fill: `url(#${ids.ringFill})` }),
		),
	);
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
	// the outer edge: a rounded lip, bright where it faces the light (the far edge of a record peeking that way), a dark line away from it
	sc.def(
		el(
			'linearGradient',
			{ id: ids.edge, x1: 0.5 + 0.5 * lx, y1: 0.15, x2: 0.5 - 0.5 * lx, y2: 0.85 },
			stop(0, '#ffffff', dark ? 0.16 : clear ? 0.75 : 0.35),
			stop(0.45, '#ffffff', dark ? 0.04 : clear ? 0.2 : 0.06),
			stop(0.6, '#000000', dark ? 0 : 0.03),
			stop(1, '#000000', dark ? 0.1 : clear ? 0.12 : 0.22),
		),
	);
	sc.def(el('clipPath', { id: ids.annulus }, el('path', { d: circlePath(0, 0, RADII.leadIn * r) + circlePath(0, 0, RADII.label * r), 'clip-rule': 'evenodd' })));

	// the specular sweep: grooves throw light back along the line to the light, both ways
	const axis = -60 + 40 * lx;
	const wedge = (deg, half) => wedgePath(r * 1.1, axis + deg, half);
	// the sweep, blurred so it fades smoothly to its sides
	const sweep = (half, alpha) =>
		el('path', { d: wedge(0, half) + wedge(180, half * 0.8), fill: '#ffffff', 'fill-opacity': alpha * m.sheen * (clear || dark ? 1 : 1.7), filter: sc.blur(r * half * 0.004) });
	const ring = (radius, color, alpha, width, filter = '') => el('circle', { r: radius * r, fill: 'none', stroke: color, 'stroke-opacity': alpha, 'stroke-width': width * r, filter });

	const face =
		el('circle', { r, fill: `url(#${ids.tracks})` }) +
		el('g', { 'clip-path': `url(#${ids.annulus})` }, el('g', { mask: `url(#${ids.rings})` }, sweep(36, dark ? 0.26 : 0.85), sweep(10, dark ? 0.22 : 0.45))) +
		el('circle', { r, fill: `url(#${ids.shade})` }) +
		ring(RADII.leadIn, dark ? '#fff' : '#000', dark ? 0.08 : clear ? 0.03 : 0.05, 0.003) +
		ring(RADII.bevel, `url(#${ids.bevel})`, 1, 0.028) +
		ring(0.9965, `url(#${ids.edge})`, 1, 0.007) +
		ring(RADII.label, '#000', 0.16, 0.005);
	const halo = clear ? ring(1.004, '#ffffff', dark ? 0.1 : 0.3, 0.006, sc.blur(r * 0.003)) : '';
	return { face, halo };
}
