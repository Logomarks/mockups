/**
 * @module @logomarks/mockups/objects/tee
 *
 * A T-shirt laid flat, seen from above: a men's L in cotton jersey (chest
 * 560 mm pit to pit, 740 mm from the shoulder at the neck to the hem,
 * short sleeves angled down), with a rib collar (the inside of the back
 * neck showing through the opening), twin-needle hems and seams, soft folds
 * from the armpits and above the hem, and the print warped by those folds
 * and soaked into the knit. Shown from the front with the print on the
 * chest (full, centred or a small left-chest logo), or from the back.
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

/** The print placements, and the area each may fill (mm from the centre of the neck line; the art keeps its aspect inside it). */
export const TEE_PLACEMENTS = Object.freeze({
	center: Object.freeze({ x: -150, y: 150, w: 300, h: 360 }),
	chest: Object.freeze({ x: -110, y: 150, w: 220, h: 170 }),
	'left-chest': Object.freeze({ x: 62, y: 158, w: 88, h: 88 }),
	back: Object.freeze({ x: -150, y: 110, w: 300, h: 390 }),
});

/** A flat T-shirt's measurements in mm (a men's L). */
export const TEE = Object.freeze({ chest: 565, length: 742, shoulder: 500, sleeve: 215, opening: 195, neck: 190 });

/**
 * The T-shirt's outline, in mm from the centre of the neck line (y down).
 *
 * @param {string} [seed] Seeds a few millimetres of untidiness in how it's laid (none without one).
 * @returns {{ d: string, poly: [number, number][], sleeve: { top: [number, number], bottom: [number, number], dir: [number, number] } }} The outline, and the left sleeve's opening (the right mirrors it).
 */
export function teeOutline(seed) {
	const r = seed ? rng(`${seed}:lay`) : null;
	const j = (v) => (r ? v + r.range(-5, 5) : v);
	const half = TEE.chest / 2;
	const neck = TEE.neck / 2;
	const shoulder = [-TEE.shoulder / 2, 42];
	const dir = [-0.83, 0.56];
	const top = [shoulder[0] + TEE.sleeve * dir[0], shoulder[1] + TEE.sleeve * dir[1]];
	const bottom = [top[0] + TEE.opening * 0.56, top[1] + TEE.opening * 0.83];
	/** @type {import('../parts/garment.js').OutlinePoint[]} */
	const left = [
		[-neck, 0, true],
		[shoulder[0], shoulder[1], true],
		[top[0], top[1], true],
		[bottom[0], bottom[1], true],
		[-half - 1, 250],
		[-half + 1, 470],
		[-half - 2, TEE.length - 6, true],
	];
	const right = left.map(([x, y, c]) => /** @type {import('../parts/garment.js').OutlinePoint} */ ([-x, y, c ?? false])).reverse();
	const pts = [...left, [0, TEE.length], ...right].map(([x, y, c], i) => (i === 0 || i === 14 ? [x, y, c] : [j(x), j(y), c]));
	pts.push([neck * 0.45, 13], [0, 17], [-neck * 0.45, 13]);
	const { d, poly } = smooth(/** @type {import('../parts/garment.js').OutlinePoint[]} */ (pts));
	return { d, poly, sleeve: { top: /** @type {[number, number]} */ (top), bottom: /** @type {[number, number]} */ (bottom), dir: /** @type {[number, number]} */ (dir) } };
}

