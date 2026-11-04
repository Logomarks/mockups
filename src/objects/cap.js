/**
 * @module @arraypress/mockups/objects/cap
 *
 * A six-panel baseball cap, structured mid-profile, sitting on a surface,
 * seen three-quarters from the front (from either side) or straight on.
 * The cap is modelled in 3D, in millimetres (a 58 cm crown 112 mm deep, a
 * pre-curved visor 76 mm long) and drawn in 2D from that model: the
 * crown's outline and light, its six seams with their topstitching, the
 * embroidered eyelets and the top button, the visor's arch, its edge and
 * its rows of stitching, all over cotton twill. The artwork sits on the
 * front panels, wrapped round the crown's curve by a displacement map
 * computed from the model, embroidered (raised satin thread) or printed.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { resolveSurface, surfaceLayer, mottle } from '../materials/desk.js';
import { grainLayer } from '../materials/grain.js';
import { resolveGarment, weave, inkSteps } from '../materials/fabric.js';
import { ortho, sample, hull, polyPath, splat, shadeOf, warpOf } from '../parts/solid.js';
import { seam, stitches } from '../parts/garment.js';
import { artAspect, fitInside } from '../parts/artsize.js';
import { reader, artKey } from '../util/reader.js';
import { resolveSize } from '../util/size.js';
import { fitBox } from '../util/fit.js';
import { mix, luma } from '../util/color.js';
import { clamp, n } from '../util/num.js';

/** A cap's measurements in mm: the crown's base (width and depth), its height, the visor's length, and the largest embroidery on the front. */
export const CAP = Object.freeze({ width: 176, depth: 196, crown: 106, brim: 76, logo: Object.freeze({ w: 100, h: 56 }) });

/** The named views: degrees about the vertical, and down from the horizon. */
export const CAP_VIEWS = Object.freeze({
	'three-quarter': Object.freeze({ turn: 32, tilt: 16 }),
	front: Object.freeze({ turn: 0, tilt: 14 }),
	'three-quarter-left': Object.freeze({ turn: -32, tilt: 16 }),
});

const A = CAP.width / 2;
const C = CAP.depth / 2;
const H = CAP.crown;
/** How far round the base the visor reaches, either side of the front. */
const REACH = (78 * Math.PI) / 180;

/**
 * How far out the crown is at a height, as a share of its base.
 *
 * @param {number} p Down from the top, 0 to π/2 at the base.
 * @returns {number} 0 at the top to 1 at the base.
 */
const spread = (p) => Math.pow(Math.sin(clamp(p, 0, Math.PI / 2)), 0.5);

/**
 * A point on the crown.
 *
 * @param {number} t Round the cap, radians (0 at the front).
 * @param {number} p Down from the top, 0 to π/2 at the base.
 * @returns {[number, number, number]} The point (x right, y up, z to the front).
 */
export function crownAt(t, p) {
	const r = spread(p);
	return [A * r * Math.sin(t), H * Math.pow(Math.cos(clamp(p, 0, Math.PI / 2)), 0.7), C * r * Math.cos(t) - 16 * (1 - r)];
}

/**
 * A point on the visor's top.
 *
 * @param {number} t Round the base it's sewn to, radians (0 at the front).
 * @param {number} s Out from the base (0) to the edge (1).
 * @returns {[number, number, number]} The point.
 */
export function brimAt(t, s) {
	const bx = A * Math.sin(t);
	const bz = C * Math.cos(t);
	let nx = Math.sin(t) / A;
	let nz = Math.cos(t) / C;
	const l = Math.hypot(nx, nz);
	nx /= l;
	nz /= l;
	const len = CAP.brim * Math.pow(Math.cos(Math.min(1, Math.abs(t) / REACH) * (Math.PI / 2)), 0.55);
	const x = bx + s * len * nx;
	const z = bz + s * len * nz;
	return [x, -s * len * 0.14 - 26 * (x / 100) ** 2 * Math.pow(s, 0.8), z];
}

