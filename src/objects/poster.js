/**
 * @module @arraypress/mockups/objects/poster
 *
 * A poster up on a wall, front on: taped at its corners on plaster or
 * brick, wheatpasted (creased, torn, taking the wall's texture), flyposted
 * round a street pole with older flyers under it, or framed (a thin black,
 * white or oak moulding and a mat) with a soft shadow on the wall. The
 * print keeps the art's own proportions, sized to an A-series sheet, or
 * takes the sheet's (the art cropped to fill it).
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { grainLayer } from '../materials/grain.js';
import { resolveStock } from '../materials/paper.js';
import { resolveWall, wallLayer, wallRelief } from '../materials/wall.js';
import { sheet, flatShadow, outline } from '../parts/sheet.js';
import { artAspect } from '../parts/artsize.js';
import { tape } from '../parts/poster/tape.js';
import { tornSheet } from '../parts/poster/torn.js';
import { creases } from '../parts/poster/creases.js';
import { framed, MOULDING } from '../parts/poster/frame.js';
import { pole, POLE } from '../parts/poster/pole.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox } from '../util/fit.js';
import { n } from '../util/num.js';

/** A-series sheets, width × height in mm (ISO 216). */
export const PAPERS = Object.freeze({ A1: Object.freeze([594, 841]), A2: Object.freeze([420, 594]), A3: Object.freeze([297, 420]), A4: Object.freeze([210, 297]), A5: Object.freeze([148, 210]) });

/** How a poster goes up. */
export const MOUNTS = /** @type {const} */ (['tape', 'wheatpaste', 'pole', 'frame']);

/** Each mount's sheet, and how much of the frame it fills, by default. */
const DEFAULTS = Object.freeze({
	tape: Object.freeze({ paper: 'A2', fit: 0.66 }),
	wheatpaste: Object.freeze({ paper: 'A1', fit: 0.74 }),
	pole: Object.freeze({ paper: 'A4', fit: 0.82 }),
	frame: Object.freeze({ paper: 'A3', fit: 0.7 }),
});

/**
 * The print's size in mm: the art's proportions (or the sheet's) with the sheet's long side.
 *
 * @param {keyof typeof PAPERS} paper The sheet.
 * @param {number} aspect The print's width over its height.
 * @returns {[number, number]} Width and height, mm.
 */
export function printSize(paper, aspect) {
	const long = Math.max(...PAPERS[paper]);
	return aspect < 1 ? [long * aspect, long] : [long, long / aspect];
}

/**
 * A poster mockup.
 *
 * @param {import('./poster.js').PosterOptions} options The artwork and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function poster(options) {
	const o = reader('poster', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const mount = o.oneOf('mount', 'tape', MOUNTS);
	const d = DEFAULTS[mount];
	const paper = o.oneOf('paper', /** @type {keyof typeof PAPERS} */ (d.paper), /** @type {(keyof typeof PAPERS)[]} */ (Object.keys(PAPERS)));
	const shape = o.oneOf('aspect', 'art', /** @type {const} */ (['art', 'paper']));
	const wall = resolveWall(o.raw('wall') ?? (mount === 'pole' ? 'brick' : 'plaster'), 'poster');
	const frame = o.oneOf('frame', 'black', /** @type {const} */ (['black', 'white', 'wood']));
	const matShare = o.num('mat', 0.12, 0, 0.3);
	const count = Math.round(o.num('count', 3, 1, 6));
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', d.fit, 0.2, 1);
	const grain = o.num('grain', 0.2, 0, 1);
	const seed = o.text('seed', 'poster');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size | undefined} */ (o.raw('size')));

	const [pw, ph] = PAPERS[paper];
	const aspect = shape === 'paper' ? pw / ph : artAspect(art, pw / ph);
	const [W, H] = printSize(paper, aspect);
	const mat = matShare * Math.min(W, H);
	const edge = mount === 'frame' ? mat + MOULDING : 0;
	const box =
		mount === 'pole'
			? { x0: -POLE * 0.75, y0: -H * 0.95, x1: POLE * 0.75, y1: H * 0.95 }
			: { x0: -W / 2 - edge, y0: -H / 2 - edge, x1: W / 2 + edge, y1: H / 2 + edge };
	const f = fitBox(box, { width, height }, fit);
	const mm = f.mm;
	const [cx, cy] = f.at(0, 0);
	const w = W * mm;
	const h = H * mm;
	const sc = scene({ width, height, key: `poster:${mount}:${paper}:${shape}:${wall.kind}:${wall.color}:${frame}:${matShare}:${count}:${seed}:${artKey(art)}` });
	const place = sc.image(art, W / H);
	const k = strength;
	const ground = { width, height, mm, light, seed };

	if (mount === 'pole') {
		// the street behind, out of focus and in the pole's shade
		const pad = 20 * mm;
		sc.add(
			el('g', { filter: sc.blur(5 * mm), transform: `translate(${n(-pad)} ${n(-pad)})` }, wallLayer(sc, wall, { ...ground, width: width + 2 * pad, height: height + 2 * pad })),
			el('rect', { width, height, fill: '#1a1612', opacity: 0.35 }),
		);
		sc.add(pole(sc, { cx, cy, top: 0, bottom: height, w, h, mm, art: place, count, light, seed }));
	} else {
		sc.add(wallLayer(sc, wall, ground));
		if (mount === 'frame') {
			const m = mat * mm;
			const ow = w + 2 * (m + MOULDING * mm);
			const oh = h + 2 * (m + MOULDING * mm);
			sc.add(flatShadow(sc, { d: outline(ow, oh, 0), cx, cy, mm, light, lift: 1.6, strength: k * 1.1 }), framed(sc, { cx, cy, w, h, mat: m, mm, frame, art: place, light, seed }));
		} else if (mount === 'tape') {
			sc.add(sheet(sc, { cx, cy, w, h, art: place, stock: resolveStock('uncoated', 'poster'), mm, light, lift: 0.7, shadow: k, seed: 3 }));
			const inset = 9 * mm;
			const corners = /** @type {const} */ ([[-1, -1, -38], [1, -1, 38], [1, 1, -36], [-1, 1, 40]]);
			sc.add(...corners.map(([sx, sy, a], i) => tape(sc, { x: cx + sx * (w / 2 - inset), y: cy + sy * (h / 2 - inset), angle: a, mm, seed: `${seed}:${i}` })));
		} else {
			// pasted: the print stops short of torn edges, the paper takes the wall's relief, the paste creases it
			const torn = tornSheet(w, h, mm, seed, 1);
			const clip = sc.id('print');
			sc.def(el('clipPath', { id: clip }, el('path', { d: torn.print })));
			/** @type {import('../render/scene.js').PlaceArt} */
			const inked = (x, y, bw, bh, attrs) => el('g', { 'clip-path': `url(#${clip})` }, place(x, y, bw, bh, attrs));
			const overlay = creases(sc, { w, h, mm, edge: torn.paper, light, seed }) + el('g', { transform: `translate(${n(-cx)} ${n(-cy)})` }, wallRelief(sc, wall, ground));
			sc.add(sheet(sc, { cx, cy, w, h, d: torn.paper, art: inked, overlay, stock: resolveStock('uncoated', 'poster'), color: '#f2eee5', mm, light, lift: 0, shadow: k * 0.3, seed: 5 }));
		}
	}
	sc.add(grainLayer(sc, grain, seed));
	return { svg: sc.svg(), width, height, object: 'poster' };
}
