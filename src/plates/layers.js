/**
 * @module @logomarks/mockups/plates/layers
 *
 * One screen of a plate, composited the way a retoucher would: the art
 * warped into the sign's corners and softened to the photo's sharpness; its
 * blacks lifted to ink's density; multiplied by the blank sign's own shading (so the scene's light, colour
 * cast, seams and grime fall across it); glass's veil and reflections
 * screened back over it; the photo's grain; the edge feathered into the
 * frame; whatever stands in front put back from the photo; and, for a
 * lightbox, its light bled round it. The surface may be a flat sign, the
 * ellipse inside its corners, or a band round a cylinder; on cloth the art
 * follows the folds; and a finish (deboss, emboss, engrave, foil) lays the
 * art's relief, lit from the photo's light, over it.
 */

import { el } from '../render/svg.js';
import { warp } from '../render/warp.js';
import { fitArt } from '../render/fit.js';
import { grainLayer } from '../materials/grain.js';
import { polyPath } from '../util/shape.js';
import { svgMarkup, placeSvg } from './inline.js';
import { surfaceMap, outline, spread, shortSide } from './surface.js';
import { FABRIC_DISPLACE } from './format.js';
import { clothFilter, finishLayers, flatFilter } from './finish.js';

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
 * The art in the sign's own units: its ground (unless it's left out), and the art fitted over it, cut to an ellipse
 * when the sign is round.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('../types.js').Art} art The art.
 * @param {{ W: number, H: number, fit: 'cover' | 'contain' | 'top', background: string | null, round: boolean }} o How.
 * @returns {string} The id of the drawing in the defs.
 */
function signArt(sc, art, { W, H, fit, background, round }) {
	const id = sc.id('sign');
	const svg = svgMarkup(art);
	const body = (background ? el('rect', { width: W, height: H, fill: background }) : '') + (svg ? placeSvg(svg, { width: W, height: H }, fit) : fitArt(sc, art, { x: 0, y: 0, width: W, height: H }, fit));
	if (!round) {
		sc.def(el('g', { id }, body));
		return id;
	}
	const clip = sc.id('round');
	sc.def(el('clipPath', { id: clip }, el('ellipse', { cx: W / 2, cy: H / 2, rx: W / 2, ry: H / 2 })));
	sc.def(el('g', { id, 'clip-path': `url(#${clip})` }, body));
	return id;
}

/**
 * The layers for one screen.
 *
 * @param {import('../render/scene.js').Scene} sc The document (the plate's size).
 * @param {import('./format.js').PlateScreen} s The screen, its looks filled in.
 * @param {object} o What to show and how.
 * @param {import('../types.js').Art} o.art The art.
 * @param {'cover' | 'contain' | 'top'} o.fit How the art fills the sign.
 * @param {string} o.background What shows round contained art: a colour, or `'none'` for the sign itself (paint on a wall, white ink on dark stock, a decal): the art is printed only where it is, and the photo shows round it.
 * @param {number} o.grain The grain, as a multiple of the photo's own.
 * @param {number} o.glow A lightbox's glow, 0–1.
 * @param {string} o.photo The id of the photo in the defs.
 * @param {string} o.seed Seeds the grain.
 * @param {import('./finish.js').ResolvedFinish} o.finish How the art sits in the surface.
 * @returns {string} The markup, to go over the photo.
 */