/**
 * A cap mockup.
 *
 * @param {import('./cap.js').CapOptions} options The artwork and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function cap(options) {
	const o = reader('cap', options);
	const { art } = /** @type {import('./cap.js').CapOptions} */ (options);
	const g = resolveGarment(/** @type {string | undefined} */ (o.raw('color')), 'black', 'cap');
	const brimColor = o.color('brim', g.color);
	const ink = o.color('ink', null);
	const finish = o.oneOf('finish', 'embroidered', /** @type {const} */ (['embroidered', 'printed']));
	const viewName = o.oneOf('view', 'three-quarter', /** @type {(keyof typeof CAP_VIEWS)[]} */ (Object.keys(CAP_VIEWS)));
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const fit = o.num('fit', 0.66, 0.2, 1);
	const scale = o.num('scale', 1, 0.2, 1.2);
	const seed = o.text('seed', 'cap');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'concrete');
	const { width, height } = resolveSize(/** @type {import('../types.js').Size} */ (o.raw('size')));
	const view = CAP_VIEWS[viewName];
	const cam = ortho(view.turn, view.tilt);
	const L = norm([light * 0.75, -0.85, 0.6]);
	const lit = (nv) => 0.12 + 0.88 * Math.max(0, nv[0] * L[0] + nv[1] * L[1] + nv[2] * L[2]);

	// the crown's outline: the hull of its projected samples; the visor's: its edges
	/** @type {[number, number][]} */
	const crownPts = [];
	for (let i = 0; i < 72; i++) for (let j = 1; j <= 12; j++) crownPts.push(xy(cam.point(crownAt((i / 72) * Math.PI * 2, (j / 12) * (Math.PI / 2)))));
	const crown = hull(crownPts);
	/** @type {[number, number][]} */
	const brim = [];
	for (let i = 0; i <= 60; i++) brim.push(xy(cam.point(brimAt(-REACH + (i / 60) * 2 * REACH, 1))));
	for (let i = 60; i >= 0; i--) brim.push(xy(cam.point(brimAt(-REACH + (i / 60) * 2 * REACH, 0))));
	/** @type {[number, number][]} */
	const edge = [];
	for (let i = 0; i <= 60; i++) edge.push(xy(cam.point(brimAt(-REACH + (i / 60) * 2 * REACH, 1))));
	for (let i = 60; i >= 0; i--) {
		const p = brimAt(-REACH + (i / 60) * 2 * REACH, 1);
		edge.push(xy(cam.point([p[0], p[1] - 3.5, p[2]])));
	}
	// where it touches the surface: the visor's tip, and the crown's base at the back
	const floor = Math.min(...Array.from({ length: 31 }, (_, i) => brimAt(-REACH + (i / 30) * 2 * REACH, 1)[1])) - 3.5;
	/** @type {[number, number][]} */
	const foot = [];
	for (let i = 0; i < 48; i++) {
		const p = crownAt((i / 48) * Math.PI * 2, Math.PI / 2);
		foot.push(xy(cam.point([p[0], floor, p[2]])));
	}
	for (let i = 0; i <= 20; i++) {
		const p = brimAt(-REACH + (i / 20) * 2 * REACH, 1);
		foot.push(xy(cam.point([p[0], floor, p[2]])));
	}
	const shadowShape = hull(foot);

	const all = [...crown, ...brim, ...shadowShape];
	const bounds = { x0: Math.min(...all.map((p) => p[0])), y0: Math.min(...all.map((p) => p[1])), x1: Math.max(...all.map((p) => p[0])), y1: Math.max(...all.map((p) => p[1])) };
	const { mm, at } = fitBox(bounds, { width, height }, fit);
	const [ox, oy] = at(0, 0);
	const T = `translate(${n(ox)} ${n(oy)}) scale(${n(mm)})`;
	const pxBox = (b) => ({ x: ox + b.x * mm, y: oy + b.y * mm, w: b.w * mm, h: b.h * mm });
	const boxOf = (pts, pad = 2) => {
		const x0 = Math.min(...pts.map((p) => p[0])) - pad;
		const y0 = Math.min(...pts.map((p) => p[1])) - pad;
		return { x: x0, y: y0, w: Math.max(...pts.map((p) => p[0])) + pad - x0, h: Math.max(...pts.map((p) => p[1])) + pad - y0 };
	};

	const sc = scene({ width, height, key: `cap:${viewName}:${g.color}:${finish}:${artKey(art)}:${seed}` });
	const clipOf = (pts) => {
		const id = sc.id('capclip');
		sc.def(el('clipPath', { id }, el('path', { d: polyPath(pts), transform: T })));
		return `url(#${id})`;
	};
	const crownClip = clipOf(crown);
	const brimClip = clipOf(brim);

	// light on the crown and the visor
	const crownBox = boxOf(crown);
	// samples closer together than the cells, so the far side never shows through a gap in the near one
	const cs = splat(crownBox, 2);
	for (let i = 0; i < 480; i++) {
		for (let j = 0; j <= 150; j++) {
			const p = 0.01 + (j / 150) * (Math.PI / 2 - 0.01);
			const { p: q, nrm } = sample(crownAt, (i / 480) * Math.PI * 2, p, -1);
			const v = cam.point(q);
			const nv = cam.dir(nrm);
			if (nv[2] > -0.05) cs.put(v[0], v[1], v[2], lit(nv) * (0.75 + 0.25 * Math.min(1, (Math.PI / 2 - p) * 4 + 0.4)));
		}
	}
	cs.fill();
	const brimBox = boxOf(brim);
	const bs = splat(brimBox, 2);
	for (let i = 0; i <= 260; i++) {
		for (let j = 0; j <= 50; j++) {
			const { p, nrm } = sample(brimAt, -REACH + (i / 260) * 2 * REACH, j / 50, 1);
			const nn = nrm[1] < 0 ? /** @type {[number, number, number]} */ ([-nrm[0], -nrm[1], -nrm[2]]) : nrm;
			const v = cam.point(p);
			bs.put(v[0], v[1], v[2], lit(cam.dir(nn)) * (0.82 + 0.18 * (j / 50)));
		}
	}
	bs.fill();
	const shadeImg = (s, href) => el('image', { ...pxAttrs(pxBox(s.box)), href, preserveAspectRatio: 'none' });

	// the print on the front panels, wrapped round the crown
	const logo = fitInside(artAspect(art), { x: 0, y: 0, w: CAP.logo.w * scale, h: CAP.logo.h * scale }, 'middle');
	const print = frontPrint(sc, { art, logo, cam, ink, dark: g.dark, finish, light, fabric: g.color, to: { ox, oy, mm } });

	// the shadow on the surface
	const away = -light;
	const k = strength * surf.shadow;
	const shadow =
		k > 0
			? el('path', { d: polyPath(shadowShape), transform: `translate(${n(ox + away * 10 * mm)} ${n(oy + 9 * mm)}) scale(${n(mm)})`, fill: '#000', opacity: clamp(0.2 * k), filter: sc.blur(16) }) +
				el('path', { d: polyPath(shadowShape), transform: `translate(${n(ox + away * 3 * mm)} ${n(oy + 2.5 * mm)}) scale(${n(mm)})`, fill: '#000', opacity: clamp(0.3 * k), filter: sc.blur(5) }) +
				el('path', { d: polyPath(shadowShape), transform: `translate(${n(ox)} ${n(oy + 0.6 * mm)}) scale(${n(mm)})`, fill: '#000', opacity: clamp(0.35 * k), filter: sc.blur(1.4) })
			: '';
	const thread = g.dark ? mix(g.color, '#ffffff', 0.35) : mix(g.color, '#000000', 0.35);
	const brimThread = mix(brimColor, g.dark ? '#ffffff' : '#000000', 0.35);
	const darkBrim = brimColor !== g.color ? resolveGarment(brimColor, brimColor, 'cap').dark : g.dark;
	const texture = (b, clip, dark) => el('g', { 'clip-path': clip }, weave(sc, { kind: 'twill', mm, dark, seed, box: pxBox(b) }));

	sc.add(surfaceLayer(sc, surf, { light, seed, mm }));
	sc.add(
		shadow,
		// the visor first: the crown hides its far end, and nothing of the crown lies in front of it
		el('path', { d: polyPath(edge), transform: T, fill: mix(brimColor, '#000000', 0.3) }),
		el('path', { d: polyPath(brim), transform: T, fill: brimColor }),
		el('g', { 'clip-path': brimClip }, el('g', { transform: T }, brimStitches(cam, brimThread))),
		texture(brimBox, brimClip, darkBrim),
		el('g', { 'clip-path': brimClip }, shadeImg(bs, shadeOf(bs, { base: 0.62, dark: darkBrim ? 0.7 : 0.6, bright: darkBrim ? 0.22 : 0.32 }))),
		// the visor's edge catches the light where it turns towards it
		el('path', { d: polyPath(edge.slice(0, 61), false), transform: T, fill: 'none', stroke: '#fff', 'stroke-opacity': darkBrim ? 0.16 : 0.3, 'stroke-width': 0.8 }),
		el('path', { d: polyPath(crown), transform: T, fill: g.color }),
		el('g', { 'clip-path': crownClip }, el('g', { transform: T }, panels(cam, thread)), print),
		texture(crownBox, crownClip, g.dark),
		// cloth, not moulding: the twill's slight unevenness, and a soft, broad highlight on top
		el('g', { 'clip-path': crownClip, opacity: g.dark ? 0.6 : 1 }, mottle(sc, `${seed}:twill`, width / mm / 22, 0.05, 3)),
		el('g', { 'clip-path': crownClip }, shadeImg(cs, shadeOf(cs, { base: 0.7, dark: g.dark ? 0.75 : 0.72, bright: g.dark ? 0.12 : 0.18 }))),
		el('g', { transform: T }, button(cam, g.color, L)),
		grainLayer(sc, o.num('grain', 0.5, 0, 1), seed),
	);
	return { svg: sc.svg(), width, height, object: 'cap' };
}

