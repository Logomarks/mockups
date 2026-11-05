/**
 * @module @logomarks/mockups/objects/box
 *
 * Packaging, axonometric, on a table: a corrugated mailer (closed, or its
 * lid swung up to show the print inside it and the fluted cut edges), or a
 * two-piece lid box (the lid on, or lifted off the base). The print covers
 * the top; a second print goes on the front, fitted to that face (whole and
 * centred on a shallow lid band). Every face is board: kraft drawn with the
 * photographed texture when it's loaded, other boards with its grain, ink
 * sitting in the fibres, each face shaded by how it turns to the light.
 * Sizes are millimetres: a mailer 250 × 180 × 80, a lid box 300 × 200 × 110.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { fitArt } from '../render/fit.js';
import { artHref } from '../render/art.js';
import { artSize } from '../render/dims.js';
import { resolveSurface } from '../materials/desk.js';
import { grainLayer } from '../materials/grain.js';
import { BOARDS, FIBRE_LOOKS, resolveBoard, liningFor, boardSurface } from '../materials/board.js';
import { tabletop } from '../parts/tabletop.js';
import { axo } from '../parts/axo.js';
import { boardFace, faceShade, flutes } from '../parts/board.js';
import { faceFit } from '../parts/print.js';
import { lidPose, openAmount } from '../parts/lid.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox } from '../util/fit.js';
import { mix, luma } from '../util/color.js';
import { clamp, n } from '../util/num.js';

export { BOARDS };

/** The boxes' sizes in mm: width, depth, height (a lid box's lid is `lid` deep). */
export const BOXES = Object.freeze({
	mailer: Object.freeze({ width: 250, depth: 180, height: 80, wall: 4 }),
	lid: Object.freeze({ width: 300, depth: 200, height: 110, wall: 2.5, lid: 32 }),
});

/** @typedef {[number, number, number]} Vec */

/**
 * A unit vector from one point to another.
 *
 * @param {Vec} a From.
 * @param {Vec} b To.
 * @returns {Vec} The direction.
 */
function towards(a, b) {
	const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
	const l = Math.hypot(...d) || 1;
	return /** @type {Vec} */ (d.map((x) => x / l));
}

