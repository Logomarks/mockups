/**
 * @module @arraypress/mockups/objects/lanyard
 *
 * A lanyard pass, lying on a surface: the pass (A6, 105 × 148 mm, 4 mm
 * corners) in a clear PVC pocket, clipped through the pocket's slot to a
 * woven strap printed with the name, whose two ends rise from the crimp and
 * curve away out of the frame, with event wristbands beside it if asked.
 * Drawn in millimetres round the pass.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { resolveSurface, surfaceLayer } from '../materials/desk.js';
import { resolveStock } from '../materials/paper.js';
import { grainLayer } from '../materials/grain.js';
import { trimmed } from '../parts/print.js';
import { sheet } from '../parts/sheet.js';
import { pocket, pocketShape } from '../parts/pocket.js';
import { strap } from '../parts/strap.js';
import { clasp } from '../parts/clasp.js';
import { resolveBands, bandPlacements, bandLayer } from '../parts/wristband.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox, turnedBox, union } from '../util/fit.js';
import { luma } from '../util/color.js';
import { hash } from '../util/rng.js';
import { clamp, n } from '../util/num.js';

/** The pass (A6) and its pocket, in mm. */
export const PASS = Object.freeze({ width: 105, height: 148, radius: 4, pocket: Object.freeze({ width: 114, height: 170 }), strap: 20 });

/** Where wristbands lie beside the pass: their group's centre, in mm round the pocket's. */
const BANDS_AT = Object.freeze([108, 62]);

/**
 * The strap's two strands, from the crimp up and away, in mm round the pocket's centre.
 *
 * @param {number} top Where the crimp's top is, y.
 * @returns {[number, number][][]} The left strand's spine and the right's.
 */
export function strands(top) {
	return [
		[[-3, top + 1], [-10, top - 22], [-36, top - 52], [-84, top - 74], [-150, top - 84], [-230, top - 80]],
		[[3, top + 1], [11, top - 24], [40, top - 56], [92, top - 82], [160, top - 96], [240, top - 98]],
	];
}

/**
 * A lanyard mockup.
 *
 * @param {import('./lanyard.js').LanyardOptions} options The pass and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function lanyard(options) {
	const o = reader('lanyard', options);
	const { art } = /** @type {import('./lanyard.js').LanyardOptions} */ (options);
	const name = o.text('name', '');
	const strapColor = o.color('strap', '#1b1c1f');
	const ink = o.color('ink', luma(strapColor) < 0.5 ? '#f4f2ee' : '#1b1c1f');
	const bleed = o.num('bleed', 0, 0, 10);
	const angle = o.num('angle', -6, -45, 45);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', 0.86, 0.2, 1);
	const seed = o.text('seed', 'lanyard');
	const stock = resolveStock(/** @type {import('../materials/paper.js').StockName} */ (o.raw('stock') ?? 'matte'), 'lanyard');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'linen');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));

	const P = PASS.pocket;
	const { slot } = pocketShape(P.width, P.height);
	const passY = P.height / 2 - 4.5 - PASS.height / 2;
	const top = slot.y - 34;
	// wristbands beside it, down to its right
	const bands = resolveBands(o.raw('wristbands') ?? [], name, 'lanyard');
	const placed = bandPlacements(bands, seed).map((p) => ({ ...p, x: p.x + BANDS_AT[0], y: p.y + BANDS_AT[1] }));
	// the frame: the pocket and the hardware, with the strap running out of it, and the bands
	const box = union([{ x0: -P.width / 2 - 12, y0: top - 72, x1: P.width / 2 + 12, y1: P.height / 2 + 6 }, ...placed.map((p) => turnedBox(p.x, p.y, p.w, p.h, p.angle))]);
	const { mm, at } = fitBox(box, { width, height }, fit);
	const [cx, cy] = at(0, 0);
	const sc = scene({ width, height, key: `lanyard:${artKey(art)}:${name}:${seed}:${JSON.stringify(bands)}` });
	const away = -light;
	const k = strength * surf.shadow;
	const frame = (dx = 0, dy = 0) => `translate(${n(cx + dx * mm)} ${n(cy + dy * mm)}) rotate(${n(angle)}) scale(${n(mm)})`;
	// a soft shadow of local-frame shapes, in screen space
	const cast = (shape, off, sigma, alpha) => (k > 0 ? el('g', { transform: frame(away * off * 0.6, off), opacity: clamp(alpha * k), filter: sc.blur(sigma) }, shape) : '');

	const strapParts = strands(top).map((spine, i) => strap(sc, { spine, width: PASS.strap, color: strapColor, ink, text: name, light, flip: i === 0 }));
	const hw = clasp(sc, { top, slot: slot.y, strap: PASS.strap });
	const shell = el('path', { d: pocketShape(P.width, P.height).d, 'fill-rule': 'evenodd', fill: '#000' });
	const a = (angle * Math.PI) / 180;

	sc.add(
		surfaceLayer(sc, surf, { light, seed, mm }),
		bands.length && bandLayer(sc, { bands, placed, at, mm, light, shadow: k, mark: o.raw('mark') === undefined ? null : sc.image(/** @type {import('../types.js').Art} */ (o.raw('mark')), 1), seed }),
		...strapParts.map((s) => cast(s.shadow, 0.5, 0.5, 0.3) + cast(s.shadow, 1.6, 1.8, 0.16)),
		cast(shell, 0.4, 0.5, 0.14),
		cast(shell, 1.8, 2.4, 0.08),
		sheet(sc, {
			cx: cx - passY * mm * Math.sin(a),
			cy: cy + passY * mm * Math.cos(a),
			w: PASS.width * mm,
			h: PASS.height * mm,
			angle,
			radius: PASS.radius * mm,
			art: trimmed(sc, art, { trim: [PASS.width, PASS.height], bleed }),
			stock,
			mm,
			light,
			thickness: 0.3 * mm,
			lift: 0,
			shadow: k * 0.7,
			seed: hash(seed) % 997,
		}),
		el('g', { transform: frame() }, pocket(sc, { w: P.width, h: P.height, lip: passY - PASS.height / 2 + P.height / 2, light })),
		el('g', { transform: frame() }, ...strapParts.map((s) => s.body)),
		cast(hw.shadow, 0.5, 0.45, 0.4),
		cast(hw.shadow, 1.5, 1.4, 0.18),
		el('g', { transform: frame() }, hw.body),
		grainLayer(sc, o.num('grain', 0.5, 0, 1), seed),
	);
	return { svg: sc.svg(), width, height, object: 'lanyard' };
}