/**
 * A view point's frame position.
 *
 * @param {[number, number, number]} v The point in view space.
 * @returns {[number, number]} Its x and y.
 */
const xy = (v) => [v[0], v[1]];

/**
 * A vector made unit length.
 *
 * @param {[number, number, number]} v The vector.
 * @returns {[number, number, number]} It, normalised.
 */
function norm(v) {
	const l = Math.hypot(v[0], v[1], v[2]) || 1;
	return [v[0] / l, v[1] / l, v[2] / l];
}

/**
 * A box as an `<image>`'s position attributes.
 *
 * @param {{ x: number, y: number, w: number, h: number }} b The box.
 * @returns {{ x: number, y: number, width: number, height: number }} The attributes.
 */
function pxAttrs(b) {
	return { x: b.x, y: b.y, width: b.w, height: b.h };
}

/**
 * The parts of a curve on the crown that face the camera, as path data.
 *
 * @param {import('../parts/solid.js').Ortho} cam The camera.
 * @param {(i: number) => [number, number]} param The curve: `i` from 0 to `steps` gives `[t, p]` on the crown.
 * @param {number} steps How many steps.
 * @returns {string} Path data (one subpath per visible run).
 */
function visibleCurve(cam, param, steps) {
	let d = '';
	let open = false;
	for (let i = 0; i <= steps; i++) {
		const [t, p] = param(i);
		const { p: q, nrm } = sample(crownAt, t, p, -1);
		const facing = cam.dir(nrm)[2] > 0.04;
		const v = cam.point(q);
		if (facing) {
			d += `${open ? 'L' : 'M'}${n(v[0])} ${n(v[1])}`;
			open = true;
		} else open = false;
	}
	return d;
}