/**
 * A box mockup.
 *
 * @param {import('./box.js').BoxOptions} options The print and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function box(options) {
	const o = reader('box', options);
	const { art, side, inside } = /** @type {import('./box.js').BoxOptions} */ (options);
	const kind = o.oneOf('kind', 'mailer', /** @type {const} */ (['mailer', 'lid']));
	const amount = openAmount(o.raw('open'), 'box');
	const open = amount > 0;
	const board = resolveBoard(/** @type {import('../materials/board.js').BoardOption} */ (o.raw('board')), 'box');
	const lining = o.color('lining', liningFor(board, kind));
	// the inside is kraft when it's the board's own kraft, or a white mailer's kraft inside
	const liningKraft = lining === liningFor(board, kind) && (board.name === 'kraft' || (board.name === 'white' && kind === 'mailer'));
	const liningLook = liningKraft ? FIBRE_LOOKS.kraft : FIBRE_LOOKS[luma(lining) < 0.3 ? 'black' : 'white'];
	const turn = o.num('turn', 32, 10, 60);
	const elevation = o.num('elevation', 28, 10, 60);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const seed = o.text('seed', 'box');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'paper');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));
	const S = BOXES[kind];
	const { width: W, depth: D } = S;
	const H = S.height;
	const lift = kind === 'lid' ? o.num('lift', 70, 0, 200) * amount : 0;
	const phi = (lidPose('mailer', amount).hinge * Math.PI) / 180;

	// fit: the box and, open, the lid swung up behind it
	const unit = axo({ turn, elevation });
	const top = kind === 'lid' ? H + 2 + lift : H;
	const reach = kind === 'mailer' && open ? H + D * Math.sin(phi) : top;
	const back = kind === 'mailer' && open ? -D + Math.min(0, D * Math.cos(phi)) : -D;
	const pts = [[0, 0, 0], [W, 0, 0], [W, 0, -D], [0, 0, -D], [0, reach, back], [W, reach, back], [0, top, 0], [W, top, 0]].map((p) => unit.at(...p));
	const bbox = { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])) + 8 };
	const { mm, at } = fitBox(bbox, { width, height }, o.num('fit', 0.78, 0.2, 1));
	const v = axo({ turn, elevation, mm, origin: at(0, 0) });
	const sc = scene({ width, height, key: `box:${kind}:${amount}:${board.color}:${artKey(art)}:${artKey(side)}:${artKey(inside)}:${seed}` });

	const dark = luma(board.color) < 0.3;
	const fall = sc.id('bfall');
	sc.def(
		el(
			'linearGradient',
			{ id: fall, gradientUnits: 'userSpaceOnUse', x1: 0, y1: v.at(0, top, 0)[1], x2: 0, y2: v.at(W, 0, 0)[1] },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.05 }),
			el('stop', { offset: 0.6, 'stop-color': '#000', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.14 }),
		),
	);
	let faces = 0;
	/**
	 * A face of board from its world corners (a rectangle: corner 0 its frame's origin, corner 1 along its first axis, the last along its second).
	 *
	 * @param {Vec[]} corners Its corners.
	 * @param {Vec} normal Its outward normal.
	 * @param {{ inner?: boolean, print?: string, extra?: number, over?: string }} [f] Whether it's the inside (the lining), its print, extra darkness, and markup over it (folds, occlusion).
	 * @returns {string} The markup.
	 */
	const face = (corners, normal, f = {}) => {
		const color = f.inner ? lining : board.color;
		const kraft = f.inner ? liningKraft : board.name === 'kraft';
		const matrix = v.matrix(corners[0], towards(corners[0], corners[1]), towards(corners[0], corners[corners.length - 1]));
		const { base, grain } = boardSurface(sc, { color, kraft, look: f.inner ? liningLook : board.look, matrix, seed: `${seed}:${faces++}` });
		return boardFace(sc, {
			d: v.path(corners),
			color,
			base,
			texture: grain,
			shade: clamp(faceShade(normal, light) + (f.extra ?? 0), 0, 0.85),
			shadeColor: kraft ? '#2e1a0a' : '#000',
			print: f.print ?? '',
			over: f.over ?? '',
			fall: normal[1] === 0 ? `url(#${fall})` : null,
		});
	};
	/**
	 * Art over a whole face, in the face's frame (u along `u`, v along `w`, both in mm), filling it edge to edge.
	 *
	 * @param {import('../types.js').Art} a The art.
	 * @param {Vec} origin The face frame's origin.
	 * @param {Vec} u Its first axis.
	 * @param {Vec} w Its second axis.
	 * @param {number} fw The face's width along `u`, mm.
	 * @param {number} fh Its height along `w`, mm.
	 * @returns {string} The markup.
	 */
	const printOn = (a, origin, u, w, fw, fh) => el('g', { transform: v.matrix(origin, u, w) }, sc.image(a, fw / fh)(0, 0, fw, fh));
	/**
	 * Art on a side face: edge to edge when its proportions suit the face, otherwise whole and centred inside a margin (a long, shallow lid band takes it at the band's height).
	 *
	 * @param {import('../types.js').Art} a The art.
	 * @param {Vec} origin The face frame's origin.
	 * @param {Vec} u Its first axis.
	 * @param {Vec} w Its second axis.
	 * @param {number} fw The face's width, mm.
	 * @param {number} fh Its height, mm.
	 * @returns {string} The markup.
	 */
	const sidePrint = (a, origin, u, w, fw, fh) => {
		const size = artSize(artHref(a));
		if (!size || faceFit(size.width / size.height, fw / fh) === 'cover') return printOn(a, origin, u, w, fw, fh);
		const pad = Math.min(fw, fh) * 0.1;
		return el('g', { transform: v.matrix(origin, u, w) }, fitArt(sc, a, { x: pad, y: pad, width: fw - 2 * pad, height: fh - 2 * pad }, 'contain'));
	};
	const edge = (a, b, alpha, color = '#fff', w = 0.6) => el('path', { d: v.path([a, b], false), fill: 'none', stroke: color, 'stroke-opacity': alpha, 'stroke-width': w * mm, 'stroke-linecap': 'round' });
	/**
	 * A soft band along an edge, cut to the face it's drawn into: a fold's rounded bend, or occlusion where two faces meet.
	 *
	 * @param {Vec} a One end.
	 * @param {Vec} b The other.
	 * @param {number} alpha How strong.
	 * @param {string} color Dark or light.
	 * @param {number} spread How wide, mm.
	 * @returns {string} The markup.
	 */
	const band = (a, b, alpha, color, spread) => el('path', { d: v.path([a, b], false), fill: 'none', stroke: color, 'stroke-opacity': alpha, 'stroke-width': spread * mm, filter: sc.blur(spread * 0.35 * mm) });

	// the floor shadow, under the foot and falling away from the light
	const foot = v.path([[0, 0, 0], [W, 0, 0], [W, 0, -D], [0, 0, -D]]);
	const k = strength * surf.shadow;
	const floor =
		el('path', { d: foot, fill: '#000', opacity: clamp(0.2 * k), transform: `translate(${n(-light * 30 * mm)} ${n(-4 * mm)})`, filter: sc.blur(16 * mm) }) +
		el('path', { d: foot, fill: '#000', opacity: clamp(0.3 * k), filter: sc.blur(4 * mm) }) +
		el('path', { d: foot, fill: '#000', opacity: clamp(0.55 * k), filter: sc.blur(0.8 * mm) });
	sc.add(tabletop(sc, surf, { light, seed, mm, squash: 0.6 }), floor);

	const t = S.wall;
	const medium = mix(BOARDS.kraft, board.color, 0.15);
	/**
	 * The inside of an open tray: back wall, left wall and floor, each lit by how it turns to the light, with soft occlusion gathering where they meet.
	 *
	 * @param {number} deep How much darker the inside is than the outside (it's in the box's own shade).
	 * @returns {string[]} The faces.
	 */
	const tray = (deep) => {
		const [x0, x1, z0, z1] = [t, W - t, -t, -D + t];
		const occ = 0.32;
		return [
			face([[x0, H, z1], [x1, H, z1], [x1, t, z1], [x0, t, z1]], [0, 0, 1], { inner: true, extra: deep, over: band([x0, t, z1], [x1, t, z1], occ, '#000', 14) + band([x0, H, z1], [x0, t, z1], occ, '#000', 12) }),
			face([[x0, H, z0], [x0, H, z1], [x0, t, z1], [x0, t, z0]], [1, 0, 0], { inner: true, extra: deep, over: band([x0, t, z0], [x0, t, z1], occ, '#000', 14) + band([x0, H, z1], [x0, t, z1], occ, '#000', 12) }),
			face([[x0, t, z0], [x1, t, z0], [x1, t, z1], [x0, t, z1]], [0, 1, 0], { inner: true, extra: deep + 0.06, over: band([x0, t, z1], [x1, t, z1], occ, '#000', 18) + band([x0, t, z0], [x0, t, z1], occ, '#000', 18) }),
		];
	};

	if (kind === 'mailer') {
		const hinge = /** @type {Vec} */ ([0, H, -D]);
		const dir = /** @type {Vec} */ ([0, Math.sin(phi), Math.cos(phi)]);
		const out = /** @type {Vec} */ ([0, Math.cos(phi), -Math.sin(phi)]);
		const flapDir = /** @type {Vec} */ ([0, -Math.cos(phi), Math.sin(phi)]);
		const free = (x) => /** @type {Vec} */ ([x, H + D * dir[1], -D + D * dir[2]]);
		const F = 34;
		const flapEnd = (x) => /** @type {Vec} */ ([x, free(x)[1] + F * flapDir[1], free(x)[2] + F * flapDir[2]]);
		/**
		 * The lid swung up: its inside (with the inside print) when that faces the camera, otherwise its printed outside; the tuck flap; the flutes along its cut edges.
		 *
		 * @returns {string[]} The parts.
		 */
		const lid = () => {
			const showsInside = v.facing(flapDir) > 0;
			const plane = showsInside
				? face([free(0), free(W), [W, H, -D], hinge], flapDir, { inner: true, print: printOn(inside ?? art, free(0), [1, 0, 0], /** @type {Vec} */ ([0, -dir[1], -dir[2]]), W, D) })
				: face([hinge, [W, H, -D], free(W), free(0)], out, { print: printOn(art, hinge, [1, 0, 0], dir, W, D), over: band(free(0), free(W), 0.18, '#000', 5) });
			return [
				plane,
				face([free(0), free(W), flapEnd(W), flapEnd(0)], dir, { extra: 0.05, over: band(free(0), free(W), 0.2, '#000', 6) }),
				// the lid's right cut edge, its flutes from the inner liner (at the lid's plane) to the outer
				el('g', { transform: v.matrix([W, H, -D], dir, out) }, flutes({ length: D, thickness: t, color: lining, inner: board.color, medium })),
				el('g', { transform: v.matrix(free(W), flapDir, out) }, flutes({ length: F, thickness: t, color: lining, inner: board.color, medium })),
				// the flap's cut end, the long edge that shows the flutes best, when it faces the camera
				v.facing(flapDir) > 0 ? el('g', { transform: v.matrix(flapEnd(0), [1, 0, 0], dir) }, flutes({ length: W, thickness: t, color: lining, inner: board.color, medium })) : '',
			];
		};
		if (open) {
			// swung past upright, the lid is behind the tray; short of it, it's over the tray
			const behind = phi > Math.PI / 2;
			if (behind) sc.add(...lid());
			sc.add(...tray(0.1));
			if (!behind) sc.add(...lid());
		}
		sc.add(
			face([[0, H, 0], [W, H, 0], [W, 0, 0], [0, 0, 0]], [0, 0, 1], {
				print: side ? sidePrint(side, [0, H, 0], [1, 0, 0], [0, -1, 0], W, H) : '',
				// the front wall's top is a fold (the wall is doubled over), its bend a little darker
				over: band([0, H, 0], [W, H, 0], 0.16, '#000', 5),
			}),
			face([[W, H, 0], [W, H, -D], [W, 0, -D], [W, 0, 0]], [1, 0, 0], { over: band([W, H, 0], [W, H, -D], 0.12, '#000', 4) }),
			el('g', { transform: v.matrix([W, H, 0], [0, 0, -1], [0, -1, 0]) }, open ? '' : flutes({ length: D, thickness: t, color: board.color, inner: lining, medium })),
		);
		if (open) {
			// the walls' folded tops, rounded, catching the light
			sc.add(
				face([[0, H, 0], [W, H, 0], [W, H, -t], [0, H, -t]], [0, 1, 0], { extra: -0.02 }),
				face([[W - t, H, 0], [W, H, 0], [W, H, -D], [W - t, H, -D]], [0, 1, 0]),
				face([[0, H, -D + t], [W, H, -D + t], [W, H, -D], [0, H, -D]], [0, 1, 0]),
				face([[0, H, 0], [t, H, 0], [t, H, -D], [0, H, -D]], [0, 1, 0]),
				edge([0, H, 0], [W, H, 0], dark ? 0.15 : 0.4),
			);
		} else {
			sc.add(
				face([[0, H, -D], [W, H, -D], [W, H, 0], [0, H, 0]], [0, 1, 0], {
					print: printOn(art, [0, H, -D], [1, 0, 0], [0, 0, 1], W, D),
					// the scored front fold, rounding down: lighter on the top as it turns to the light; the hinge's score at the back
					over: band([0, H, 0], [W, H, 0], dark ? 0.08 : 0.2, '#fff', 4) + band([0, H, -D], [W, H, -D], 0.12, '#000', 4),
				}),
				// the lid's rounded front fold and, just below, the faint crush where its flap tucks in
				edge([0, H, 0], [W, H, 0], dark ? 0.2 : 0.5),
				edge([0, H - 3, 0], [W, H - 3, 0], 0.14, '#000', 0.9),
				edge([0, H - 3.6, 0], [W, H - 3.6, 0], dark ? 0.05 : 0.12, '#fff', 0.5),
				edge([W, H, 0], [W, 0, 0], dark ? 0.1 : 0.25),
			);
		}
	} else {
		const L = S.lid;
		const g = 3;
		const y0 = H + 2 + lift - L;
		const { x0, x1, z0, z1, y1 } = { x0: -g, x1: W + g, z0: g, z1: -D - g, y1: H + 2 + lift };
		if (open) sc.add(...tray(0.14));
		sc.add(face([[0, H, 0], [W, H, 0], [W, 0, 0], [0, 0, 0]], [0, 0, 1]), face([[W, H, 0], [W, H, -D], [W, 0, -D], [W, 0, 0]], [1, 0, 0]));
		if (open) {
			sc.add(
				face([[0, H, 0], [W, H, 0], [W, H, -t], [0, H, -t]], [0, 1, 0]),
				face([[W - t, H, 0], [W, H, 0], [W, H, -D], [W - t, H, -D]], [0, 1, 0]),
				face([[0, H, -D + t], [W, H, -D + t], [W, H, -D], [0, H, -D]], [0, 1, 0]),
				face([[0, H, 0], [t, H, 0], [t, H, -D], [0, H, -D]], [0, 1, 0]),
			);
		}
		// the lid's shadow on the base: a soft band under its edge, wider as it lifts
		const reachDown = Math.min(H, 3 + lift * 0.5);
		const shadowBand = (a) => el('path', { d: v.path(a), fill: '#000', opacity: clamp((0.3 - lift * 0.0015) * k), filter: sc.blur((1.2 + lift * 0.12) * mm) });
		if (!open || lift < L) sc.add(shadowBand([[0, Math.min(H, y0), 0], [W, Math.min(H, y0), 0], [W, Math.min(H, y0) - reachDown, 0], [0, Math.min(H, y0) - reachDown, 0]]));
		else sc.add(shadowBand([[W * 0.08, H, -D * 0.1], [W * 0.95, H, -D * 0.1], [W * 0.95, H, -D * 0.9], [W * 0.08, H, -D * 0.9]]));
		sc.add(
			face([[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]], [0, 0, 1], { print: side ? sidePrint(side, [x0, y1, z0], [1, 0, 0], [0, -1, 0], x1 - x0, L) : '' }),
			face([[x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [x1, y0, z0]], [1, 0, 0]),
			face([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], { print: printOn(art, [x0, y1, z1], [1, 0, 0], [0, 0, 1], x1 - x0, z0 - z1) }),
			edge([x0, y1, z0], [x1, y1, z0], dark ? 0.2 : 0.5),
			edge([x1, y1, z0], [x1, y1, z1], dark ? 0.15 : 0.35),
			edge([x1, y1, z0], [x1, y0, z0], dark ? 0.1 : 0.25),
		);
	}
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'box' };
}
