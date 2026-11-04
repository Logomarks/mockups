/**
 * @module @arraypress/mockups/objects/box
 *
 * Packaging, axonometric, on a table: a corrugated mailer (closed, or open
 * with its lid swung back to show the print inside it and the fluted cut
 * edges), or a two-piece lid box (the lid on, or lifted off the base).
 * The print covers the top (and, if given, the front); every face takes
 * the board's tooth and is shaded by how it turns to the light. Sizes are
 * millimetres: a mailer 250 × 180 × 80, a lid box 300 × 200 × 110.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { resolveSurface, speckTile } from '../materials/desk.js';
import { grainLayer } from '../materials/grain.js';
import { tabletop } from '../parts/tabletop.js';
import { axo } from '../parts/axo.js';
import { boardFace, faceShade, flutes } from '../parts/board.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox } from '../util/fit.js';
import { mix, isHex, luma } from '../util/color.js';
import { clamp, n } from '../util/num.js';

/** The board colours by name. */
export const BOARDS = Object.freeze({ kraft: '#b58b5d', white: '#f0eee9', black: '#212123' });

/** The boxes' sizes in mm: width, depth, height (a lid box's lid is `lid` deep). */
export const BOXES = Object.freeze({
	mailer: Object.freeze({ width: 250, depth: 180, height: 80, wall: 4 }),
	lid: Object.freeze({ width: 300, depth: 200, height: 110, wall: 2.5, lid: 32 }),
});

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
	const open = o.bool('open', false);
	const boardRaw = o.raw('board') ?? 'kraft';
	if (!(typeof boardRaw === 'string' && (Object.hasOwn(BOARDS, boardRaw) || isHex(boardRaw)))) throw new TypeError(`box: board is 'kraft', 'white', 'black' or a hex colour (got ${JSON.stringify(boardRaw)})`);
	const board = BOARDS[/** @type {keyof typeof BOARDS} */ (boardRaw)] ?? boardRaw;
	const lining = o.color('lining', boardRaw === 'kraft' ? mix(board, '#ffffff', 0.12) : board);
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
	const lift = kind === 'lid' && open ? o.num('lift', 70, 0, 200) : 0;
	const phi = (o.num('angle', 105, 60, 130) * Math.PI) / 180;

	// fit: the box and, open, the lid swung up behind it
	const unit = axo({ turn, elevation });
	const top = kind === 'lid' ? H + 2 + lift : H;
	const reach = kind === 'mailer' && open ? H + D * Math.sin(phi) : top;
	const pts = [[0, 0, 0], [W, 0, 0], [W, 0, -D], [0, 0, -D], [0, reach, -D], [W, reach, -D], [0, top, 0], [W, top, 0]].map((p) => unit.at(...p));
	const bbox = { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])) + 8 };
	const { mm, at } = fitBox(bbox, { width, height }, o.num('fit', 0.78, 0.2, 1));
	const v = axo({ turn, elevation, mm, origin: at(0, 0) });
	const sc = scene({ width, height, key: `box:${kind}:${open}:${boardRaw}:${artKey(art)}:${artKey(side)}:${artKey(inside)}:${seed}` });

	const dark = luma(board) < 0.3;
	const tooth = speckTile(sc, { size: 256, freq: [0.5 / Math.max(1, mm * 0.25), 0.5 / Math.max(1, mm * 0.25)], octaves: 2, dark: dark ? 0.05 : 0.08, light: dark ? 0.04 : 0.05, seed: 5 });
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
	/**
	 * A face from world corners.
	 *
	 * @param {[number, number, number][]} corners Its corners.
	 * @param {[number, number, number]} normal Its outward normal.
	 * @param {{ color?: string, print?: string, extra?: number, plain?: boolean }} [f] Its colour (the board's), print, extra darkness, and whether to leave off the texture.
	 * @returns {string} The markup.
	 */
	const face = (corners, normal, f = {}) =>
		boardFace(sc, { d: v.path(corners), color: f.color ?? board, shade: clamp(faceShade(normal, light) + (f.extra ?? 0), 0, 0.85), texture: f.plain ? null : tooth, print: f.print ?? '', fall: normal[1] === 0 ? `url(#${fall})` : null });
	/**
	 * Art laid over a face, in the face's frame (u along `u`, v along `w`, both in mm), cover-fitted to its box.
	 *
	 * @param {import('../types.js').Art} a The art.
	 * @param {[number, number, number]} origin The face frame's origin.
	 * @param {[number, number, number]} u Its first axis.
	 * @param {[number, number, number]} w Its second axis.
	 * @param {number} fw The art's width along `u`, mm.
	 * @param {number} fh Its height along `w`, mm.
	 * @returns {string} The markup.
	 */
	const printOn = (a, origin, u, w, fw, fh) => el('g', { transform: v.matrix(origin, u, w) }, sc.image(a, fw / fh)(0, 0, fw, fh));
	const edge = (a, b, alpha, color = '#fff') => el('path', { d: v.path([a, b], false), fill: 'none', stroke: color, 'stroke-opacity': alpha, 'stroke-width': 0.6 * mm, 'stroke-linecap': 'round' });

	// the floor shadow, under the foot and falling away from the light
	const foot = v.path([[0, 0, 0], [W, 0, 0], [W, 0, -D], [0, 0, -D]]);
	const k = strength * surf.shadow;
	const floor =
		el('path', { d: foot, fill: '#000', opacity: clamp(0.2 * k), transform: `translate(${n(-light * 30 * mm)} ${n(-4 * mm)})`, filter: sc.blur(16 * mm) }) +
		el('path', { d: foot, fill: '#000', opacity: clamp(0.3 * k), filter: sc.blur(4 * mm) }) +
		el('path', { d: foot, fill: '#000', opacity: clamp(0.55 * k), filter: sc.blur(0.8 * mm) });
	sc.add(tabletop(sc, surf, { light, seed, mm, squash: 0.6 }), floor);

	const t = S.wall;
	if (kind === 'mailer') {
		if (open) {
			// the lid swung back about the hinge: its inside faces the camera, its tuck flap points forward
			const dir = /** @type {[number, number, number]} */ ([0, Math.sin(phi), Math.cos(phi)]);
			const out = /** @type {[number, number, number]} */ ([0, Math.cos(phi), -Math.sin(phi)]);
			const flapDir = /** @type {[number, number, number]} */ ([0, -Math.cos(phi), Math.sin(phi)]);
			const free = (x) => /** @type {[number, number, number]} */ ([x, H + D * dir[1], -D + D * dir[2]]);
			const F = 34;
			const flapEnd = (x) => /** @type {[number, number, number]} */ ([x, free(x)[1] + F * flapDir[1], free(x)[2] + F * flapDir[2]]);
			const lidIn = [[0, H, -D], [W, H, -D], free(W), free(0)];
			sc.add(
				face(/** @type {[number, number, number][]} */ (lidIn), /** @type {[number, number, number]} */ ([0, -Math.cos(phi), Math.sin(phi)]), {
					color: lining,
					print: printOn(inside ?? art, free(0), [1, 0, 0], /** @type {[number, number, number]} */ ([0, -dir[1], -dir[2]]), W, D),
				}),
				face([free(0), free(W), flapEnd(W), flapEnd(0)], /** @type {[number, number, number]} */ ([0, Math.sin(phi), Math.cos(phi)]), { extra: 0.05 }),
				// the lid's right cut edge, showing its flutes
				el('g', { transform: v.matrix([W, H, -D], dir, out) }, flutes({ length: D, thickness: t, color: board })),
				el('g', { transform: v.matrix(free(W), flapDir, out) }, flutes({ length: F, thickness: t, color: board })),
			);
			// inside the tray: back wall, left wall, floor, in shade
			sc.add(
				face([[t, H, -D + t], [W - t, H, -D + t], [W - t, t, -D + t], [t, t, -D + t]], [0, 0, 1], { color: lining, extra: 0.12 }),
				face([[t, H, 0 - t], [t, H, -D + t], [t, t, -D + t], [t, t, -t]], [1, 0, 0], { color: lining, extra: 0.22 }),
				face([[t, t, -t], [W - t, t, -t], [W - t, t, -D + t], [t, t, -D + t]], [0, 1, 0], { color: lining, extra: 0.16 }),
			);
		}
		sc.add(
			face([[0, H, 0], [W, H, 0], [W, 0, 0], [0, 0, 0]], [0, 0, 1], { print: side ? printOn(side, [0, H, 0], [1, 0, 0], [0, -1, 0], W, H) : '' }),
			face([[W, H, 0], [W, H, -D], [W, 0, -D], [W, 0, 0]], [1, 0, 0]),
			el('g', { transform: v.matrix([W, H, 0], [0, 0, -1], [0, -1, 0]) }, open ? '' : flutes({ length: D, thickness: t, color: board })),
		);
		if (open) {
			// the walls' folded tops
			sc.add(
				face([[0, H, 0], [W, H, 0], [W, H, -t], [0, H, -t]], [0, 1, 0], { extra: -0.02 }),
				face([[W - t, H, 0], [W, H, 0], [W, H, -D], [W - t, H, -D]], [0, 1, 0]),
				face([[0, H, -D + t], [W, H, -D + t], [W, H, -D], [0, H, -D]], [0, 1, 0]),
				face([[0, H, 0], [t, H, 0], [t, H, -D], [0, H, -D]], [0, 1, 0]),
				edge([0, H, 0], [W, H, 0], dark ? 0.15 : 0.4),
			);
		} else {
			sc.add(
				face([[0, H, -D], [W, H, -D], [W, H, 0], [0, H, 0]], [0, 1, 0], { print: printOn(art, [0, H, -D], [1, 0, 0], [0, 0, 1], W, D) }),
				// the lid's rounded front fold and the seam where it tucks in
				edge([0, H, 0], [W, H, 0], dark ? 0.2 : 0.55),
				edge([0, H - 3, 0], [W, H - 3, 0], 0.16, '#000'),
				edge([W, H, 0], [W, 0, 0], dark ? 0.1 : 0.25),
			);
		}
	} else {
		const L = S.lid;
		const g = 3;
		const y0 = H + 2 + lift - L;
		const lidBox = { x0: -g, x1: W + g, z0: g, z1: -D - g, y1: H + 2 + lift, y0 };
		if (open) {
			sc.add(
				face([[t, H, -D + t], [W - t, H, -D + t], [W - t, t, -D + t], [t, t, -D + t]], [0, 0, 1], { color: lining, extra: 0.25 }),
				face([[t, H, -t], [t, H, -D + t], [t, t, -D + t], [t, t, -t]], [1, 0, 0], { color: lining, extra: 0.3 }),
				face([[t, t, -t], [W - t, t, -t], [W - t, t, -D + t], [t, t, -D + t]], [0, 1, 0], { color: lining, extra: 0.32 }),
			);
		}
		sc.add(
			face([[0, H, 0], [W, H, 0], [W, 0, 0], [0, 0, 0]], [0, 0, 1]),
			face([[W, H, 0], [W, H, -D], [W, 0, -D], [W, 0, 0]], [1, 0, 0]),
		);
		if (open) {
			sc.add(
				face([[0, H, 0], [W, H, 0], [W, H, -t], [0, H, -t]], [0, 1, 0]),
				face([[W - t, H, 0], [W, H, 0], [W, H, -D], [W - t, H, -D]], [0, 1, 0]),
				face([[0, H, -D + t], [W, H, -D + t], [W, H, -D], [0, H, -D]], [0, 1, 0]),
				face([[0, H, 0], [t, H, 0], [t, H, -D], [0, H, -D]], [0, 1, 0]),
			);
		}
		// the lid's shadow on the base: a soft band under its edge, wider as it lifts
		const band = Math.min(H, 3 + lift * 0.5);
		const shadowBand = (a, b) => el('path', { d: v.path(a), fill: '#000', opacity: clamp((0.3 - lift * 0.0015) * k), filter: sc.blur((1.2 + lift * 0.12) * mm) }) + b;
		if (!open || lift < L) sc.add(shadowBand([[0, Math.min(H, y0), 0], [W, Math.min(H, y0), 0], [W, Math.min(H, y0) - band, 0], [0, Math.min(H, y0) - band, 0]], ''));
		else sc.add(shadowBand([[W * 0.08, H, -D * 0.1], [W * 0.95, H, -D * 0.1], [W * 0.95, H, -D * 0.9], [W * 0.08, H, -D * 0.9]], ''));
		const { x0, x1, z0, z1, y1 } = lidBox;
		sc.add(
			face([[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]], [0, 0, 1], { print: side ? printOn(side, [x0, y1, z0], [1, 0, 0], [0, -1, 0], x1 - x0, L) : '' }),
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