/**
 * The crown's seams with topstitching either side, and the embroidered eyelets.
 *
 * @param {import('../parts/solid.js').Ortho} cam The camera.
 * @param {string} thread The thread's colour.
 * @returns {string} The markup, in mm.
 */
function panels(cam, thread) {
	let out = '';
	const p0 = 0.05;
	for (let k = 0; k < 6; k++) {
		const t = (k / 6) * Math.PI * 2;
		const line = (off) => visibleCurve(cam, (i) => {
			const p = p0 + (i / 40) * (Math.PI / 2 - p0);
			const r = spread(p);
			return [t + off / (A * Math.max(0.15, r)), p];
		}, 40);
		const d = line(0);
		if (!d) continue;
		out += seam(d, 1.1) + stitches(line(2.4), { color: thread, opacity: 0.75, width: 0.35, stitch: 1.6 }) + stitches(line(-2.4), { color: thread, opacity: 0.75, width: 0.35, stitch: 1.6 });
	}
	// an eyelet high on each panel: a stitched ring round a small hole
	for (let k = 0; k < 6; k++) {
		const t = ((k + 0.5) / 6) * Math.PI * 2;
		const { p, nrm } = sample(crownAt, t, 0.48, -1);
		if (cam.dir(nrm)[2] < 0.15) continue;
		const a = sample(crownAt, t + 0.01, 0.48, -1).p;
		const ux = norm([a[0] - p[0], a[1] - p[1], a[2] - p[2]]);
		const vx = norm([nrm[1] * ux[2] - nrm[2] * ux[1], nrm[2] * ux[0] - nrm[0] * ux[2], nrm[0] * ux[1] - nrm[1] * ux[0]]);
		const ring = (r) =>
			polyPath(
				Array.from({ length: 18 }, (_, i) => {
					const w = (i / 18) * Math.PI * 2;
					return xy(cam.point([p[0] + r * (Math.cos(w) * ux[0] + Math.sin(w) * vx[0]), p[1] + r * (Math.cos(w) * ux[1] + Math.sin(w) * vx[1]), p[2] + r * (Math.cos(w) * ux[2] + Math.sin(w) * vx[2])]));
				}),
			);
		out += el('path', { d: ring(3.2), fill: thread, opacity: 0.9 }) + el('path', { d: ring(1.6), fill: '#000', opacity: 0.75 });
	}
	return out;
}

