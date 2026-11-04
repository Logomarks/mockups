/**
 * @module @arraypress/mockups/parts/cylinder
 *
 * A print wrapped round an upright cylinder (a mug, a bottle) seen from a
 * little above. The print is drawn flat, unrolled, once; the visible half
 * of the cylinder is cut into thin vertical strips, each showing its slice
 * of the print squeezed by the cosine of its angle and dropped by the sag
 * of the ellipse at that angle, so straight lines bend round the curve and
 * the print foreshortens towards the edges. Strips overlap a pixel so no
 * seams show. The light on the cylinder (Lambert shading across it) and
 * its glossy window reflections are here too.
 */

import { el } from '../render/svg.js';
import { greyPng } from '../util/field.js';
import { clamp, n } from '../util/num.js';

/**
 * A flat print wrapped round the front of a cylinder.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./cylinder.js').WrapPart} o The cylinder and the print.
 * @returns {string} The strips.
 */
export function wrap(sc, { cx, top, r, ry, content, turn = 0, strips = 72, height }) {
	const t0 = (turn * Math.PI) / 180;
	const k = Math.max(8, Math.round(strips));
	let out = '';
	for (let i = 0; i < k; i++) {
		// strips even in angle, so they're thin where the print is squeezed
		const a = -Math.PI / 2 + (i * Math.PI) / k;
		const b = -Math.PI / 2 + ((i + 1) * Math.PI) / k;
		const xa = cx + r * Math.sin(a);
		const xb = cx + r * Math.sin(b);
		const s = (xb - xa) / (r * (b - a));
		const ua = r * (a - t0);
		// the sag runs linearly across the strip (a skew), so edges bend smoothly instead of stepping
		const sa = ry * Math.cos(a);
		const slope = (ry * Math.cos(b) - sa) / Math.max(1e-6, xb - xa);
		const clip = sc.id('strip');
		sc.def(el('clipPath', { id: clip }, el('rect', { x: xa - 0.6, y: top - ry * 1.2, width: xb - xa + 1.2, height: height + ry * 2.6 })));
		const m = [s, slope * s, 0, 1, xa - s * ua, top + sa - slope * s * ua].map(n).join(' ');
		out += el('g', { 'clip-path': `url(#${clip})` }, el('use', { href: `#${content}`, transform: `matrix(${m})` }));
	}
	return out;
}

/**
 * A filter that bends flat art round the front of a cylinder in one pass (a displacement map drawn in JS), for art too costly to draw once per strip (a sticker cut by a filter of its own). Draw the art flat, centred on the axis, and apply this to it.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {{ cx: number, r: number, ry: number, top: number, height: number, turn?: number }} o The cylinder's axis and radius, its ellipse's half-depth, and the band the art occupies (its top and height, flat).
 * @returns {string} `url(#…)`.
 */
