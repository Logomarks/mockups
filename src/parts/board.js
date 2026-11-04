/**
 * @module @arraypress/mockups/parts/board
 *
 * Faces of printed board for a box seen axonometrically: each face is a
 * polygon in the picture, filled with the board (its colour, or the kraft
 * photograph), its print mapped on with the face's own matrix, the board's
 * grain over both (ink sits in the fibres), shaded by how it turns to the
 * light, and darkening a little towards the table. A cut edge of
 * corrugated board shows its flutes: a wavy medium between two liners.
 */

import { el } from '../render/svg.js';
import { clamp, n } from '../util/num.js';
import { mix } from '../util/color.js';

/**
 * How a face is shaded: Lambert against a key light in front, above, and to the light's side.
 *
 * @param {[number, number, number]} normal The face's outward normal (x right, y up, z to the camera).
 * @param {number} light Where the light is, left (-1) to right (1).
 * @returns {number} How much darker than fully lit, 0–0.55.
 */
export function faceShade(normal, light) {
	const L = [clamp(light, -1, 1) * 0.7, 0.85, 0.55];
	const len = Math.hypot(...L);
	const lit = clamp((normal[0] * L[0] + normal[1] * L[1] + normal[2] * L[2]) / len, 0, 1);
	return clamp(0.55 * (0.95 - lit), 0, 0.55);
}

/** Each document's ink filter, by its prefix. */
const inks = new WeakMap();

/**
 * Ink on board: a little less saturated than on paper, its edges just soft.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @returns {string} The filter (`url(#…)`).
 */
function inkFilter(sc) {
	let f = inks.get(sc);
	if (!f) {
		f = sc.id('ink');
		inks.set(sc, f);
		sc.def(el('filter', { id: f, 'color-interpolation-filters': 'sRGB' }, el('feColorMatrix', { type: 'saturate', values: 0.88 }), el('feGaussianBlur', { stdDeviation: 0.3 })));
	}
	return `url(#${f})`;
}

/**
 * One face of board.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./board.js').BoardFace} o The face.
 * @returns {string} The markup.
 */
export function boardFace(sc, { d, color, shade, shadeColor = '#000', base = null, texture = null, print = '', over = '', fall = null }) {
	const c = sc.id('bface');
	sc.def(el('clipPath', { id: c }, el('path', { d })));
	return el(
		'g',
		{ 'clip-path': `url(#${c})` },
		el('path', { d, fill: color }),
		base ? el('path', { d, fill: base }) : '',
		print ? el('g', { filter: inkFilter(sc) }, print) : '',
		texture ? el('path', { d, fill: texture }) : '',
		over,
		shade > 0 ? el('path', { d, fill: shadeColor, opacity: shade }) : '',
		fall ? el('path', { d, fill: fall }) : '',
	);
}

/**
 * The cut edge of corrugated board, as a strip in its own frame (along it 0–`length`, across it 0–`thickness`, the outer liner at 0): two liners and the fluted medium between, its hollows in shadow and its crests catching the light.
 *
 * @param {{ length: number, thickness: number, color: string, inner?: string, medium?: string, flute?: number }} o The strip's length and thickness (in the frame's units), the outer liner's colour, the inner liner's (the outer's), the medium's (a kraft), and the flutes' pitch (in thicknesses, 2.1: B-flute is about 3 mm thick with a flute every 6.5 mm).
 * @returns {string} The markup, in the strip's frame.
 */
export function flutes({ length, thickness: t, color, inner = color, medium = mix('#b8905f', color, 0.2), flute = 2.1 }) {
	const pitch = t * flute;
	const liner = t * 0.12;
	// the medium: a wave from liner to liner
	let d = `M0 ${n(t - liner)}`;
	for (let x = 0; x < length; x += pitch) d += `Q${n(x + pitch / 4)} ${n(liner * 0.2)} ${n(x + pitch / 2)} ${n(t / 2)}T${n(x + pitch)} ${n(t - liner)}`;
	return (
		el('rect', { width: length, height: t, fill: mix(medium, '#000000', 0.62) }) +
		el('path', { d, fill: 'none', stroke: medium, 'stroke-width': t * 0.11 }) +
		el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': t * 0.04, 'stroke-opacity': 0.25, transform: `translate(0 ${n(-t * 0.03)})` }) +
		el('rect', { width: length, height: liner, fill: color }) +
		el('rect', { y: t - liner, width: length, height: liner, fill: inner }) +
		el('rect', { width: length, height: liner * 0.5, fill: '#fff', opacity: 0.22 })
	);
}
