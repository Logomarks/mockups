/**
 * @module @logomarks/mockups/objects/tote
 *
 * A canvas tote bag laid flat, seen from above: the standard 380 × 420 mm
 * bag in 10 oz cotton canvas, a 30 mm hem stitched round its mouth, two
 * 25 mm webbing handles laid up in loops above it (sewn in with a boxed
 * cross), the soft creases canvas keeps, and the print centred on the front,
 * warped by the creases and soaked into the weave.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { resolveSurface, surfaceLayer } from '../materials/desk.js';
import { grainLayer } from '../materials/grain.js';
import { resolveGarment } from '../materials/fabric.js';
import { cloth } from '../materials/folds.js';
import { garment, smooth, stitches, seam } from '../parts/garment.js';
import { artAspect, fitInside } from '../parts/artsize.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox } from '../util/fit.js';
import { rng } from '../util/rng.js';
import { mix } from '../util/color.js';
import { n } from '../util/num.js';

/** A tote's measurements in mm: the bag, its hem, its handles (width, how far apart, how high the loop lies). */
export const TOTE = Object.freeze({ width: 380, height: 420, hem: 30, strap: 25, spread: 190, loop: 280 });

/** The print area on the front, in mm from the middle of the mouth. */
export const TOTE_PRINT = Object.freeze({ x: -140, y: 80, w: 280, h: 300 });

/**
 * A tote bag mockup.
 *
 * @param {import('./tote.js').ToteOptions} options The print and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function tote(options) {
	const o = reader('tote', options);
	const { art } = /** @type {import('./tote.js').ToteOptions} */ (options);
	const g = resolveGarment(/** @type {string | undefined} */ (o.raw('color')), 'natural', 'tote');
	const ink = o.color('ink', null);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', 0.84, 0.2, 1);
	const scale = o.num('scale', 1, 0.2, 1.2);
	const seed = o.text('seed', 'tote');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'oak');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));

	const W = TOTE.width / 2;
	const H = TOTE.height;
	const r = rng(`${seed}:tote`);
	const j = (v) => v + r.range(-2.5, 2.5);
	const shape = smooth([
		[j(-W), 0, true],
		[j(W), 0, true],
		[j(W + 1), H * 0.5],
		[j(W), H, true],
		[0, j(H + 2)],
		[j(-W), H, true],
		[j(-W - 1), H * 0.5],
	]);
	const box = { x0: -W - 12, y0: -10, x1: W + 12, y1: H + 12 };
	const frame = { x0: -W - 15, y0: -TOTE.loop - 30, x1: W + 15, y1: H + 15 };
	const { mm, at } = fitBox(frame, { width, height }, fit);
	const sc = scene({ width, height, key: `tote:${g.color}:${artKey(art)}:${seed}` });

	const c = cloth(shape.poly, box, { cell: 3, edge: 7, pillow: 0.28, rumple: 0.03, seed });
	c.foldLine([-W - 8, H * 0.5 + r.range(-6, 6)], [W + 8, H * 0.5 + r.range(-10, 10)], 4, -0.22, 4);
	c.wrinkle([j(-150), j(110)], [j(-150) + r.range(80, 150), j(110) + r.range(120, 220)], 18, r.range(0.25, 0.4), -1);
	c.wrinkle([j(60), j(340)], [j(60) + r.range(70, 130), j(340) - r.range(60, 120)], 14, r.range(0.2, 0.35), 1);
	c.wrinkle([j(-180), j(392)], [j(-60), j(405)], 9, 0.3, 1);

	const area = TOTE_PRINT;
	const fitted = fitInside(artAspect(art), { x: area.x + (area.w * (1 - scale)) / 2, y: area.y + (area.h * (1 - scale)) / 2, w: area.w * scale, h: area.h * scale }, 'middle');
	const thread = g.dark ? '#ffffff' : '#000000';
	const sew = (d) => stitches(d, { color: thread, opacity: g.dark ? 0.18 : 0.3, width: 0.6, stitch: 3 });
	const [ox, oy] = at(0, 0);
	const T = `translate(${n(ox)} ${n(oy)}) scale(${n(mm)})`;

	sc.add(surfaceLayer(sc, surf, { light, seed, mm }));
	// the handles lie in loops above the bag, the back one a little askew behind the front
	sc.add(el('g', { transform: T }, handle(sc, g.color, -light, strength * surf.shadow, -10, 6, -9, thread), handle(sc, g.color, -light, strength * surf.shadow, 8, 2, 7, thread)));
	sc.add(
		garment(sc, {
			mm,
			origin: [ox, oy],
			outline: shape,
			cloth: c,
			color: g.color,
			dark: g.dark,
			kind: 'canvas',
			light,
			seed,
			shadow: strength * surf.shadow,
			over:
				seam(`M${-W + 2} ${TOTE.hem}H${W - 2}`, 0.7) +
				sew(`M${-W + 3} ${TOTE.hem - 4}H${W - 3}`) +
				sew(`M${-W + 3} 5H${W - 3}`) +
				[-1, 1].map((s) => boxStitch(s * TOTE.spread * 0.5, sew)).join(''),
			prints: [{ art, rect: fitted, ink }],
			warp: 4,
			relief: { relief: 2.4, bright: g.dark ? 0.08 : 0.13 },
		}),
	);
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'tote' };
}

