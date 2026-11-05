/**
 * @module @logomarks/mockups/objects/hoodie
 *
 * A pullover hoodie laid flat, seen from above: a men's L in brushed
 * fleece (chest 600 mm pit to pit, 715 mm from the shoulder to the hem),
 * long sleeves angled down to rib cuffs, a 70 mm rib hem band, a kangaroo
 * pocket, and the hood laid back above the shoulders with its lined
 * opening crossing at the front, flat drawcords with metal aglets hanging
 * from two eyelets. Fleece is thick, so its folds are few and broad, with
 * the sleeves bunching above the cuffs. Shown from the front (a chest print
 * or a small left-chest logo) or from the back.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { resolveSurface, surfaceLayer } from '../materials/desk.js';
import { grainLayer } from '../materials/grain.js';
import { resolveGarment } from '../materials/fabric.js';
import { cloth } from '../materials/folds.js';
import { garment, smooth, stitches, seam, rib } from '../parts/garment.js';
import { artAspect, fitInside } from '../parts/artsize.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox } from '../util/fit.js';
import { rng } from '../util/rng.js';
import { mix } from '../util/color.js';
import { n } from '../util/num.js';

/** The print placements and the area each may fill, in mm from the centre of the neck line. */
export const HOODIE_PLACEMENTS = Object.freeze({
	chest: Object.freeze({ x: -150, y: 165, w: 300, h: 225 }),
	'left-chest': Object.freeze({ x: 62, y: 175, w: 88, h: 88 }),
	back: Object.freeze({ x: -170, y: 110, w: 340, h: 400 }),
});

/** A flat hoodie's measurements in mm (a men's L). */
export const HOODIE = Object.freeze({ chest: 600, length: 715, sleeve: 620, cuff: 105, band: 70, hood: 280 });

/** The left sleeve's direction (55° below the horizontal) and the direction across its cuff. */
const DIR = Object.freeze([-0.57, 0.82]);
const ACROSS = Object.freeze([0.82, 0.57]);

/**
 * The hoodie's outline (body, sleeves and the hood laid back), in mm from the centre of the neck line.
 *
 * @param {string} [seed] Seeds a few millimetres of untidiness in how it's laid.
 * @returns {{ d: string, poly: [number, number][], cuff: { outer: [number, number], inner: [number, number] } }} The outline, and the left cuff's end.
 */
export function hoodieOutline(seed) {
	const r = seed ? rng(`${seed}:lay`) : null;
	const j = (v) => (r ? v + r.range(-5, 5) : v);
	const half = HOODIE.chest / 2;
	const shoulder = [-265, 58];
	const outer = [shoulder[0] + HOODIE.sleeve * DIR[0], shoulder[1] + HOODIE.sleeve * DIR[1]];
	const inner = [outer[0] + HOODIE.cuff * ACROSS[0], outer[1] + HOODIE.cuff * ACROSS[1]];
	/** @type {import('../parts/garment.js').OutlinePoint[]} */
	const left = [
		[-140, -HOODIE.hood + 62],
		[-178, -95],
		[-178, 18],
		[j(shoulder[0]), j(shoulder[1])],
		[j(shoulder[0] - 150), j(shoulder[1] + 170)],
		[outer[0], outer[1], true],
		[inner[0], inner[1], true],
		[j(-372), j(420)],
		[-half - 2, 275, true],
		[j(-half - 4), 500],
		[-half + 8, HOODIE.length - HOODIE.band, true],
		[-half + 14, HOODIE.length, true],
	];
	const right = left.map(([x, y, c]) => /** @type {import('../parts/garment.js').OutlinePoint} */ ([-x + (r ? r.range(-3, 3) : 0), y, c ?? false])).reverse();
	const { d, poly } = smooth([[0, -HOODIE.hood], ...left, [0, HOODIE.length + 2], ...right]);
	return { d, poly, cuff: { outer: /** @type {[number, number]} */ (outer), inner: /** @type {[number, number]} */ (inner) } };
}

