/**
 * @module @arraypress/mockups/parts/board
 *
 * Faces of printed board for a box seen axonometrically: each face is a
 * polygon in the picture, filled with the board's colour and tooth, its
 * print mapped on with the face's own matrix, shaded by how it turns to
 * the light, and darkening a little towards the table. A cut edge of
 * corrugated board shows its flutes: a wavy liner between two flat ones.
 */

import { el } from '../render/svg.js';
import { clamp, n } from '../util/num.js';

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

/**
 * One face of board.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./board.js').BoardFace} o The face.
 * @returns {string} The markup.
 */
export function boardFace(sc, { d, color, shade, texture = null, print = '', fall = null }) {
	const c = sc.id('bface');
	sc.def(el('clipPath', { id: c }, el('path', { d })));
	return el(
		'g',
		{ 'clip-path': `url(#${c})` },
		el('path', { d, fill: color }),
		print,
		texture ? el('path', { d, fill: texture }) : '',
		shade > 0 ? el('path', { d, fill: '#000', opacity: shade }) : '',
		fall ? el('path', { d, fill: fall }) : '',
	);
}

/**
 * The cut edge of corrugated board, as a strip in its own frame (along it 0–`length`, across it 0–`thickness`): two liners and the fluting between.
 *
 * @param {{ length: number, thickness: number, color: string, flute?: number }} o The strip's length and thickness (in the frame's units), the board's colour, and the flutes' pitch (in thicknesses, 1.3).
 * @returns {string} The markup, in the strip's frame.
 */
export function flutes({ length, thickness: t, color, flute = 1.3 }) {
	const pitch = t * flute;
	let d = `M0 ${n(t * 0.78)}`;
	for (let x = 0; x < length; x += pitch) d += `Q${n(x + pitch / 4)} ${n(t * 0.18)} ${n(x + pitch / 2)} ${n(t * 0.5)}T${n(x + pitch)} ${n(t * 0.78)}`;
	return (
		el('rect', { width: length, height: t, fill: color }) +
		el('rect', { width: length, height: t, fill: '#000', opacity: 0.38 }) +
		el('path', { d, fill: 'none', stroke: color, 'stroke-width': t * 0.13, 'stroke-opacity': 0.95 }) +
		el('rect', { width: length, height: t * 0.14, fill: color }) +
		el('rect', { y: t * 0.86, width: length, height: t * 0.14, fill: color }) +
		el('rect', { width: length, height: t * 0.14, fill: '#fff', opacity: 0.25 })
	);
}