/**
 * The boxed cross that holds a handle into the hem, in mm.
 *
 * @param {number} x The handle's centre.
 * @param {(d: string) => string} sew Stitches along a path.
 * @returns {string} The markup.
 */
function boxStitch(x, sew) {
	const w = TOTE.strap / 2 - 2;
	const t = 4;
	const b = TOTE.hem - 6;
	return sew(`M${x - w} ${t}H${x + w}V${b}H${x - w}Z`) + sew(`M${x - w} ${t}L${x + w} ${b}M${x + w} ${t}L${x - w} ${b}`);
}

/**
 * One webbing handle, lying in a loop above the mouth, in mm: the strap, its two edge stitches, its shadow.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string} color The canvas's colour.
 * @param {number} away Which way the shadow falls, left (-1) to right (1).
 * @param {number} strength How dark the shadow is.
 * @param {number} dx How far the loop is shifted across, in mm.
 * @param {number} dy How far it's shifted up or down.
 * @param {number} turn How far it's turned, in degrees.
 * @param {string} thread The stitches' colour.
 * @returns {string} The markup.
 */
function handle(sc, color, away, strength, dx, dy, turn, thread) {
	const half = TOTE.spread / 2;
	const top = -TOTE.loop;
	// the strap's centre line, sampled, and its two edges offset from it
	const pts = [];
	for (let i = 0; i <= 40; i++) {
		const t = i / 40;
		const u = 1 - t;
		const p = [-half, 18];
		const c1 = [-half - 40, top - 15];
		const c2 = [half + 40, top - 15];
		const q = [half, 18];
		pts.push([u * u * u * p[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * q[0], u * u * u * p[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * q[1]]);
	}
	const line = (off) =>
		'M' +
		pts
			.map((p, i) => {
				const a = pts[Math.max(0, i - 1)];
				const b = pts[Math.min(pts.length - 1, i + 1)];
				const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
				return `${n(p[0] - ((b[1] - a[1]) / len) * off)} ${n(p[1] + ((b[0] - a[0]) / len) * off)}`;
			})
			.join('L');
	const d = line(0);
	const w = TOTE.strap;
	const strap = { d, fill: 'none', 'stroke-width': w, 'stroke-linecap': 'butt' };
	const webbing = mix(color, '#000000', 0.05);
	return el(
		'g',
		{ transform: `translate(${dx} ${dy}) rotate(${turn})` },
		el('path', { ...strap, stroke: '#000', opacity: Math.min(1, 0.3 * strength), transform: `translate(${n(away * 1.2)} 2)`, filter: sc.blur(2.2) }),
		el('path', { ...strap, stroke: '#000', opacity: Math.min(1, 0.12 * strength), transform: `translate(${n(away * 4)} 7)`, filter: sc.blur(8) }),
		el('path', { ...strap, stroke: webbing }),
		// webbing is woven in ribs along its length: fine lines, and the edges rolled a touch darker
		el('path', { ...strap, stroke: '#000', 'stroke-opacity': 0.06, 'stroke-width': w - 2, 'stroke-dasharray': '0.6 0.9' }),
		el('path', { ...strap, stroke: '#fff', 'stroke-opacity': 0.07, 'stroke-width': w * 0.45 }),
		el('path', { d: line(w / 2 - 0.6), fill: 'none', stroke: '#000', 'stroke-opacity': 0.18, 'stroke-width': 1.2 }),
		el('path', { d: line(-w / 2 + 0.6), fill: 'none', stroke: '#000', 'stroke-opacity': 0.18, 'stroke-width': 1.2 }),
		stitches(line(w / 2 - 3), { color: thread, opacity: thread === '#000000' ? 0.26 : 0.16, width: 0.5, stitch: 2.6 }),
		stitches(line(-w / 2 + 3), { color: thread, opacity: thread === '#000000' ? 0.26 : 0.16, width: 0.5, stitch: 2.6 }),
	);
}