/**
 * A hoodie mockup.
 *
 * @param {import('./hoodie.js').HoodieOptions} options The print and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function hoodie(options) {
	const o = reader('hoodie', options);
	const { art } = /** @type {import('./hoodie.js').HoodieOptions} */ (options);
	const placement = o.oneOf('placement', 'chest', /** @type {(keyof typeof HOODIE_PLACEMENTS)[]} */ (Object.keys(HOODIE_PLACEMENTS)));
	const g = resolveGarment(/** @type {string | undefined} */ (o.raw('color')), 'heather', 'hoodie');
	const ink = o.color('ink', null);
	const cord = o.color('cord', g.color);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', 0.9, 0.2, 1);
	const scale = o.num('scale', 1, 0.2, 1.5);
	const seed = o.text('seed', 'hoodie');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'concrete');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));
	const back = placement === 'back';

	const box = { x0: -640, y0: -HOODIE.hood - 14, x1: 640, y1: HOODIE.length + 14 };
	const { mm, at } = fitBox(box, { width, height }, fit);
	const sc = scene({ width, height, key: `hoodie:${placement}:${g.color}:${artKey(art)}:${seed}` });
	const shape = hoodieOutline(seed);
	const c = folds(shape.poly, box, shape.cuff, seed, back);
	const area = HOODIE_PLACEMENTS[placement];
	const fitted = fitInside(artAspect(art), { x: area.x + (area.w * (1 - scale)) / 2, y: area.y, w: area.w * scale, h: area.h * scale });
	const thread = g.dark ? '#ffffff' : '#000000';
	const sew = (d) => stitches(d, { color: thread, opacity: g.dark ? 0.15 : 0.26, width: 0.55 });

	sc.add(surfaceLayer(sc, surf, { light, seed, mm }));
	sc.add(
		garment(sc, {
			mm,
			origin: at(0, 0),
			outline: shape,
			cloth: c,
			color: g.color,
			dark: g.dark,
			kind: 'fleece',
			heather: g.name === 'heather',
			light,
			seed,
			shadow: strength * surf.shadow,
			under: back ? hoodBack(g.color) : hoodOpening(sc, g.color, g.dark),
			over: trims(shape.cuff, g.color, sew, back),
			top: back ? '' : cords(sc, cord, light, strength * surf.shadow, seed),
			prints: [{ art, rect: fitted, ink }],
			warp: 4,
			relief: { relief: 2.2, bright: g.dark ? 0.08 : 0.12 },
		}),
	);
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'hoodie' };
}

/**
 * Fleece folds: broad drapes from the armpits, the pocket's slight bulge, the sleeves bunching above the cuffs, the hood's soft ridges.
 *
 * @param {[number, number][]} poly The outline.
 * @param {{ x0: number, y0: number, x1: number, y1: number }} box The field's extent.
 * @param {{ outer: [number, number], inner: [number, number] }} cuff The left cuff's end.
 * @param {string} seed The seed.
 * @param {boolean} back Whether it's the back (no pocket).
 * @returns {import('../materials/folds.js').Cloth} The cloth.
 */
function folds(poly, box, cuff, seed, back) {
	const r = rng(`${seed}:hoodie`);
	const j = (v) => v + r.range(-15, 15);
	// fleece is thick but still lies flat: a slightly fuller edge roll, then a few soft, matte wrinkles
	const c = cloth(poly, box, { cell: 4, edge: 12, pillow: 0.4, rumple: 0.03, seed });
	const along = (t, off) => [-265 + 620 * t * DIR[0] + off * ACROSS[0], 58 + 620 * t * DIR[1] + off * ACROSS[1]];
	const across = (s, t, len, tilt, w, h, side) => {
		const [mx, my] = along(t, 52);
		const ax = ACROSS[0] + tilt * DIR[0];
		const ay = ACROSS[1] + tilt * DIR[1];
		c.wrinkle([s * (mx - len * ax), my - len * ay], [s * (mx + len * ax), my + len * ay], w, h, side);
	};
	for (const s of [-1, 1]) {
		const side = s === 1 ? 1 : -1;
		const reach = r.range(0.5, 1);
		c.wrinkle([s * j(292), j(282)], [s * (292 - reach * r.range(90, 170)), 282 + reach * r.range(90, 220)], r.range(18, 26), r.range(0.3, 0.5), /** @type {1 | -1} */ (-side));
		c.wrinkle([s * j(285), j(300)], [s * j(205), j(300)], 9, r.range(0.2, 0.3), side);
		// relaxed creases at the elbow, then the sleeve bunching above the cuff
		across(s, r.range(0.42, 0.48), 55, r.range(-0.3, 0.3), 16, r.range(0.25, 0.35), side);
		across(s, r.range(0.54, 0.6), 45, r.range(-0.4, 0.1), 12, r.range(0.15, 0.25), /** @type {1 | -1} */ (-side));
		for (let i = 0; i < 3; i++) across(s, 0.78 + i * 0.045 + r.range(-0.01, 0.01), r.range(30, 50), r.range(-0.5, 0.5), r.range(6, 9), r.range(0.2, 0.32), i % 2 ? side : /** @type {1 | -1} */ (-side));
		c.wrinkle([s * j(118), j(-195)], [s * j(150), j(-50)], 14, 0.2, side);
	}
	if (!back) c.fold([j(-150), 560], [j(150), 560], 50, 0.22, 0.3);
	c.wrinkle([j(-230), j(615)], [j(-40), j(600)], 12, r.range(0.25, 0.35), 1);
	c.foldLine([r.range(-270, -220), j(330)], [r.range(200, 260), j(330)], 5, -0.12);
	return c;
}

