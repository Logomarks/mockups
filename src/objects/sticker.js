/**
 * @module @arraypress/mockups/objects/sticker
 *
 * Die-cut vinyl stickers with a white border: one stuck on a closed laptop
 * lid (a generic aluminium or graphite lid, bead-blasted, with a polished
 * chamfer and no logo), wrapped round a powder-coated water bottle, or
 * kiss-cut on a sticker sheet lying on a desk, one of them part peeled.
 * A sheet can also be a whole printed sheet of its own (its kiss-cuts in
 * the print), with the sticker peeled off it and stuck down beside it.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { resolveSurface, surfaceLayer, speckTile } from '../materials/desk.js';
import { resolveStock } from '../materials/paper.js';
import { grainLayer } from '../materials/grain.js';
import { trimmed } from '../parts/print.js';
import { sheet, outline } from '../parts/sheet.js';
import { defineSticker, drawSticker, slot, STICKER_SHAPES } from '../parts/sticker.js';
import { bottle } from '../parts/bottle.js';
import { tabletop } from '../parts/tabletop.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox, turnedBox, union } from '../util/fit.js';
import { mix, isHex } from '../util/color.js';
import { hash } from '../util/rng.js';

/** The layouts. */
export const STICKER_LAYOUTS = /** @type {const} */ (['laptop', 'bottle', 'sheet']);

/** The lid colours by name. */
export const LIDS = Object.freeze({ silver: '#c4c7cb', graphite: '#4a4d52' });

/** A 13" laptop's lid in mm, and an A6 sticker sheet. */
const LID = Object.freeze({ width: 304, height: 212, radius: 10 });
const SHEET = Object.freeze({ width: 105, height: 148 });

/** The sizes a printed sheet comes in, in mm. */
export const SHEET_PAPERS = Object.freeze({ A4: Object.freeze([210, 297]), A5: Object.freeze([148, 210]), A6: Object.freeze([105, 148]) });