export function bend(sc, { cx, r, ry, top, height, turn = 0 }) {
	const t0 = (turn * Math.PI) / 180;
	const N = 512;
	// the map reaches a little past the cylinder and the band, so its own soft edges never fall inside them
	const m = 6;
	const at = (i) => (((i + 0.5) / N) * (2 * r + 2 * m) - m - r) / r;
	const dx = (i) => {
		const t = clamp(at(i), -0.9999, 0.9999);
		return r * (Math.asin(t) - t0) - r * t;
	};
	const sag = (i) => -ry * Math.sqrt(Math.max(0, 1 - clamp(at(i), -1, 1) ** 2));
	let max = ry + 1;
	for (let i = 0; i < N; i++) max = Math.max(max, Math.abs(dx(i)));
	const scale = 2 * max + 2;
	// two opaque grey maps (librsvg reads a map's colour premultiplied, so alpha must stay 1), put into red and green inside the filter
	const mapX = greyPng(N, 2, (i) => [0.5 + dx(i) / scale, 1]);
	const mapY = greyPng(N, 2, (i) => [0.5 + sag(i) / scale, 1]);
	const f = sc.id('bend');
	const y0 = top - ry - 4;
	const h = height + 2 * ry + 16;
	const box = { x: cx - r - m, y: y0 - m, width: 2 * r + 2 * m, height: h + 2 * m, preserveAspectRatio: 'none' };
	sc.def(
		el(
			'filter',
			{ id: f, filterUnits: 'userSpaceOnUse', x: cx - r, y: y0, width: 2 * r, height: h, 'color-interpolation-filters': 'sRGB' },
			el('feImage', { href: mapX, ...box, result: 'mx' }),
			el('feImage', { href: mapY, ...box, result: 'my' }),
			el('feColorMatrix', { in: 'mx', type: 'matrix', values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1', result: 'rx' }),
			el('feColorMatrix', { in: 'my', type: 'matrix', values: '0 0 0 0 0  1 0 0 0 0  0 0 0 0 0  0 0 0 0 1', result: 'gy' }),
			el('feComposite', { in: 'rx', in2: 'gy', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'map' }),
			el('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale, xChannelSelector: 'R', yChannelSelector: 'G', result: 'bent' }),
			// librsvg smears the region's last rows: keep only the band itself
			el('feFlood', { 'flood-color': '#000', x: cx - r, y: y0, width: 2 * r, height: h - 8, result: 'keep' }),
			el('feComposite', { in: 'bent', in2: 'keep', operator: 'in' }),
		),
	);
	return `url(#${f})`;
}

/**
 * The light across a cylinder, as a horizontal gradient: shadow turning away from the light, a soft lit band facing it.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {{ cx: number, r: number, light: number, dark?: number, bright?: number }} o Its axis and radius, where the light is, and how dark and bright the shading goes (0.5, 0.12).
 * @returns {string} A `url(#…)` for a fill over the cylinder.
 */
export function cylinderShade(sc, { cx, r, light, dark = 0.5, bright = 0.12 }) {
	const g = sc.id('cyl');
	const lx = clamp(light, -1, 1) * 0.62;
	const lz = Math.sqrt(1 - lx * lx);
	const stops = [];
	for (let i = 0; i <= 28; i++) {
		const t = i / 28;
		const s = 2 * t - 1;
		const c = Math.sqrt(Math.max(0, 1 - s * s));
		const I = s * lx + c * lz; // 1 facing the light, 0 side on
		const shade = I < 0.86 ? ['#000', dark * ((0.86 - Math.max(-0.2, I)) / 1.06) ** 1.15] : ['#fff', bright * ((I - 0.86) / 0.14)];
		stops.push(el('stop', { offset: t, 'stop-color': shade[0], 'stop-opacity': clamp(shade[1]) }));
	}
	sc.def(el('linearGradient', { id: g, gradientUnits: 'userSpaceOnUse', x1: cx - r, y1: 0, x2: cx + r, y2: 0 }, ...stops));
	return `url(#${g})`;
}

/**
 * Glossy reflections of a window on a cylinder: a tall soft streak where the light is mirrored, a fainter one from the far side, and a fine bright line at the lit edge.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {{ cx: number, r: number, top: number, bottom: number, light: number, gloss?: number }} o Its axis, radius, the streaks' top and bottom, where the light is, and how glossy (1).
 * @returns {string} The streaks (clip them to the cylinder).
 */
export function reflections(sc, { cx, r, top, bottom, light, gloss = 1 }) {
	if (gloss <= 0) return '';
	const lx = clamp(light, -1, 1);
	const fade = sc.id('fade');
	sc.def(
		el(
			'linearGradient',
			{ id: fade, x1: 0, y1: 0, x2: 0, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.35 }),
			el('stop', { offset: 0.18, 'stop-color': '#fff', 'stop-opacity': 1 }),
			el('stop', { offset: 0.8, 'stop-color': '#fff', 'stop-opacity': 0.85 }),
			el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0.2 }),
		),
	);
	const h = bottom - top;
	// the mirror angle is half the light's, so the main streak sits between the axis and the light's side
	const streak = (x, w, alpha, sigma) => el('rect', { x: x - w / 2, y: top, width: w, height: h, rx: w / 2, fill: `url(#${fade})`, opacity: clamp(alpha * gloss), filter: sc.blur(sigma) });
	return (
		streak(cx + r * Math.sin(lx * 0.55 - 0.18), r * 0.13, 0.55, r * 0.03) +
		streak(cx + r * Math.sin(lx * 0.55 - 0.18) + r * 0.13, r * 0.035, 0.45, r * 0.008) +
		streak(cx - r * Math.sin(lx * 0.4 + 0.55) * 1.0, r * 0.07, 0.16, r * 0.04) +
		streak(cx + r * (lx >= 0 ? 0.955 : -0.955), r * 0.025, 0.3, r * 0.006)
	);
}