/**
 * The covered button at the top of the crown.
 *
 * @param {import('../parts/solid.js').Ortho} cam The camera.
 * @param {string} color The cloth's colour.
 * @param {[number, number, number]} light The light's direction in view space.
 * @returns {string} The markup, in mm.
 */
function button(cam, color, light) {
	const top = crownAt(0, 0);
	const rim = Array.from({ length: 24 }, (_, i) => {
		const w = (i / 24) * Math.PI * 2;
		return xy(cam.point([top[0] + 9 * Math.cos(w), top[1] + 1.5, top[2] + 9 * Math.sin(w)]));
	});
	const crown = Array.from({ length: 24 }, (_, i) => {
		const w = (i / 24) * Math.PI * 2;
		return xy(cam.point([top[0] + 7 * Math.cos(w), top[1] + 4.5, top[2] + 7 * Math.sin(w)]));
	});
	const hi = light[0] * 2;
	const [cx, cy] = xy(cam.point([top[0], top[1] + 4.5, top[2]]));
	return (
		el('path', { d: polyPath(rim), fill: mix(color, '#000000', 0.12) }) +
		el('path', { d: polyPath(crown), fill: mix(color, '#ffffff', 0.04) }) +
		el('ellipse', { cx: cx + hi, cy: cy - 0.8, rx: 3.2, ry: 1.4, fill: '#fff', opacity: 0.18 })
	);
}

