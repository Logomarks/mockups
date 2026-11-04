/**
 * @module @arraypress/mockups/objects/cassette
 *
 * A cassette, front on: its case standing with the J-card showing the
 * cover, and the tape itself lying in front of it to one side, its label
 * cut from the cover, on a seamless ground. Laid out in millimetres (the
 * case 70 × 109, the shell 100.4 × 63.8) and fitted to the frame.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { resolveGround, groundLayer } from '../materials/ground.js';
import { grainLayer } from '../materials/grain.js';
import { flatShadow, outline } from '../parts/sheet.js';
import { shell, resolveShell, SHELL } from '../parts/cassette/shell.js';
import { tapeCase, CASE } from '../parts/cassette/case.js';
import { recall } from '../render/quiet.js';
import { artHref } from '../render/art.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox } from '../util/fit.js';

/** Where the tape lies against its case: how far it overlaps the case, and how far down it sits, in mm. */
const OVERLAP = 24;
const DROP = 37;

/**
 * Where the case and the tape go, in mm: each one's top left, and the extent of both.
 *
 * @param {'left' | 'right'} side Which side of the case the tape lies.
 * @returns {{ box: [number, number], tape: [number, number], extent: import('../util/fit.js').Box }} The case's and the tape's top left corners, and the extent.
 */
export function cassetteLayout(side) {
	const tx = side === 'right' ? CASE.width - OVERLAP : OVERLAP - SHELL.width;
	return { box: [0, 0], tape: [tx, DROP], extent: { x0: Math.min(0, tx), y0: 0, x1: Math.max(CASE.width, tx + SHELL.width), y1: Math.max(CASE.height, DROP + SHELL.height) } };
}

/**
 * A cassette mockup.
 *
 * @param {import('./cassette.js').CassetteOptions} options The artwork and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function cassette(options) {
	const o = reader('cassette', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const side = o.oneOf('side', 'right', /** @type {const} */ (['left', 'right']));
	const s = resolveShell(o.raw('shell') ?? 'black');
	const source = o.raw('label') ?? 'crop';
	const title = o.text('title', '');
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', 0.86, 0.2, 1);
	const grain = o.num('grain', 0.2, 0, 1);
	const seed = o.text('seed', 'cassette');
	const paper = o.color('paper', '#f3f1ec');
	if (!['crop', 'blur', 'plain'].includes(/** @type {string} */ (source)) && typeof source !== 'string' && !(source instanceof Uint8Array) && !(source instanceof ArrayBuffer)) {
		throw new TypeError(`cassette: label is 'crop', 'blur', 'plain' or artwork of its own (got ${JSON.stringify(source)})`);
	}
	if (source === '') throw new TypeError("cassette: label is 'crop', 'blur', 'plain' or artwork of its own (got \"\")");
	const { width, height } = resolveSize(/** @type {import('../types.js').Size | undefined} */ (o.raw('size')));
	const g = resolveGround(/** @type {import('../types.js').Ground | undefined} */ (o.raw('ground')));

	const L = cassetteLayout(side);
	const f = fitBox(L.extent, { width, height }, fit);
	const mm = f.mm;
	const [cx, cy] = f.at(...L.box);
	const [tx, ty] = f.at(...L.tape);
	const sc = scene({ width, height, key: `cassette:${side}:${JSON.stringify(source).slice(0, 40)}:${s.color}:${s.opacity}:${title}:${seed}:${artKey(art)}` });
	const square = sc.image(art, 1);
	const k = strength * g.shadow;
	// the label: a band of the cover (through its quietest window, if it was measured), a blur of it, plain, or art of its own
	/** @type {import('../render/scene.js').PlaceArt | null} */
	let label = null;
	if (source === 'crop') {
		const q = typeof art === 'string' ? recall(artHref(art)) : null;
		const c = q?.[0] ?? { x: 0.5, y: 0.5, size: 0.5 };
		label = (x, y, w, h, attrs) => {
			// the cover scaled so the quiet window spans the label, centred on it, never leaving the label bare
			const side = w / c.size;
			const left = Math.min(x, Math.max(x + w - side, x + w / 2 - c.x * side));
			const top = Math.min(y, Math.max(y + h - side, y + h / 2 - c.y * side));
			return square(left, top, side, side, attrs);
		};
	} else if (source === 'blur') label = (x, y, w, h) => el('g', { filter: sc.blur(w * 0.04) }, square(x - w * 0.1, y + h / 2 - w * 0.6, w * 1.2, w * 1.2));
	else if (source !== 'plain') {
		const own = sc.image(/** @type {import('../types.js').Art} */ (source), 88.4 / 40);
		label = own;
	}
	const caseShape = outline(CASE.width * mm, CASE.height * mm, 1.4 * mm);
	const tapeShape = outline(SHELL.width * mm, SHELL.height * mm, 3.5 * mm);
	sc.add(
		groundLayer(sc, g),
		flatShadow(sc, { d: caseShape, cx: cx + (CASE.width * mm) / 2, cy: cy + (CASE.height * mm) / 2, mm, light, lift: 0.4, strength: k }),
		tapeCase(sc, { x: cx, y: cy, mm, art: square, title, light }),
		flatShadow(sc, { d: tapeShape, cx: tx + (SHELL.width * mm) / 2, cy: ty + (SHELL.height * mm) / 2, mm, light, lift: 0.35, strength: k }),
		shell(sc, { x: tx, y: ty, mm, shell: s, label, paper, title, light }),
		grainLayer(sc, grain, seed),
	);
	return { svg: sc.svg(), width, height, object: 'cassette' };
}