/**
 * The hood seen from the front, laid back: its lined opening, edged by the drawcord channel, the two sides crossing at the front of the neck.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} color The cloth's colour.
 * @param {boolean} dark Whether the cloth reads dark.
 * @returns {string} The markup, in mm.
 */
function hoodOpening(sc, color, dark) {
	const lining = 'M-30 112C-90 70-125 0-118 -95C-110 -175-60 -205 0 -205C60 -205 110 -175 118 -95C125 0 90 70 30 112Z';
	const rim = 'M-14 122C-88 76-136 0-128 -98C-120 -190-62 -222 0 -222C62 -222 120 -190 128 -98C136 0 88 76 14 122';
	const inner = 'M-6 108C-76 64-115 0-108 -94C-100 -168-55 -194 0 -194C55 -194 100 -168 108 -94C115 0 76 64 6 108';
	// the lining: brushed fleece, a shade off the outside (lighter inside a dark hood), deepest where the hood's back lies on the surface
	const tint = dark ? mix(color, '#ffffff', 0.12) : mix(color, '#000000', 0.1);
	const g = sc.id('hood');
	sc.def(
		el(
			'radialGradient',
			{ id: g, gradientUnits: 'userSpaceOnUse', cx: 0, cy: -150, r: 230, fx: 0, fy: -175 },
			el('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': dark ? 0.45 : 0.32 }),
			el('stop', { offset: 0.55, 'stop-color': '#000', 'stop-opacity': dark ? 0.2 : 0.14 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.02 }),
		),
	);
	return (
		el('path', { d: lining, fill: tint }) +
		el('path', { d: lining, fill: `url(#${g})` }) +
		// the centre-back seam running down the inside of the hood, fading towards the neck
		seam('M0 -203C1 -150 1 -90 0 -20', 0.7) +
		// the rim's thickness: its shadow on the lining just inside it, then the channel itself and its lit fold
		el('path', { d: inner, fill: 'none', stroke: '#000', 'stroke-opacity': 0.28, 'stroke-width': 7, filter: sc.blur(2.5) }) +
		el('path', { d: rim, fill: 'none', stroke: color, 'stroke-width': 26 }) +
		el('path', { d: inner, fill: 'none', stroke: '#fff', 'stroke-opacity': dark ? 0.1 : 0.22, 'stroke-width': 2.2, transform: 'translate(0 -1.2)' }) +
		el('path', { d: inner, fill: 'none', stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': 0.8, transform: 'translate(0 1.2)' }) +
		seam(rim, 0.4) +
		// the side of the hood on top crossing the other at the neck
		el('path', { d: 'M-40 125C-10 112 20 100 52 70L44 60C14 88-14 100-46 113Z', fill: color }) +
		seam('M-44 119C-12 106 18 94 48 65', 0.7)
	);
}

/**
 * The hood seen from the back, laid up: its centre seam.
 *
 * @param {string} color The cloth's colour.
 * @returns {string} The markup, in mm.
 */
function hoodBack(color) {
	return el('path', { d: 'M-150 40C-80 20 80 20 150 40', fill: 'none', stroke: color, 'stroke-width': 1 }) + seam('M0 -268C2 -160 1 -60 0 22', 0.9) + seam('M-160 30C-80 14 80 14 160 30', 0.7);
}

/**
 * Cuffs, the hem band, the pocket and the seams.
 *
 * @param {{ outer: [number, number], inner: [number, number] }} cuff The left cuff's end.
 * @param {string} color The cloth's colour.
 * @param {(d: string) => string} sew Stitches along a path.
 * @param {boolean} back Whether it's the back.
 * @returns {string} The markup, in mm.
 */
function trims(cuff, color, sew, back) {
	const half = HOODIE.chest / 2;
	const top = HOODIE.length - HOODIE.band;
	let out = rib(`M${-half + 10} ${top + HOODIE.band / 2}H${half - 10}`, HOODIE.band - 1, color, 2.2) + seam(`M${-half + 9} ${top}H${half - 9}`, 0.9);
	for (const s of [-1, 1]) {
		const [ox, oy] = cuff.outer;
		const [ix, iy] = cuff.inner;
		const b = HOODIE.band;
		const mid = `M${n(s * (ox - DIR[0] * b * 0.5))} ${n(oy - DIR[1] * b * 0.5)}L${n(s * (ix - DIR[0] * b * 0.5))} ${n(iy - DIR[1] * b * 0.5)}`;
		out += rib(mid, b, color, 2.2);
		out += seam(`M${n(s * (ox - DIR[0] * b))} ${n(oy - DIR[1] * b)}L${n(s * (ix - DIR[0] * b))} ${n(iy - DIR[1] * b)}`, 0.8);
		out += seam(`M${s * 178} 22Q${s * 230} 30 ${s * 268} 66Q${s * 290} 160 ${s * 300} 272`, 0.9);
	}
	if (!back) {
		const pocket = 'M-122 430H122C140 475 168 525 198 556L204 640H-204L-198 556C-168 525-140 475-122 430Z';
		out +=
			seam(pocket, 0.9) +
			sew('M-117 437H117') +
			// the openings: the pocket's edge lifts off the body a little, a soft shade beneath it
			el('path', { d: 'M122 430C140 475 168 525 198 556', fill: 'none', stroke: '#000', 'stroke-opacity': 0.3, 'stroke-width': 7, transform: 'translate(5 3)' }) +
			el('path', { d: 'M-122 430C-140 475-168 525-198 556', fill: 'none', stroke: '#000', 'stroke-opacity': 0.3, 'stroke-width': 7, transform: 'translate(-5 3)' }) +
			el('path', { d: 'M122 430C140 475 168 525 198 556', fill: 'none', stroke: color, 'stroke-width': 4 }) +
			el('path', { d: 'M-122 430C-140 475-168 525-198 556', fill: 'none', stroke: color, 'stroke-width': 4 }) +
			sew('M116 434C134 479 162 529 192 560') +
			sew('M-116 434C-134 479-162 529-192 560');
	}
	return out;
}

/**
 * The drawcords: flat cord from two eyelets at the neck, lying down the front, with metal aglets.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} color The cord's colour.
 * @param {number} light Where the light is.
 * @param {number} strength How dark shadows are.
 * @param {string} seed The seed.
 * @returns {string} The markup, in mm.
 */
function cords(sc, color, light, strength, seed) {
	const r = rng(`${seed}:cords`);
	const away = -light;
	let out = '';
	for (const s of [-1, 1]) {
		const x0 = s * 30;
		const y0 = 96;
		const x1 = s * r.range(42, 70);
		const y1 = r.range(360, 400);
		const d = `M${x0} ${y0}C${n(x0 + s * 6)} ${y0 + 90} ${n(x1 - s * r.range(-20, 20))} ${n(y1 - 140)} ${n(x1)} ${n(y1)}`;
		const ang = s * r.range(-8, 8);
		out +=
			el('path', { d, fill: 'none', stroke: '#000', 'stroke-width': 9, opacity: Math.min(1, 0.28 * strength), transform: `translate(${n(away * 1.5)} 2.5)`, filter: sc.blur(2) }) +
			el('path', { d, fill: 'none', stroke: mix(color, '#000000', 0.06), 'stroke-width': 8, 'stroke-linecap': 'round' }) +
			el('path', { d, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.12, 'stroke-width': 3, transform: 'translate(-1 -0.5)' }) +
			el('path', { d, fill: 'none', stroke: '#000', 'stroke-opacity': 0.1, 'stroke-width': 8, 'stroke-dasharray': '1.2 1.6' }) +
			// the aglet: a short metal tube at the cord's end
			el(
				'g',
				{ transform: `translate(${n(x1)} ${n(y1)}) rotate(${n(ang)})` },
				el('rect', { x: -4.5, y: -2, width: 9, height: 30, rx: 2.5, fill: '#000', opacity: 0.3, transform: `translate(${n(away * 1.5)} 2)`, filter: sc.blur(1.5) }),
				el('rect', { x: -4.5, y: -2, width: 9, height: 30, rx: 2.5, fill: '#a7a9ac' }),
				el('rect', { x: -4.5, y: -2, width: 3.2, height: 30, rx: 1.5, fill: '#fff', opacity: 0.55 }),
				el('rect', { x: 2, y: -2, width: 2.5, height: 30, rx: 1.2, fill: '#000', opacity: 0.25 }),
			) +
			// the eyelet: a metal ring set in the cloth
			el('circle', { cx: x0, cy: y0, r: 7.5, fill: '#8e9094' }) +
			el('circle', { cx: x0, cy: y0, r: 7.5, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.45, 'stroke-width': 1.4, 'stroke-dasharray': '10 40' }) +
			el('circle', { cx: x0, cy: y0, r: 4.6, fill: mix(color, '#000000', 0.45) });
	}
	return out;
}
