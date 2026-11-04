/**
 * @module @arraypress/mockups/parts/face
 *
 * Art printed on a flat face seen in perspective: a poster in a frame, a
 * sign's panel, a lightbox. The art is fitted into a drawing the face's
 * proportions, which is warped onto the face through its map.
 */

import { el } from '../render/svg.js';
import { warp } from '../render/warp.js';
import { fitArt } from '../render/fit.js';

/** The drawing's longer side, in units. */
const SIDE = 1000;

/**
 * Art on a face.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The face.
 * @param {(x: number, y: number) => [number, number]} o.map The face's units to pixels (a projective map), from its top-left corner.
 * @param {number} o.width The face's width, in its units.
 * @param {number} o.height Its height.
 * @param {import('../types.js').Art} [o.art] The art (or leave it out and pass `draw`).
 * @param {'cover' | 'contain' | 'top'} [o.fill='cover'] How the art fills the face.
 * @param {string} [o.background='#ffffff'] What shows round art that doesn't fill it.
 * @param {(w: number, h: number) => string} [o.draw] Draws the face instead, in `[0, w] × [0, h]`.
 * @param {number} [o.tolerance=0.75] The warp's largest error in pixels (a texture can take more, and draws faster).
 * @param {number} [o.max=28] The most cells along the longer side (fewer for a texture: the warp stays continuous, lines just bend a little at the seams).
 * @returns {string} The markup.
 */
export function artFace(sc, { map, width, height, art, fill = 'cover', background = '#ffffff', draw, tolerance, max }) {
	const k = SIDE / Math.max(width, height);
	const [w, h] = [width * k, height * k];
	const content = sc.id('face');
	const inner = draw ? draw(w, h) : (fill === 'cover' ? '' : el('rect', { width: w, height: h, fill: background })) + (art === undefined ? '' : fitArt(sc, art, { x: 0, y: 0, width: w, height: h }, fill));
	sc.def(el('g', { id: content }, inner));
	return warp(sc, { content, width: w, height: h, map: (x, y) => map(x / k, y / k), tolerance, max });
}
