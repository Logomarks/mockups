/**
 * @module @logomarks/mockups/objects/bag
 *
 * A paper shopping bag with twisted rope handles, standing on a table in a
 * three-quarter view: the printed front, the side gusset with its centre
 * crease and the bottom's triangular folds, the open top showing the dark
 * inside and the back panel's turned-over edge, the paper's tooth and soft
 * puckering, and the shadow it stands in. Kraft is the photographed kraft
 * (when it's loaded), mapped onto each panel, its grain over the print. Sizes are millimetres (a medium
 * bag: 250 wide, 320 tall, 110 deep).
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { resolveSurface, speckTile } from '../materials/desk.js';
import { grainLayer } from '../materials/grain.js';
import { FIBRE_LOOKS, boardSurface } from '../materials/board.js';
import { kraftTextures } from '../materials/textures.js';
import { tabletop } from '../parts/tabletop.js';
import { axo } from '../parts/axo.js';
import { rope } from '../parts/rope.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox } from '../util/fit.js';
import { field, fbm, ridge, blur, shadePng } from '../util/field.js';
import { mix, isHex, luma } from '../util/color.js';
import { clamp, n } from '../util/num.js';

/** The paper colours by name. */
export const BAG_PAPERS = Object.freeze({ kraft: '#b88d5f', white: '#efede8', black: '#232325' });

/** A medium bag's size, in mm. */
export const BAG = Object.freeze({ width: 250, height: 320, depth: 110, fold: 40 });