/**
 * A sticker mockup.
 *
 * @param {import('./sticker.js').StickerOptions} options The art and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function sticker(options) {
	const o = reader('sticker', options);
	const { art } = /** @type {import('./sticker.js').StickerOptions} */ (options);
	const extra = /** @type {import('../types.js').Art[] | undefined} */ (o.raw('extra')) ?? [];
	if (!Array.isArray(extra)) throw new TypeError('sticker: extra is a list of artworks');
	const layout = o.oneOf('layout', 'laptop', STICKER_LAYOUTS);
	const shape = o.oneOf('shape', 'circle', STICKER_SHAPES);
	const printed = layout === 'sheet' ? printedSheet(o.raw('sheet')) : null;
	const diameter = o.num('diameter', printed ? 44 : layout === 'sheet' ? 54 : layout === 'bottle' ? 56 : 64, 10, 200);
	const border = o.num('border', 2.5, 0, 12);
	const bleed = o.num('bleed', 0, 0, 10);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const seed = o.text('seed', 'sticker');
	const lidRaw = o.raw('lid') ?? 'silver';
	if (!(typeof lidRaw === 'string' && (Object.hasOwn(LIDS, lidRaw) || isHex(lidRaw)))) throw new TypeError(`sticker: lid is 'silver', 'graphite' or a hex colour (got ${JSON.stringify(lidRaw)})`);
	const lid = LIDS[/** @type {keyof typeof LIDS} */ (lidRaw)] ?? lidRaw;
	const color = o.color('color', '#2e4a3f');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), layout === 'laptop' ? 'oak' : layout === 'bottle' ? 'concrete' : 'linen');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));
	const sc = scene({ width, height, key: `sticker:${layout}:${shape}:${artKey(art)}:${extra.map(artKey).join(',')}:${artKey(printed?.art)}:${seed}` });

	/**
	 * A sticker defined for this frame.
	 *
	 * @param {import('../types.js').Art} a Its art.
	 * @param {number} d Its size in mm (the art's, inside the border).
	 * @param {number} mm Pixels per mm.
	 * @returns {import('../parts/sticker.js').StickerDef} The definition.
	 */
	const define = (a, d, mm) =>
		defineSticker(sc, { place: shape === 'contour' ? sc.image(a, 1) : trimmed(sc, a, { trim: [d, d], bleed }), w: d * mm, h: d * mm, shape, border: border * mm, radius: 6 * mm, light });

	if (layout === 'bottle') {
		const box = { x0: -90, x1: 90, y0: -270, y1: 14 };
		const { mm, at } = fitBox(box, { width, height }, o.num('fit', 0.86, 0.2, 1));
		const [cx, base] = at(0, 0);
		const def = define(art, diameter, mm);
		const content = sc.id('wrapped');
		const S = def.extent * 2;
		sc.def(el('g', { id: content }, drawSticker(sc, def, { x: 0, y: S / 2, mm, light, lift: 0, shadow: 0 })));
		sc.add(tabletop(sc, surf, { light, seed, mm }));
		sc.add(bottle(sc, { cx, base, mm, color, light, shadow: strength * surf.shadow, print: { content, center: 112, height: S / mm, turn: o.num('turn', 0, -180, 180) } }));
	} else if (printed) {
		// the printed sheet, a little turned, and the sticker peeled off it, stuck down by its corner
		const [pw, ph] = SHEET_PAPERS[o.oneOf('paper', 'A5', /** @type {const} */ (['A4', 'A5', 'A6']))];
		const angle = -3;
		const at = { x: pw / 2 + diameter * 0.12, y: ph / 2 - diameter * 0.18, angle: 18 };
		const reach = diameter / 2 + border;
		const box = union([turnedBox(0, 0, pw, ph, angle), { x0: at.x - reach, y0: at.y - reach, x1: at.x + reach, y1: at.y + reach }]);
		const { mm, at: px } = fitBox(box, { width, height }, o.num('fit', 0.86, 0.2, 1));
		const [cx, cy] = px(0, 0);
		const [sx, sy] = px(at.x, at.y);
		sc.add(
			surfaceLayer(sc, surf, { light, seed, mm }),
			sheet(sc, {
				cx,
				cy,
				w: pw * mm,
				h: ph * mm,
				angle,
				radius: 3 * mm,
				art: trimmed(sc, printed.art, { trim: [pw, ph], bleed: printed.bleed }),
				stock: { ...resolveStock('gloss'), color: '#f6f5f1' },
				mm,
				light,
				thickness: 0.3 * mm,
				lift: 0.15,
				shadow: strength * surf.shadow,
				seed: hash(seed) % 997,
			}),
			drawSticker(sc, define(art, diameter, mm), { x: sx, y: sy, angle: at.angle, mm, light, lift: 0.05, shadow: strength * surf.shadow * 0.8 }),
		);
	} else if (layout === 'sheet') {
		const box = { x0: -SHEET.width / 2 - 8, x1: SHEET.width / 2 + 8, y0: -SHEET.height / 2 - 6, y1: SHEET.height / 2 + 8 };
		const { mm, at } = fitBox(box, { width, height }, o.num('fit', 0.86, 0.2, 1));
		const [cx, cy] = at(0, 0);
		const angle = -4;
		const pick = (i) => extra.length ? extra[(i - 1) % extra.length] : art;
		const small = Math.min(30, (SHEET.width - 4 * border - 18) / 3);
		/** @type {[number, number, number, import('../types.js').Art, boolean][]} */
		const spots = [
			[0, -34, diameter, art, false],
			[-24, 26, small * 1.25, pick(1), false],
			[24, 26, small * 1.25, pick(2), true],
			[-32, 60, small * 0.82, pick(3), false],
			[0, 60, small * 0.82, art, false],
			[32, 60, small * 0.82, pick(4), false],
		];
		const liner = '#f3f2ee';
		const rad = (angle * Math.PI) / 180;
		const local = (x, y) => [(x * Math.cos(rad) - y * Math.sin(rad)) * mm, (x * Math.sin(rad) + y * Math.cos(rad)) * mm];
		let stickers = '';
		for (const [x, y, d, a, peeled] of spots) {
			const def = define(a, d, mm);
			const [lx, ly] = local(x, y);
			stickers += slot(sc, def, { x: lx, y: ly, mm, liner }) + drawSticker(sc, def, { x: lx, y: ly, mm, light, lift: peeled ? 0.05 : 0, shadow: 0.55, peel: peeled ? { direction: -40 - angle, depth: 0.3 } : null });
		}
		sc.add(surfaceLayer(sc, surf, { light, seed, mm }));
		sc.add(
			sheet(sc, {
				cx,
				cy,
				w: SHEET.width * mm,
				h: SHEET.height * mm,
				angle,
				radius: 3 * mm,
				stock: { ...resolveStock('gloss'), color: liner },
				mm,
				light,
				thickness: 0.3 * mm,
				lift: 0.15,
				shadow: strength * surf.shadow,
				seed: hash(seed) % 997,
			}),
			el('g', { transform: `translate(${cx} ${cy})` }, stickers),
		);
	} else {
		const sAngle = -9;
		const sx = 58;
		const sy = 24;
		const box = { x0: sx - 125, x1: sx + 125, y0: sy - 125, y1: sy + 125 };
		const { mm, at } = fitBox(box, { width, height }, o.num('fit', 1, 0.2, 1.5));
		const [cx, cy] = at(0, 0);
		const angle = 4;
		const def = define(art, diameter, mm);
		const metal = lidFinish(sc, { color: lid, mm, seed, light });
		let decals = drawSticker(sc, def, { x: sx * mm, y: sy * mm, angle: sAngle, mm, light, lift: 0, shadow: 0.7 });
		extra.slice(0, 2).forEach((a, i) => {
			const d2 = define(a, diameter * 0.62, mm);
			decals += drawSticker(sc, d2, { x: (i ? -18 : 122) * mm, y: (i ? 62 : -48) * mm, angle: i ? 12 : -5, mm, light, lift: 0, shadow: 0.7 });
		});
		sc.add(surfaceLayer(sc, surf, { light, seed, mm }));
		sc.add(
			sheet(sc, {
				cx,
				cy,
				w: LID.width * mm,
				h: LID.height * mm,
				angle,
				radius: LID.radius * mm,
				stock: { ...resolveStock('gloss'), color: lid },
				edge: mix(lid, '#000000', 0.25),
				mm,
				light,
				thickness: 3.2 * mm,
				lift: 1.3,
				shadow: strength * surf.shadow * 1.3,
				finish: false,
				overlay: metal(LID.width * mm, LID.height * mm, LID.radius * mm) + decals,
			}),
		);
	}
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'sticker' };
}