/**
 * The rows of stitching round the visor, parallel to its edge.
 *
 * @param {import('../parts/solid.js').Ortho} cam The camera.
 * @param {string} thread The thread's colour.
 * @returns {string} The markup, in mm.
 */
function brimStitches(cam, thread) {
	let out = '';
	for (let k = 0; k < 7; k++) {
		const dist = 6 + k * 6.5;
		/** @type {[number, number][]} */
		const pts = [];
		for (let i = 0; i <= 80; i++) {
			const t = -REACH + (i / 80) * 2 * REACH;
			const len = CAP.brim * Math.pow(Math.cos(Math.min(1, Math.abs(t) / REACH) * (Math.PI / 2)), 0.55);
			if (len < dist + 5) continue;
			pts.push(xy(cam.point(brimAt(t, 1 - dist / len))));
		}
		if (pts.length > 2) out += stitches(polyPath(pts, false), { color: thread, opacity: 0.7, width: 0.4, stitch: 1.8 });
	}
	return out;
}

/**
 * The artwork on the front panels: drawn flat, then wrapped onto the crown by a displacement map from the model, embroidered or printed.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The print.
 * @param {import('../types.js').Art} o.art The artwork.
 * @param {{ w: number, h: number }} o.logo Its size on the cap, in mm.
 * @param {import('../parts/solid.js').Ortho} o.cam The camera.
 * @param {string | null} o.ink A colour to stitch a one-colour artwork in.
 * @param {boolean} o.dark Whether the cap is dark.
 * @param {'embroidered' | 'printed'} o.finish How it's applied.
 * @param {number} o.light Where the light is.
 * @param {string} o.fabric The cap's colour.
 * @param {{ ox: number, oy: number, mm: number }} o.to Where the view's origin lands in pixels, and pixels per mm (the print is filtered in pixels, so its edges stay crisp).
 * @returns {string} The markup, in pixels.
 */
