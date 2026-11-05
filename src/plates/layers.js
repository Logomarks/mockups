/**
 * @module @logomarks/mockups/plates/layers
 *
 * One screen of a plate, composited the way a retoucher would: the art
 * warped into the sign's corners and softened to the photo's sharpness; its
 * blacks lifted to ink's density; multiplied by the blank sign's own shading (so the scene's light, colour
 * cast, seams and grime fall across it); glass's veil and reflections
 * screened back over it; the photo's grain; the edge feathered into the
 * frame; whatever stands in front put back from the photo; and, for a
 * lightbox, its light bled round it.
 */

import { el } from '../render/svg.js';
import { warp } from '../render/warp.js';
import { fitArt } from '../render/fit.js';
import { grainLayer } from '../materials/grain.js';
import { polyPath } from '../util/shape.js';
import { quadMap } from './quad.js';
import { svgMarkup, placeSvg } from './inline.js';

/** The art's height in the warp's own units (its width is this times the sign's aspect). */
const UNIT = 1000;

/** Grain-layer amount per unit of the photo's noise (σ, 0–255): `grainLayer` at amount 1 adds σ ≈ 2.1. */
const GRAIN_PER_SIGMA = 1 / 2.1;

/**
 * A map cut from the photo over a screen's box, blended into what's under it.
 *
 * @param {import('./format.js').PlateScreen} s The screen.
 * @param {string} href The map.
 * @param {string} blend The CSS blend mode.
 * @returns {string} The markup.
 */
const boxImage = (s, href, blend) => el('image', { href, x: s.box[0], y: s.box[1], width: s.box[2], height: s.box[3], preserveAspectRatio: 'none', style: `mix-blend-mode:${blend}` });

/**
 * A quadrilateral pushed out from its centre by `m` pixels at each corner, so a feathered edge still covers the sign.
 *
 * @param {readonly import('./quad.js').Point[]} q The quadrilateral.
 * @param {number} m How far.
 * @returns {import('./quad.js').Point[]} The grown one.
 */
function spread(q, m) {
	const cx = q.reduce((a, p) => a + p[0], 0) / 4;
	const cy = q.reduce((a, p) => a + p[1], 0) / 4;
	return q.map(([x, y]) => {
		const d = Math.hypot(x - cx, y - cy) || 1;
		return [x + ((x - cx) / d) * m, y + ((y - cy) / d) * m];
	});
}

/**
 * The layers for one screen.
 *
 * @param {import('../render/scene.js').Scene} sc The document (the plate's size).
 * @param {import('./format.js').PlateScreen} s The screen, its looks filled in.
 * @param {object} o What to show and how.
 * @param {import('../types.js').Art} o.art The art.
 * @param {'cover' | 'contain' | 'top'} o.fit How the art fills the sign.
 * @param {string} o.background What shows round contained art.
 * @param {number} o.grain The grain, as a multiple of the photo's own.
 * @param {number} o.glow A lightbox's glow, 0–1.
 * @param {string} o.photo The id of the photo in the defs.
 * @param {string} o.seed Seeds the grain.
 * @returns {string} The markup, to go over the photo.
 */
export function screenLayers(sc, s, { art, fit, background, grain, glow, photo, seed }) {
	const [W, H] = [UNIT * s.aspect, UNIT];
	const content = sc.id('sign');
	const svg = svgMarkup(art);
	sc.def(el('g', { id: content }, el('rect', { width: W, height: H, fill: background }), svg ? placeSvg(svg, { width: W, height: H }, fit) : fitArt(sc, art, { x: 0, y: 0, width: W, height: H }, fit)));
	const warped = sc.id('warped');
	sc.def(el('g', { id: warped }, warp(sc, { content, width: W, height: H, map: quadMap(s.corners, W, H), tolerance: 0.5, max: 40 })));

	// the sign's area, its edge feathered to the photo's softness
	const edge = sc.id('edge');
	const feather = Math.max(0.35, s.soften);
	sc.def(el('mask', { id: edge, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: sc.width, height: sc.height }, el('path', { d: polyPath(spread(s.corners, feather * 0.6)), fill: '#fff', filter: sc.blur(feather * 0.7) })));

	const surface =
		el('use', { href: `#${warped}`, filter: s.soften >= 0.1 ? sc.blur(s.soften) : null }) +
		(s.black > 0 ? el('path', { d: polyPath(s.corners), fill: '#ffffff', opacity: Math.min(1, s.black) }) : '') +
		(s.shading ? boxImage(s, s.shading, 'multiply') : '') +
		(s.sheen > 0 ? el('path', { d: polyPath(s.corners), fill: '#ffffff', opacity: Math.min(1, s.sheen) }) : '') +
		(s.reflection ? boxImage(s, s.reflection, 'screen') : '') +
		grainLayer(sc, grain * s.noise * GRAIN_PER_SIGMA, seed);
	let out = el('g', { mask: `url(#${edge})`, style: 'isolation:isolate' }, surface);

	// whatever stands in front of the sign, back from the photo
	if (s.mask) {
		const front = sc.id('front');
		const [x, y, width, height] = s.box;
		sc.def(el('mask', { id: front, maskUnits: 'userSpaceOnUse', x, y, width, height }, el('image', { href: s.mask, x, y, width, height, preserveAspectRatio: 'none' })));
		out += el('use', { href: `#${photo}`, mask: `url(#${front})` });
	}

	// a lightbox's light, bled round it at two sizes (the near halo and the wider haze), screened over the photo
	if (glow > 0) {
		const size = Math.hypot(s.corners[2][0] - s.corners[0][0], s.corners[2][1] - s.corners[0][1]);
		out += el(
			'g',
			{ style: 'mix-blend-mode:screen', opacity: Math.min(1, glow) },
			el('use', { href: `#${warped}`, filter: sc.blur(size * 0.008), opacity: 0.35 }),
			el('use', { href: `#${warped}`, filter: sc.blur(size * 0.045), opacity: 0.65 }),
		);
	}
	return out;
}