/**
 * A laptop lid's metal: bead-blasted grain, soft broad reflections from the light, and the polished chamfer round its edge.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {{ color: string, mm: number, seed: string, light: number }} o The metal's colour, pixels per mm, the seed, the light.
 * @returns {(w: number, h: number, r: number) => string} The finish for a lid of this size, centred on the origin.
 */
function lidFinish(sc, { color, mm, seed, light }) {
	return (w, h, r) => {
		const fine = speckTile(sc, { size: 256, freq: [0.7, 0.7], octaves: 1, dark: 0.05, light: 0.05, seed: hash(seed) % 997 });
		const g = sc.id('metal');
		sc.def(
			el(
				'linearGradient',
				{ id: g, x1: 0.5 + 0.5 * light, y1: 0, x2: 0.5 - 0.5 * light, y2: 1 },
				el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.22 }),
				el('stop', { offset: 0.35, 'stop-color': '#fff', 'stop-opacity': 0.05 }),
				el('stop', { offset: 0.62, 'stop-color': '#fff', 'stop-opacity': 0.12 }),
				el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.12 }),
			),
		);
		const d = outline(w, h, r);
		const inset = outline(w - 1.6 * mm, h - 1.6 * mm, r - 0.8 * mm);
		return (
			el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: fine }) +
			el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: `url(#${g})` }) +
			el('path', { d, fill: 'none', stroke: mix(color, '#ffffff', 0.55), 'stroke-width': 1.6 * mm, 'stroke-opacity': 0.8 }) +
			el('path', { d: inset, fill: 'none', stroke: '#000', 'stroke-width': 0.25 * mm, 'stroke-opacity': 0.18 })
		);
	};
}

/**
 * A printed sheet from its option.
 *
 * @param {unknown} v The option: the sheet's print, or `{ art, bleed }`.
 * @returns {{ art: import('../types.js').Art, bleed: number } | null} The print and its bleed in mm, or `null` for none.
 * @throws {TypeError} For anything else.
 */
function printedSheet(v) {
	if (v === undefined || v === null) return null;
	const o = typeof v === 'object' && !(v instanceof Uint8Array) && !(v instanceof ArrayBuffer) ? /** @type {Record<string, unknown>} */ (v) : { art: v };
	const bleed = o.bleed ?? 0;
	if (o.art === undefined || o.art === null || o.art === '') throw new TypeError('sticker: sheet is a print, or { art, bleed }');
	if (typeof bleed !== 'number' || !(bleed >= 0 && bleed <= 10)) throw new TypeError(`sticker: sheet.bleed is a number of mm, 0–10 (got ${JSON.stringify(bleed)})`);
	return { art: /** @type {import('../types.js').Art} */ (o.art), bleed };
}
