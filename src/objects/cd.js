/**
 * @module @arraypress/mockups/objects/cd
 *
 * A CD, front on: a jewel case (the booklet under its clear lid) or a
 * digipak, with the disc slid half out from behind it, printed from the
 * cover or bare silver, on a seamless ground. Laid out in millimetres
 * (the case 142 × 125, the disc 120 across) and fitted to the frame.
 */

import { scene } from '../render/scene.js';
import { resolveGround, groundLayer } from '../materials/ground.js';
import { grainLayer } from '../materials/grain.js';
import { flatShadow } from '../parts/sheet.js';
import { punch } from '../parts/record.js';
import { disc, discOutline, DISC } from '../parts/cd/disc.js';
import { jewel, JEWEL } from '../parts/cd/jewel.js';
import { digipak, DIGIPAK } from '../parts/cd/digipak.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox } from '../util/fit.js';
import { hash } from '../util/rng.js';
import { n } from '../util/num.js';

/** The packagings. */
export const PACKAGINGS = /** @type {const} */ (['jewel', 'digipak']);

/**
 * Where the case and the disc go, in mm: the case's box (its top left at the origin) and the disc's centre.
 *
 * @param {'jewel' | 'digipak'} packaging The case.
 * @param {'left' | 'right'} side Where the disc comes out.
 * @param {number} peek How much of the disc's diameter shows past the case.
 * @returns {{ w: number, h: number, disc: [number, number], box: import('../util/fit.js').Box }} The case's size, the disc's centre, and the extent of both.
 */
export function cdLayout(packaging, side, peek) {
	const { width: w, height: h } = packaging === 'jewel' ? JEWEL : DIGIPAK;
	const R = DISC.radius;
	const out = peek * 2 * R;
	const x = side === 'right' ? w - R + out : R - out;
	const dx0 = Math.min(0, x - R);
	const dx1 = Math.max(w, x + R);
	return { w, h, disc: [x, h / 2], box: { x0: dx0, y0: Math.min(0, h / 2 - R), x1: dx1, y1: Math.max(h, h / 2 + R) } };
}

/**
 * A CD mockup.
 *
 * @param {import('./cd.js').CdOptions} options The artwork and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function cd(options) {
	const o = reader('cd', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const packaging = o.oneOf('packaging', 'jewel', PACKAGINGS);
	const side = o.oneOf('side', 'right', /** @type {const} */ (['left', 'right']));
	const tray = o.oneOf('tray', 'black', /** @type {const} */ (['black', 'clear']));
	const peek = o.num('peek', 0.5, 0, 0.9);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', 0.86, 0.2, 1);
	const grain = o.num('grain', 0.2, 0, 1);
	const seed = o.text('seed', 'cd');
	const face = o.raw('disc') ?? 'art';
	if (face === '' || (typeof face !== 'string' && !(face instanceof Uint8Array) && !(face instanceof ArrayBuffer))) throw new TypeError(`cd: disc is 'art', 'silver' or artwork of its own (got ${JSON.stringify(face)})`);
	const { width, height } = resolveSize(/** @type {import('../types.js').Size | undefined} */ (o.raw('size')));
	const g = resolveGround(/** @type {import('../types.js').Ground | undefined} */ (o.raw('ground')));

	const L = cdLayout(packaging, side, peek);
	const f = fitBox(L.box, { width, height }, fit);
	const mm = f.mm;
	const [x0, y0] = f.at(0, 0);
	const [dx, dy] = f.at(L.disc[0], L.disc[1]);
	const sc = scene({ width, height, key: `cd:${packaging}:${side}:${peek}:${tray}:${seed}:${artKey(art)}` });
	// the art embedded once, at the front's aspect; a square from it is its middle
	const aspect = packaging === 'digipak' ? DIGIPAK.width / DIGIPAK.height : 1;
	const front = sc.image(art, aspect);
	/** @type {import('../render/scene.js').PlaceArt} */
	const square = (x, y, w, h, attrs) => front(x - (w * aspect - w) / 2, y, w * aspect, h, attrs);
	const print = face === 'silver' ? null : face === 'art' ? square : sc.image(/** @type {import('../types.js').Art} */ (face), 1);
	const k = strength * g.shadow;

	sc.add(groundLayer(sc, g));
	if (peek > 0) {
		sc.add(
			punch(sc, dx, dy, DISC.radius * mm, flatShadow(sc, { d: discOutline(0, 0, mm), cx: dx, cy: dy, mm, light, lift: 0.25, strength: k * 0.85 }), DISC.hole * mm * 1.1),
			disc(sc, { cx: dx, cy: dy, mm, print, light, turn: (hash(seed) % 60) - 30 }),
		);
	}
	if (packaging === 'jewel') {
		const d = `M0 0h${n(L.w * mm)}v${n(L.h * mm)}h${n(-L.w * mm)}z`;
		sc.add(flatShadow(sc, { d, cx: x0, cy: y0, mm, light, lift: 0.3, strength: k }), jewel(sc, { x: x0, y: y0, mm, booklet: square, tray, ground: g.color, light }));
	} else {
		sc.add(digipak(sc, { cx: x0 + (L.w * mm) / 2, cy: y0 + (L.h * mm) / 2, mm, art: front, light, shadow: k }));
	}
	sc.add(grainLayer(sc, grain, seed));
	return { svg: sc.svg(), width, height, object: 'cd' };
}