/**
 * A T-shirt mockup.
 *
 * @param {import('./tee.js').TeeOptions} options The print and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function tee(options) {
	const o = reader('tee', options);
	const { art } = /** @type {import('./tee.js').TeeOptions} */ (options);
	const placement = o.oneOf('placement', 'center', /** @type {(keyof typeof TEE_PLACEMENTS)[]} */ (Object.keys(TEE_PLACEMENTS)));
	const g = resolveGarment(/** @type {string | undefined} */ (o.raw('color')), 'white', 'tee');
	const ink = o.color('ink', null);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', 0.86, 0.2, 1);
	const scale = o.num('scale', 1, 0.2, 1.5);
	const seed = o.text('seed', 'tee');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'concrete');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));
	const back = placement === 'back';

	const box = { x0: -445, y0: -12, x1: 445, y1: TEE.length + 12 };
	const { mm, at } = fitBox(box, { width, height }, fit);
	const sc = scene({ width, height, key: `tee:${placement}:${g.color}:${artKey(art)}:${seed}` });
	const shape = teeOutline(seed);
	const c = folds(shape.poly, box, seed);

	// the print: the art at its own aspect in the placement's area, scaled about the area's top centre
	const area = TEE_PLACEMENTS[placement];
	const fitted = fitInside(artAspect(art), { x: area.x + (area.w * (1 - scale)) / 2, y: area.y, w: area.w * scale, h: area.h * scale });

	sc.add(surfaceLayer(sc, surf, { light, seed, mm }));
	sc.add(
		garment(sc, {
			mm,
			origin: at(0, 0),
			outline: shape,
			cloth: c,
			color: g.color,
			dark: g.dark,
			kind: 'jersey',
			heather: g.name === 'heather',
			light,
			seed,
			shadow: strength * surf.shadow,
			under: back ? '' : neckOpening(g.color),
			over: details(shape.sleeve, g.color, back, g.dark ? '#ffffff' : '#000000'),
			relief: { relief: 2.4, bright: g.dark ? 0.08 : 0.13 },
			prints: [{ art, rect: fitted, ink }],
			warp: 5,
		}),
	);
	sc.add(grainLayer(sc, o.num('grain', 0.5, 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'tee' };
}

/**
 * The folds of a T-shirt laid flat: drapes from each armpit towards the middle, slack across the sleeves, a ripple or two above the hem.
 *
 * @param {[number, number][]} poly The outline.
 * @param {{ x0: number, y0: number, x1: number, y1: number }} box The field's extent.
 * @param {string} seed The seed.
 * @returns {import('../materials/folds.js').Cloth} The cloth.
 */
function folds(poly, box, seed) {
	const r = rng(`${seed}:tee`);
	const j = (v) => v + r.range(-18, 18);
	// a flat lay is mostly flat: a narrow roll at the edges, then specific wrinkles
	const c = cloth(poly, box, { cell: 3, edge: 9, pillow: 0.32, rumple: 0.035, seed });
	for (const s of [-1, 1]) {
		// compression folds fanning in from the underarm
		for (let k = 0; k < 3; k++) c.wrinkle([s * j(282), j(256 + k * 12)], [s * (j(200) - k * r.range(10, 40)), j(205 + k * r.range(35, 60))], r.range(16, 22), r.range(0.12, 0.22), s === 1 ? 1 : -1);
		// a long diagonal drape towards the middle
		// a long diagonal drape towards the middle, each side its own length and angle
		const reach = r.range(0.45, 1);
		c.wrinkle([s * j(258), j(320)], [s * (258 - reach * r.range(120, 200)), 320 + reach * r.range(120, 260)], r.range(18, 26), r.range(0.3, 0.55), s === 1 ? -1 : 1);
		// slack across the sleeve, near the shoulder seam
		c.wrinkle([s * j(262), j(80)], [s * j(352), j(215)], 10, r.range(0.25, 0.4), s === 1 ? 1 : -1);
	}
	// ripples above the hem, and the faint line of a fold across the body
	c.wrinkle([j(-230), j(690)], [j(-60), j(668)], 16, r.range(0.25, 0.4), 1);
	c.wrinkle([j(40), j(700)], [j(210), j(684)], 14, r.range(0.2, 0.32), -1);
	c.foldLine([r.range(-250, -200), j(395)], [r.range(170, 240), j(395)], 5, -0.14);
	return c;
}

/**
 * The neck opening seen from the front: the inside of the back, in shade, and the back collar's rib above it.
 *
 * @param {string} color The cloth's colour.
 * @returns {string} The markup, in mm.
 */
function neckOpening(color) {
	const inside = 'M-86 6Q0 40 86 6C83 47 50 81 0 81C-50 81-83 47-86 6Z';
	return el('path', { d: inside, fill: mix(color, '#000000', 0.32) }) + rib('M-88 6Q0 36 88 6', 17, mix(color, '#000000', 0.12)) + el('path', { d: 'M-86 15Q0 49 86 15', fill: 'none', stroke: '#000', 'stroke-opacity': 0.18, 'stroke-width': 3 });
}

/**
 * Collar, seams and hems.
 *
 * @param {{ top: [number, number], bottom: [number, number], dir: [number, number] }} sleeve The left sleeve's opening.
 * @param {string} color The cloth's colour.
 * @param {boolean} back Whether it's the back.
 * @param {string} thread The stitches' colour.
 * @returns {string} The markup, in mm.
 */
function details(sleeve, color, back, thread) {
	const sew = (d, o = {}) => stitches(d, { color: thread, opacity: thread === '#000000' ? 0.3 : 0.16, ...o });
	const hem = (o) => `M${-TEE.chest / 2 + 2} ${TEE.length - o}Q0 ${TEE.length - o + 8} ${TEE.chest / 2 - 2} ${TEE.length - o}`;
	const cuff = (s, off) => {
		const [tx, ty] = sleeve.top;
		const [bx, by] = sleeve.bottom;
		const [dx, dy] = sleeve.dir;
		return `M${s * (tx - dx * off)} ${ty - dy * off}L${s * (bx - dx * off)} ${by - dy * off}`;
	};
	const sh = TEE.shoulder / 2;
	let out = '';
	for (const s of [-1, 1]) {
		out += seam(`M${s * 95} 0L${s * sh} 42`, 0.8);
		out += seam(`M${s * sh} 42Q${s * (sh + 12)} 150 ${s * (TEE.chest / 2 + 1)} 250`, 1);
		out += sew(cuff(s, 22)) + sew(cuff(s, 25.5));
	}
	out += sew(hem(22)) + sew(hem(25.5));
	if (back) {
		out += rib('M-92 4Q0 26 92 4', 15, color) + seam('M-92 12Q0 36 92 12', 0.8);
	} else {
		const front = 'M-86 5C-84 47-51 82 0 82C51 82 84 47 86 5';
		out += rib(front, 19, color) + seam('M-95 0C-92 56-55 92 0 92C55 92 92 56 95 0', 0.9) + sew('M-99 2C-96 60-57 97 0 97C57 97 96 60 99 2', { opacity: thread === '#000000' ? 0.22 : 0.12 });
	}
	return out;
}