function frontPrint(sc, { art, logo, cam, ink, dark, finish, light, fabric, to }) {
	// arc length up the front panel from the base, to place the logo's rows
	const steps = 200;
	const arc = [0];
	let prev = crownAt(0, Math.PI / 2);
	for (let i = 1; i <= steps; i++) {
		const q = crownAt(0, Math.PI / 2 - (i / steps) * (Math.PI / 2));
		arc.push(arc[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]));
		prev = q;
	}
	const pAt = (len) => {
		let i = arc.findIndex((v) => v >= len);
		if (i < 1) i = 1;
		const t = (len - arc[i - 1]) / (arc[i] - arc[i - 1] || 1);
		return Math.PI / 2 - ((i - 1 + t) / steps) * (Math.PI / 2);
	};
	const bottom = 22;
	const surfaceAt = (u, v) => {
		const p = pAt(bottom + (1 - v) * logo.h);
		const r = spread(p);
		return crownAt(((u - 0.5) * logo.w) / (A * r), p);
	};
	/** @type {[number, number][]} */
	const outline = [];
	for (let i = 0; i <= 20; i++) outline.push(xy(cam.point(surfaceAt(i / 20, 0))));
	for (let i = 0; i <= 12; i++) outline.push(xy(cam.point(surfaceAt(1, i / 12))));
	for (let i = 20; i >= 0; i--) outline.push(xy(cam.point(surfaceAt(i / 20, 1))));
	for (let i = 12; i >= 0; i--) outline.push(xy(cam.point(surfaceAt(0, i / 12))));
	const x0 = Math.min(...outline.map((p) => p[0])) - 3;
	const y0 = Math.min(...outline.map((p) => p[1])) - 3;
	const box = { x: x0, y: y0, w: Math.max(...outline.map((p) => p[0])) + 3 - x0, h: Math.max(...outline.map((p) => p[1])) + 3 - y0 };
	const s = splat(box, 0.6);
	for (let i = 0; i <= 320; i++) {
		for (let j = 0; j <= 200; j++) {
			const v = cam.point(surfaceAt(i / 320, j / 200));
			s.put(v[0], v[1], v[2], i / 320, j / 200);
		}
	}
	s.fill();
	const flat = { x: box.x + 3, y: box.y + 3, w: box.w - 6, h: box.h - 6 };
	const warp = warpOf(s, flat);
	// into pixels
	const k = to.mm;
	const px = (b) => ({ x: to.ox + b.x * k, y: to.oy + b.y * k, w: b.w * k, h: b.h * k });
	const B = px(box);
	const F = px(flat);
	const place = sc.image(art, logo.w / logo.h);
	const steps2 = inkSteps({ dark, ink });
	const f = sc.id('capprint');
	const az = Math.round(90 + light * 50);
	const raised =
		finish === 'embroidered'
			? el('feOffset', { dx: 0, dy: 0, result: 'flat' }) +
				el('feGaussianBlur', { in: 'flat', stdDeviation: 0.45 * k, result: 'soft' }) +
				el('feDiffuseLighting', { in: 'soft', surfaceScale: 0.9 * k, diffuseConstant: 1.1, 'lighting-color': '#fff', result: 'lit' }, el('feDistantLight', { azimuth: -az, elevation: 48 })) +
				el('feTurbulence', { type: 'fractalNoise', baseFrequency: `${n(0.12 / k)} ${n(Math.min(0.45, 1.6 / k))}`, numOctaves: 1, seed: 3, result: 'thr' }) +
				el('feComposite', { in: 'flat', in2: 'lit', operator: 'arithmetic', k1: 1.3, k2: 0, k3: 0, k4: 0, result: 'emb' }) +
				el('feComposite', { in: 'emb', in2: 'thr', operator: 'arithmetic', k1: 0.35, k2: 0.8, k3: 0, k4: 0, result: 'sat' }) +
				el('feComposite', { in: 'sat', in2: 'flat', operator: 'in', result: 'top' }) +
				el('feGaussianBlur', { in: 'flat', stdDeviation: 0.5 * k, result: 'sb' }) +
				el('feOffset', { in: 'sb', dx: 0.3 * k, dy: 0.7 * k, result: 'so' }) +
				el('feFlood', { 'flood-color': '#000', 'flood-opacity': 0.45 }) +
				el('feComposite', { in2: 'so', operator: 'in', result: 'drop' }) +
				el('feMerge', {}, el('feMergeNode', { in: 'drop' }), el('feMergeNode', { in: 'top' }))
			: '';
	sc.def(
		el(
			'filter',
			{ id: f, filterUnits: 'userSpaceOnUse', x: B.x - 4 * k, y: B.y - 4 * k, width: B.w + 8 * k, height: B.h + 8 * k, 'color-interpolation-filters': 'sRGB' },
			steps2.before,
			el('feImage', { href: warp.href, x: B.x, y: B.y, width: B.w, height: B.h, preserveAspectRatio: 'none', result: 'map' }),
			el('feDisplacementMap', { in: 'art', in2: 'map', scale: warp.scale * k, xChannelSelector: 'R', yChannelSelector: 'A', result: 'warped' }),
			steps2.after,
			// displacement samples the nearest pixel: a breath of blur takes the stair-steps off the warped edges
			el('feGaussianBlur', { stdDeviation: 0.35 }),
			raised,
		),
	);
	const clip = sc.id('logo');
	sc.def(el('clipPath', { id: clip }, el('path', { d: polyPath(outline.map(([x, y]) => /** @type {[number, number]} */ ([to.ox + x * k, to.oy + y * k]))) })));
	const printed = finish === 'printed' ? { opacity: dark ? 0.93 : 0.96, style: luma(fabric) > 0.72 ? 'mix-blend-mode:multiply' : null } : {};
	return el('g', { 'clip-path': `url(#${clip})` }, el('g', { filter: `url(#${f})`, ...printed }, place(F.x, F.y, F.w, F.h)));
}