export function screenLayers(sc, s, { art, fit, background, grain, glow, photo, seed, finish }) {
	const [W, H] = [UNIT * s.aspect, UNIT];
	const map = surfaceMap(s, W, H);
	const round = s.shape === 'ellipse';
	const shape = outline(s);
	const fill = polyPath(shape);
	const size = shortSide(s.corners);
	// the art prints unless the finish leaves it out (a blind deboss, foil) or recolours it
	const prints = finish.type === 'ink' || (finish.ink && !finish.color);
	const warpOf = (content) => {
		const id = sc.id('warped');
		sc.def(el('g', { id }, warp(sc, { content, width: W, height: H, map, tolerance: 0.5, max: 40 })));
		return id;
	};
	const clear = background === 'none';
	const warped = warpOf(signArt(sc, art, { W, H, fit, background: clear ? null : background, round }));
	const alone = clear ? warped : finish.type === 'ink' ? null : warpOf(signArt(sc, art, { W, H, fit, background: null, round }));

	// the sign's area, its edge feathered to the photo's softness
	const edge = sc.id('edge');
	const feather = Math.max(0.35, s.soften);
	sc.def(el('mask', { id: edge, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: sc.width, height: sc.height }, el('path', { d: polyPath(spread(shape, feather * 0.6)), fill: '#fff', filter: sc.blur(feather * 0.7) })));

	// on cloth, the art follows the folds
	const displace = s.displace ?? (s.kind === 'fabric' ? FABRIC_DISPLACE * size : 0);
	const filters = [displace > 0 && s.shading ? clothFilter(sc, s, displace) : null, s.soften >= 0.1 ? sc.blur(s.soften) : null].filter(Boolean);
	let printed = el('use', { href: `#${warped}`, filter: filters.pop() ?? null });
	if (filters.length) printed = el('g', { filter: filters[0] }, printed);

	const surface =
		(prints ? printed : '') +
		(prints && s.black > 0 ? el('path', { d: fill, fill: '#ffffff', opacity: Math.min(1, s.black) }) : '') +
		(prints && s.shading ? boxImage(s, s.shading, 'multiply') : '') +
		(alone ? finishLayers(sc, s, { finish, alone, size, fill }) : '') +
		(s.sheen > 0 ? el('path', { d: fill, fill: '#ffffff', opacity: Math.min(1, s.sheen) }) : '') +
		(s.reflection ? boxImage(s, s.reflection, 'screen') : '') +
		(prints ? grainLayer(sc, grain * s.noise * GRAIN_PER_SIGMA, seed) : '');
	// a finish without ink shows the photo under its relief; with no ground, the print is cut to the art's own shape over the photo
	let body = surface;
	if (clear && prints) {
		const own = sc.id('own');
		const [x, y, w, h] = s.box;
		sc.def(el('mask', { id: own, maskUnits: 'userSpaceOnUse', x: x - 4, y: y - 4, width: w + 8, height: h + 8 }, el('use', { href: `#${warped}`, filter: flatFilter(sc, s.box, '#ffffff', Math.max(0.3, s.soften)) })));
		body = el('g', { mask: `url(#${own})`, style: 'isolation:isolate' }, surface);
	}
	const under = prints && !clear ? '' : el('use', { href: `#${photo}` });
	let out = el('g', { mask: `url(#${edge})`, style: 'isolation:isolate' }, under + body);

	// whatever stands in front of the sign, back from the photo
	if (s.mask) {
		const front = sc.id('front');
		const [x, y, width, height] = s.box;
		sc.def(el('mask', { id: front, maskUnits: 'userSpaceOnUse', x, y, width, height }, el('image', { href: s.mask, x, y, width, height, preserveAspectRatio: 'none' })));
		out += el('use', { href: `#${photo}`, mask: `url(#${front})` });
	}

	// a lightbox's light, bled round it at two sizes (the near halo and the wider haze), screened over the photo
	if (glow > 0) {
		const extent = Math.hypot(s.corners[2][0] - s.corners[0][0], s.corners[2][1] - s.corners[0][1]);
		out += el(
			'g',
			{ style: 'mix-blend-mode:screen', opacity: Math.min(1, glow) },
			el('use', { href: `#${warped}`, filter: sc.blur(extent * 0.008), opacity: 0.35 }),
			el('use', { href: `#${warped}`, filter: sc.blur(extent * 0.045), opacity: 0.65 }),
		);
	}
	return out;
}