/**
 * A paper bag mockup.
 *
 * @param {import('./bag.js').BagOptions} options The print and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function bag(options) {
	const o = reader('bag', options);
	const { art } = /** @type {import('./bag.js').BagOptions} */ (options);
	const paperRaw = o.raw('paper') ?? 'kraft';
	if (!(typeof paperRaw === 'string' && (Object.hasOwn(BAG_PAPERS, paperRaw) || isHex(paperRaw)))) throw new TypeError(`bag: paper is 'kraft', 'white', 'black' or a hex colour (got ${JSON.stringify(paperRaw)})`);
	const paper = BAG_PAPERS[/** @type {keyof typeof BAG_PAPERS} */ (paperRaw)] ?? paperRaw;
	const ropeColor = o.color('rope', luma(paper) < 0.3 ? '#2b2b2d' : paperRaw === 'kraft' ? '#e9e2d4' : '#1f1f21');
	const printSize = o.num('printSize', 150, 20, BAG.width);
	const aspect = o.num('aspect', 1, 0.2, 5);
	const turn = o.num('turn', 30, 10, 60);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const seed = o.text('seed', 'bag');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'concrete');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));
	const { width: W, height: H, depth: D } = BAG;

	// fit the bag (and its handles) into the frame
	const unit = axo({ turn, elevation: 12 });
	const corners = [[0, 0, 0], [W, 0, 0], [W, 0, -D], [0, H + 100, 0], [W, H + 100, -D], [0, H + 100, -D], [0, 0, -D]].map((p) => unit.at(...p));
	const box = { x0: Math.min(...corners.map((p) => p[0])), x1: Math.max(...corners.map((p) => p[0])), y0: Math.min(...corners.map((p) => p[1])), y1: Math.max(...corners.map((p) => p[1])) + 10 };
	const { mm, at } = fitBox(box, { width, height }, o.num('fit', 0.8, 0.2, 1));
	const v = axo({ turn, elevation: 12, mm, origin: at(0, 0) });
	const sc = scene({ width, height, key: `bag:${paperRaw}:${artKey(art)}:${seed}` });
	const place = sc.image(art, aspect);

	// light on each face: Lambert against a key from above the light's side, in front
	const L = [light * 0.75, 0.7, 0.6];
	const len = Math.hypot(...L);
	const lit = (nx, ny, nz) => clamp((nx * L[0] + ny * L[1] + nz * L[2]) / len, 0, 1);
	const shadeOf = (nx, ny, nz) => clamp(0.5 * (0.92 - lit(nx, ny, nz)), 0, 0.5);
	const dark = luma(paper) < 0.3;

	// light falls off down the bag, and the paper darkens where it meets the table
	const fall = sc.id('fall');
	sc.def(
		el(
			'linearGradient',
			{ id: fall, gradientUnits: 'userSpaceOnUse', x1: 0, y1: v.at(0, H, 0)[1], x2: 0, y2: v.at(W, 0, 0)[1] },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.06 }),
			el('stop', { offset: 0.55, 'stop-color': '#000', 'stop-opacity': 0 }),
			el('stop', { offset: 0.93, 'stop-color': '#000', 'stop-opacity': 0.08 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.2 }),
		),
	);
	const tooth = speckTile(sc, { size: 256, freq: [0.5 / Math.max(1, mm * 0.25), 0.5 / Math.max(1, mm * 0.25)], octaves: 2, dark: dark ? 0.05 : 0.09, light: dark ? 0.05 : 0.06, seed: 7 });
	const fibres = speckTile(sc, { size: 384, freq: [0.04 / Math.max(1, mm * 0.3), 0.5 / Math.max(1, mm * 0.3)], octaves: 2, dark: 0.07, light: 0.04, seed: 11, cut: 0.55 });
	/**
	 * A face of paper: its colour, texture, and shading, in screen space.
	 *
	 * @param {string} d Its outline.
	 * @param {string} color Its colour.
	 * @param {number} shade How much darker than the lit paper.
	 * @param {string} [inner] Markup drawn on it before the shading (the print).
	 * @param {boolean} [textured=true] Whether its tooth shows (the inside is too dark to need it).
	 * @param {string | null} [frame=null] The panel's own transform (mm to pixels), for the photographed kraft to lie in its plane.
	 * @returns {string} The markup.
	 */
	const face = (d, color, shade, inner = '', textured = true, frame = null) => {
		const c = sc.id('face');
		sc.def(el('clipPath', { id: c }, el('path', { d })));
		const photo = textured && frame && paperRaw === 'kraft' && kraftTextures().length ? boardSurface(sc, { color: paper, kraft: true, look: FIBRE_LOOKS.kraft, matrix: frame, seed: `${seed}:${c}`, grain: 0.7 }) : null;
		return el(
			'g',
			{ 'clip-path': `url(#${c})` },
			el('path', { d, fill: color }),
			photo?.base ? el('path', { d, fill: photo.base }) : '',
			inner,
			photo ? el('path', { d, fill: photo.grain }) : textured ? el('path', { d, fill: tooth }) : '',
			!photo && textured && paperRaw === 'kraft' ? el('path', { d, fill: fibres, opacity: 0.5 }) : '',
			el('path', { d, fill: '#000', opacity: shade }),
			textured ? el('path', { d, fill: `url(#${fall})` }) : '',
		);
	};

	// the floor shadow: under the foot, and a pool falling away from the light
	const foot = v.path([[0, 0, 0], [W, 0, 0], [W, 0, -D], [0, 0, -D]]);
	const away = -light;
	const floor =
		el('path', { d: foot, fill: '#000', opacity: clamp(0.18 * strength * surf.shadow), transform: `translate(${n(away * 40 * mm)} ${n(-6 * mm)})`, filter: sc.blur(18 * mm) }) +
		el('path', { d: foot, fill: '#000', opacity: clamp(0.3 * strength * surf.shadow), transform: `translate(${n(away * 6 * mm)} 0)`, filter: sc.blur(5 * mm) }) +
		el('path', { d: foot, fill: '#000', opacity: clamp(0.5 * strength * surf.shadow), filter: sc.blur(1 * mm) });

	// inside: the back panel's inner side with its turned-over top, and the far side
	const backInner =
		face(v.path([[0, H, -D], [W, H, -D], [W, 0, -D], [0, 0, -D]]), mix(paper, '#000', 0.42), 0, '', false) +
		face(v.path([[0, H, -D], [W, H, -D], [W, H - BAG.fold, -D], [0, H - BAG.fold, -D]]), mix(paper, '#000', 0.3), 0, '', false);
	const leftInner = face(v.path([[0, H, 0], [0, H, -D], [0, 0, -D], [0, 0, 0]]), mix(paper, '#000', 0.6), 0, '', false);

	// the front: print, puckering, the bottom crease
	const local = v.matrix([0, H, 0], [1, 0, 0], [0, -1, 0]);
	const fc = sc.id('front');
	sc.def(el('clipPath', { id: fc }, el('rect', { width: W, height: H })));
	const pw = printSize * Math.sqrt(aspect);
	const ph = printSize / Math.sqrt(aspect);
	const pucker = puckerMap(seed, light);
	const front = face(
		v.path([[0, H, 0], [W, H, 0], [W, 0, 0], [0, 0, 0]]),
		paper,
		shadeOf(0, 0, 1) * 0.6,
		el(
			'g',
			{ transform: local, 'clip-path': `url(#${fc})` },
			place((W - pw) / 2, H * 0.47 - ph / 2, pw, ph),
			el('image', { width: W, height: H, href: pucker, preserveAspectRatio: 'none' }),
			el('line', { x1: 0, y1: H - D / 2, x2: W, y2: H - D / 2, stroke: '#000', 'stroke-opacity': 0.08, 'stroke-width': 0.8 }),
			el('line', { x1: 0, y1: H - D / 2 + 0.8, x2: W, y2: H - D / 2 + 0.8, stroke: '#fff', 'stroke-opacity': 0.08, 'stroke-width': 0.6 }),
		),
		true,
		local,
	);

	// the side gusset: two halves either side of the centre crease, folded in a V at the top and in triangles at the bottom
	const notch = 9;
	const sideBase = shadeOf(1, 0, 0);
	const gusset = v.matrix([W, H, 0], [0, 0, -1], [0, -1, 0]);
	const sideA = face(v.path([[W, H, 0], [W, H - notch, -D / 2], [W, D / 2, -D / 2], [W, 0, 0]]), paper, sideBase * 0.85, '', true, gusset);
	const sideB = face(v.path([[W, H - notch, -D / 2], [W, H, -D], [W, 0, -D], [W, D / 2, -D / 2]]), paper, sideBase * 1.2 + 0.04, '', true, gusset);
	const sideBottom = face(v.path([[W, D / 2, -D / 2], [W, 0, -D], [W, 0, 0]]), paper, sideBase + 0.07, '', true, gusset);
	const crease = (a, b, alpha) => el('path', { d: v.path([a, b], false), fill: 'none', stroke: '#000', 'stroke-opacity': alpha, 'stroke-width': 0.5 * mm });
	const creases =
		crease([W, H - notch, -D / 2], [W, D / 2, -D / 2], 0.18) +
		crease([W, D / 2, -D / 2], [W, 0, 0], 0.14) +
		crease([W, D / 2, -D / 2], [W, 0, -D], 0.14) +
		el('path', { d: v.path([[W, H, 0], [W, 0, 0]], false), fill: 'none', stroke: '#fff', 'stroke-opacity': dark ? 0.12 : 0.28, 'stroke-width': 0.6 * mm });

	// the cut top edges catch the light
	const rim = el('path', { d: v.path([[0, H, 0], [W, H, 0], [W, H - notch, -D / 2], [W, H, -D]], false), fill: 'none', stroke: '#fff', 'stroke-opacity': dark ? 0.18 : 0.45, 'stroke-width': 0.7 * mm, 'stroke-linejoin': 'round' });

	const holes = [W / 2 - 42, W / 2 + 42];
	const handle = (z, behind) => {
		const t = v.matrix([0, H, z], [1, 0, 0], [0, -1, 0]);
		const d = `M${holes[0]} 26C${holes[0] - 10} -40 ${W / 2 - 34} -96 ${W / 2} -96C${W / 2 + 34} -96 ${holes[1] + 10} -40 ${holes[1]} 26`;
		const ring = (x) =>
			el('circle', { cx: x, cy: 26, r: 4.2, fill: mix(paper, '#000', 0.12) }) + el('circle', { cx: x, cy: 26, r: 3, fill: mix(paper, '#000', 0.6) });
		return el('g', { transform: t }, behind ? '' : ring(holes[0]) + ring(holes[1]), rope(sc, { d, width: 6, color: ropeColor, light, shade: behind ? 0.25 : 0, clip: behind ? null : { width: W, height: H }, blurUnit: 1 }));
	};

	sc.add(tabletop(sc, surf, { light, seed, mm }), floor, handle(-D, true), backInner, leftInner, front, sideA, sideB, sideBottom, creases, rim, handle(0, false));
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'bag' };
}

/**
 * The soft puckering of a paper bag's front, lit: long shallow waves down the panel, a little cockling near the folds.
 *
 * @param {string} seed The seed.
 * @param {number} light Where the light is.
 * @returns {string} A PNG `data:` URI to lay over the front.
 */
function puckerMap(seed, light) {
	const f = fbm(field(60, 76), { seed: `${seed}:pucker`, scale: 3, octaves: 2, amp: 0.3, stretch: [0.6, 2.4] });
	ridge(f, [0.08, 0.15], [0.12, 0.95], 0.04, 0.35);
	ridge(f, [0.92, 0.1], [0.88, 0.9], 0.04, -0.3);
	ridge(f, [0.4, 0.02], [0.55, 0.3], 0.05, 0.2);
	blur(f, 1);
	return shadePng(f, { light, relief: 6, dark: 0.12, bright: 0.08 });
}
