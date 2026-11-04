/**
 * @module @arraypress/mockups/parts/hand
 *
 * A hand holding something flat (a card, a ticket) by its lower edge, seen
 * from the front: the thumb lies on the face, its tip flattened where it
 * presses and its nail towards the camera; the index and middle fingers
 * curl round behind, overlapping, and run into the palm, which goes down
 * out of the frame. Drawn in millimetres round the grip point.
 *
 * It's shaded as one form, not as outlined parts: the palm and fingers are
 * a height field (each finger a flattened, tapering round, the palm a low
 * dome) lit by `materials/skin.js`, so a finger tucked under another falls
 * into soft occlusion and every edge is only the form turning away. The
 * held thing shades the fingers close behind it; the thumb casts a contact
 * shadow on its face; the whole hand, well above the surface, casts a
 * large soft shadow below.
 *
 * Three layers, drawn round the held thing: `shadow` (on the surface),
 * `under` (palm and fingers, behind it), `over` (the thumb, in front).
 */

import { el } from '../render/svg.js';
import { smooth, tube } from './curve.js';
import { skinLayers } from '../materials/skin.js';
import { field, blur } from '../util/field.js';
import { clamp, n } from '../util/num.js';

/** The hand's parts in mm round the grip point (0, 0) on the held thing's lower edge (it lies above, at negative y), for a right hand. */
const PARTS = Object.freeze({
	palm: /** @type {[number, number][]} */ ([
		[-20, 48],
		[-14, 30],
		[-6, 22],
		[5, 18],
		[20, 17],
		[40, 30],
		[54, 60],
		[62, 108],
		[66, 178],
		[-8, 178],
		[-16, 132],
		[-24, 94],
		[-28, 66],
	]),
	// back to front: the middle finger tucked behind the index, both curling up behind the held thing; z lifts a finger over the one behind it
	fingers: /** @type {{ spine: [number, number][], widths: number[], z: number }[]} */ ([
		{ spine: [[18, 88], [1, 78], [-17, 66], [-29, 49], [-33, 30], [-33, 8], [-32, -6]], widths: [20, 19, 18.2, 17.4, 16.8, 16.2, 16], z: 0 },
		{ spine: [[20, 60], [4, 48], [-11, 37], [-21, 22], [-25, 5], [-25, -10]], widths: [21, 20, 19, 18, 17.2, 16.5], z: 4 },
	]),
	thumb: { spine: /** @type {[number, number][]} */ ([[38, 66], [30, 42], [23, 23], [16, 6], [10, -7]]), widths: [28, 25, 22, 20, 18.5] },
});

/** The height field's cell, in mm. */
const CELL = 0.8;

/**
 * A hand.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./hand.js').HandPart} o Where it grips, how it's turned, its size, side and skin, and the light.
 * @returns {{ shadow: string, under: string, over: string }} The layers.
 */
export function hand(sc, { x, y, angle = 0, mm, side = 'right', skin, light, shadow = 1, lift = 3 }) {
	const s = side === 'left' ? -1 : 1;
	const frame = `translate(${n(x)} ${n(y)}) rotate(${n(angle)}) scale(${n(mm * s)} ${n(mm)})`;
	// the light in the hand's own frame: turned back by its angle, mirrored for a left hand
	const a = (-angle * Math.PI) / 180;
	const L = [clamp(light, -1, 1) * 0.7, -1];
	const lx = (L[0] * Math.cos(a) - L[1] * Math.sin(a)) * s;
	const ly = L[0] * Math.sin(a) + L[1] * Math.cos(a);
	const lit = { x: lx / Math.hypot(lx, ly), y: ly / Math.hypot(lx, ly) };
	const away = -clamp(light, -1, 1);

	const palm = smooth(PARTS.palm);
	const fingers = PARTS.fingers.map((f) => tube(f.spine, f.widths));
	const thumb = tube(PARTS.thumb.spine, PARTS.thumb.widths);

	// on the surface: the hand is well above it, so its shadow is large, soft and pale
	const cast = (off, sigma, alpha) =>
		el(
			'g',
			{ transform: `translate(${n(x + away * off * 0.6 * mm)} ${n(y + off * mm)}) rotate(${n(angle)}) scale(${n(mm * s)} ${n(mm)})`, opacity: clamp(alpha * shadow), filter: sc.blur(sigma) },
			el('path', { d: palm + fingers.join('') + thumb, fill: '#000' }),
		);
	const shadowLayer = shadow > 0 ? cast(lift * 2.2, 5 + lift * 2.4, 0.13) + cast(lift * 5.5, 12 + lift * 4, 0.11) : '';

	const underBox = boxOf([...PARTS.palm, ...PARTS.fingers.flatMap((f) => f.spine)], 12);
	const under = el(
		'g',
		{ transform: frame },
		skinLayers(sc, {
			shapes: [palm, ...fingers],
			field: heights(underBox, (px, py) => {
				// each finger blends into the palm, but where one lies over another it stays its own form, with a crease between
				const palmH = dome(px, py);
				return Math.max(...PARTS.fingers.map((f) => smax(palmH, finger(px, py, f.spine, f.widths, f.z, 0), 4)));
			}),
			box: underBox,
			skin,
			lit,
			extra: PARTS.fingers.map((f) => creases(sc, f.spine, f.widths, skin, [0.42, 0.7])).join(''),
		}),
		// the held thing shades the fingers just behind it, deepest where they're closest
		edgeShadow(sc, [palm, ...fingers]),
	);

	const thumbBox = boxOf(PARTS.thumb.spine, 16);
	const above = sc.id('above');
	sc.def(el('clipPath', { id: above }, el('rect', { x: -300, y: -300, width: 600, height: 300 })));
	const over = el(
		'g',
		{ transform: frame },
		// the thumb's shadow on the face it presses: a tight contact line round the flattened tip, and a softer fall; only on the held thing
		el(
			'g',
			{ 'clip-path': `url(#${above})` },
			el('path', { d: thumb, fill: '#000', opacity: 0.24 * shadow, transform: `translate(${n(away * 1.4 * s)} 2.4)`, filter: sc.blur(2.4) }),
			el('path', { d: thumb, fill: '#000', opacity: 0.42 * shadow, transform: `translate(${n(away * 0.25 * s)} 0.45)`, filter: sc.blur(0.55) }),
		),
		// the thumb's base melts into the palm under it
		el(
			'g',
			{ mask: fadeBase(sc, PARTS.thumb.spine, thumbBox) },
			skinLayers(sc, {
				shapes: [thumb],
				field: heights(thumbBox, (px, py) => finger(px, py, PARTS.thumb.spine, PARTS.thumb.widths, 0, 11)),
				box: thumbBox,
				skin,
				lit,
				extra: creases(sc, PARTS.thumb.spine, PARTS.thumb.widths, skin, [0.5]),
			}),
		),
		nail(sc, PARTS.thumb.spine, PARTS.thumb.widths, skin, lit),
	);
	return { shadow: shadowLayer, under, over };
}

/**
 * A mask that fades a spine's first 34 mm, so a thumb's base melts into the palm.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {[number, number][]} spine The spine.
 * @param {{ x: number, y: number, w: number, h: number }} box The area to cover, mm.
 * @returns {string} The mask, as `url(#…)`.
 */
function fadeBase(sc, spine, box) {
	const [b0, b1] = spine;
	const l = Math.hypot(b1[0] - b0[0], b1[1] - b0[1]) || 1;
	const fade = sc.id('fade');
	const ramp = sc.id('ramp');
	sc.def(
		el(
			'linearGradient',
			{ id: ramp, gradientUnits: 'userSpaceOnUse', x1: b0[0], y1: b0[1], x2: b0[0] + ((b1[0] - b0[0]) / l) * 34, y2: b0[1] + ((b1[1] - b0[1]) / l) * 34 },
			el('stop', { offset: 0.2, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 1 }),
		),
	);
	const area = { x: box.x, y: box.y, width: box.w, height: box.h };
	sc.def(el('mask', { id: fade, maskUnits: 'userSpaceOnUse', ...area }, el('rect', { ...area, fill: `url(#${ramp})` })));
	return `url(#${fade})`;
}

/**
 * The box round some points, padded, with the field's cell size.
 *
 * @param {[number, number][]} pts The points, mm.
 * @param {number} pad The padding, mm.
 * @returns {{ x: number, y: number, w: number, h: number, cell: number }} The box's top left, size and cell.
 */
function boxOf(pts, pad) {
	const xs = pts.map((p) => p[0]);
	const ys = pts.map((p) => p[1]);
	const x = Math.min(...xs) - pad;
	const y = Math.min(...ys) - pad;
	return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y, cell: CELL };
}

/**
 * A height field over a box, from a function of a point in mm.
 *
 * @param {{ x: number, y: number, w: number, h: number, cell: number }} box The box.
 * @param {(x: number, y: number) => number} fn The height at a point.
 * @returns {import('../util/field.js').Field} The field.
 */
function heights(box, fn) {
	const f = field(Math.ceil(box.w / box.cell), Math.ceil(box.h / box.cell));
	for (let j = 0; j < f.h; j++) for (let i = 0; i < f.w; i++) f.v[j * f.w + i] = Math.max(0, fn(box.x + i * box.cell, box.y + j * box.cell));
	// soften what's left of the seams, keeping the outside at zero
	const inside = Float32Array.from(f.v, (h) => (h > 0 ? 1 : 0));
	blur(f, 2);
	for (let i = 0; i < f.v.length; i++) f.v[i] *= inside[i];
	return f;
}

/**
 * A smooth maximum: where two forms meet they blend over about `k` mm instead of creasing.
 *
 * @param {number} a One height.
 * @param {number} b The other.
 * @param {number} k How wide the blend is.
 * @returns {number} The blended height.
 */
function smax(a, b, k) {
	if (a <= 0 || b <= 0) return Math.max(a, b);
	const h = clamp(0.5 + (0.5 * (b - a)) / k);
	return a + (b - a) * h + k * h * (1 - h) * 0.5;
}

/** The palm's outline, densely, for its dome (made once). */
const PALM_EDGE = dense(PARTS.palm);

/**
 * The palm's height at a point: a low dome rising from its edge.
 *
 * @param {number} px Across, mm.
 * @param {number} py Down, mm.
 * @returns {number} The height, mm (0 outside it).
 */
function dome(px, py) {
	if (!inside(PALM_EDGE, px, py)) return 0;
	let d = Infinity;
	for (let i = 0, j = PALM_EDGE.length - 1; i < PALM_EDGE.length; j = i++) {
		const [ax, ay] = PALM_EDGE[j];
		const dx = PALM_EDGE[i][0] - ax;
		const dy = PALM_EDGE[i][1] - ay;
		const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1));
		d = Math.min(d, (ax + dx * t - px) ** 2 + (ay + dy * t - py) ** 2);
	}
	return 14 * (1 - Math.exp(-Math.sqrt(d) / 9));
}

/**
 * A finger's height at a point: a flattened round across it, tapering with its width, lifted by `z` over what's behind, and pressed flatter over its last `press` mm.
 *
 * @param {number} px Across, mm.
 * @param {number} py Down, mm.
 * @param {[number, number][]} spine The finger's spine, base to tip.
 * @param {number[]} widths Its widths.
 * @param {number} z How far it sits over what's behind it, mm.
 * @param {number} press How much of its tip is pressed flat, mm (0 for none).
 * @returns {number} The height, mm (0 off it).
 */
function finger(px, py, spine, widths, z, press) {
	let best = Infinity;
	let r = 0;
	let fromTip = 0;
	let fromBase = 0;
	let run = 0;
	const total = spine.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - spine[i - 1][0], p[1] - spine[i - 1][1]) : 0), 0);
	for (let i = 1; i < spine.length; i++) {
		const [ax, ay] = spine[i - 1];
		const dx = spine[i][0] - ax;
		const dy = spine[i][1] - ay;
		const l2 = dx * dx + dy * dy;
		const t = clamp(((px - ax) * dx + (py - ay) * dy) / l2);
		const d = Math.hypot(ax + dx * t - px, ay + dy * t - py);
		const l = Math.sqrt(l2);
		if (d < best) {
			best = d;
			r = ((widths[i - 1] + (widths[i] - widths[i - 1]) * t) / 2) * 1.04;
			fromTip = total - (run + l * t);
			fromBase = run + l * t;
		}
		run += l;
	}
	// past the tip the cap is half a round: measure from the end
	const end = spine[spine.length - 1];
	const prev = spine[spine.length - 2];
	const ux = end[0] - prev[0];
	const uy = end[1] - prev[1];
	if ((px - end[0]) * ux + (py - end[1]) * uy > 0) fromTip = 0;
	if (best >= r) return 0;
	const round = Math.sqrt(1 - (best / r) ** 2);
	const pressed = press > 0 ? 0.68 + 0.32 * Math.min(1, fromTip / press) : 1;
	// its root rises out of the palm rather than sitting on it
	const root = clamp(fromBase / 20);
	const rise = root * root * (3 - 2 * root);
	// a little flatter than round across, as a finger is
	return (round * r * 0.72 * pressed + z * round * round * (3 - 2 * round)) * (press > 0 ? 1 : rise);
}

/**
 * A closed smooth outline's points, densely (Catmull-Rom, eight per span).
 *
 * @param {[number, number][]} pts The outline's points.
 * @returns {[number, number][]} Points along the curve.
 */
function dense(pts) {
	const k = pts.length;
	/** @type {[number, number][]} */
	const out = [];
	for (let i = 0; i < k; i++) {
		const [p0, p1, p2, p3] = [-1, 0, 1, 2].map((o) => pts[(i + o + k) % k]);
		for (let t = 0; t < 1; t += 0.125) {
			const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
			out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
		}
	}
	return out;
}

/**
 * Whether a point is inside a polygon (even-odd).
 *
 * @param {[number, number][]} poly The polygon.
 * @param {number} x Across.
 * @param {number} y Down.
 * @returns {boolean} Whether it's inside.
 */
function inside(poly, x, y) {
	let c = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i];
		const [xj, yj] = poly[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
	}
	return c;
}

/**
 * Faint creases across a finger at its joints: a few short soft arcs each, the way knuckle skin folds.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {[number, number][]} sp The spine.
 * @param {number[]} widths Its widths.
 * @param {import('../materials/skin.js').Skin} skin The skin.
 * @param {number[]} at Where the joints are, as fractions of the length.
 * @returns {string} The markup.
 */
function creases(sc, sp, widths, skin, at) {
	const total = sp.reduce((s, pt, i) => (i ? s + Math.hypot(pt[0] - sp[i - 1][0], pt[1] - sp[i - 1][1]) : 0), 0);
	let out = '';
	for (const f of at) {
		for (const [shift, span, alpha] of [[-0.9, 0.24, 0.1], [0, 0.32, 0.16], [0.8, 0.2, 0.09]]) {
			const [cx, cy, ux, uy, ww] = along(sp, widths, f * total + shift);
			const k = ww * span;
			out += el('path', {
				d: `M${n(cx - uy * k)} ${n(cy + ux * k)}Q${n(cx + ux * 0.9)} ${n(cy + uy * 0.9)} ${n(cx + uy * k)} ${n(cy - ux * k)}`,
				fill: 'none',
				stroke: skin.crease,
				'stroke-width': 0.35,
				'stroke-linecap': 'round',
				opacity: alpha,
				filter: sc.blur(0.3),
			});
		}
	}
	return out;
}

/**
 * A point along a spine, with its direction and width.
 *
 * @param {[number, number][]} sp The spine.
 * @param {number[]} widths Its widths.
 * @param {number} dist How far along, in mm.
 * @returns {[number, number, number, number, number]} The point, the unit direction there, and the width.
 */
function along(sp, widths, dist) {
	let left = Math.max(0, dist);
	for (let i = 1; i < sp.length; i++) {
		const dx = sp[i][0] - sp[i - 1][0];
		const dy = sp[i][1] - sp[i - 1][1];
		const l = Math.hypot(dx, dy);
		if (left <= l || i === sp.length - 1) {
			const t = clamp(left / l);
			return [sp[i - 1][0] + dx * t, sp[i - 1][1] + dy * t, dx / l, dy / l, widths[i - 1] + (widths[i] - widths[i - 1]) * t];
		}
		left -= l;
	}
	return [sp[0][0], sp[0][1], 0, -1, widths[0]];
}

/**
 * The thumbnail, matte satin: a rounded plate paler and pinker than the skin, a pale lunula at its base, the cuticle's fold over it, a paler free edge at the tip, and a broad faint sheen.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {[number, number][]} sp The thumb's spine.
 * @param {number[]} widths Its widths.
 * @param {import('../materials/skin.js').Skin} skin The skin.
 * @param {{ x: number, y: number }} lit The direction to the light.
 * @returns {string} The markup.
 */
function nail(sc, sp, widths, skin, lit) {
	const k = sp.length;
	const tip = sp[k - 1];
	const prev = sp[k - 2];
	const l = Math.hypot(tip[0] - prev[0], tip[1] - prev[1]);
	const ux = (tip[0] - prev[0]) / l;
	const uy = (tip[1] - prev[1]) / l;
	const w = widths[k - 1] * 0.55;
	const len = w * 1.08;
	const end = [tip[0] + ux * widths[k - 1] * 0.38, tip[1] + uy * widths[k - 1] * 0.38];
	const base = [end[0] - ux * len, end[1] - uy * len];
	const at = (p, t, u = 0) => /** @type {[number, number]} */ ([p[0] - uy * t + ux * u, p[1] + ux * t + uy * u]);
	const mid = [base[0] + ux * len * 0.55, base[1] + uy * len * 0.55];
	const d = smooth([at(base, w * 0.4), at(mid, w * 0.5), at(end, w * 0.38), end, at(end, -w * 0.38), at(mid, -w * 0.5), at(base, -w * 0.4), at(base, 0, -w * 0.1)]);
	const clip = sc.id('nail');
	sc.def(el('clipPath', { id: clip }, el('path', { d })));
	const g = sc.id('nailsheen');
	sc.def(
		el(
			'linearGradient',
			{ id: g, gradientUnits: 'userSpaceOnUse', x1: mid[0] + lit.x * w * 0.6, y1: mid[1] + lit.y * w * 0.6, x2: mid[0] - lit.x * w * 0.6, y2: mid[1] - lit.y * w * 0.6 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.16 }),
			el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0.04 }),
			el('stop', { offset: 1, 'stop-color': skin.shade, 'stop-opacity': 0.14 }),
		),
	);
	const cuticle = `M${n(at(base, w * 0.46)[0])} ${n(at(base, w * 0.46)[1])}Q${n(base[0] - ux * w * 0.22)} ${n(base[1] - uy * w * 0.22)} ${n(at(base, -w * 0.46)[0])} ${n(at(base, -w * 0.46)[1])}`;
	const lunula = smooth([at(base, w * 0.3, w * 0.02), at(base, 0, w * 0.26), at(base, -w * 0.3, w * 0.02), at(base, 0, -w * 0.04)]);
	const free = `M${n(at(end, w * 0.34, -0.9)[0])} ${n(at(end, w * 0.34, -0.9)[1])}Q${n(end[0] - ux * 2)} ${n(end[1] - uy * 2)} ${n(at(end, -w * 0.34, -0.9)[0])} ${n(at(end, -w * 0.34, -0.9)[1])}`;
	return el(
		'g',
		{ filter: sc.blur(0.12) },
		el('path', { d, fill: skin.nail, opacity: 0.5 }),
		el(
			'g',
			{ 'clip-path': `url(#${clip})` },
			el('path', { d: lunula, fill: '#fff', opacity: 0.16, filter: sc.blur(0.5) }),
			el('path', { d: free, fill: 'none', stroke: '#fff', 'stroke-width': 1.6, opacity: 0.22, filter: sc.blur(0.5) }),
			el('path', { d, fill: `url(#${g})` }),
			el('path', { d, fill: 'none', stroke: skin.shade, 'stroke-width': 1.2, opacity: 0.14, filter: sc.blur(0.6) }),
		),
		// the cuticle: skin folding over the nail's base, a soft shadow under it and a lit lip above
		el('path', { d: cuticle, fill: 'none', stroke: skin.crease, 'stroke-width': 0.5, opacity: 0.24, filter: sc.blur(0.25) }),
		el('path', { d: cuticle, fill: 'none', stroke: skin.light, 'stroke-width': 0.5, opacity: 0.3, transform: `translate(${n(-ux * 0.6)} ${n(-uy * 0.6)})`, filter: sc.blur(0.3) }),
	);
}

/**
 * The held thing's shadow on the fingers just behind it, below its edge (y = 0): deepest at the edge, fading over a couple of centimetres.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {string[]} ds The outlines of the parts below the edge.
 * @returns {string} The markup.
 */
function edgeShadow(sc, ds) {
	const cut = sc.id('under');
	const area = { x: -80, y: -2, width: 200, height: 30 };
	sc.def(el('mask', { id: cut, maskUnits: 'userSpaceOnUse', ...area }, ...ds.map((d) => el('path', { d, fill: '#fff' }))));
	const g = sc.id('edgefade');
	sc.def(
		el(
			'linearGradient',
			{ id: g, x1: 0, y1: 0, x2: 0, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#1a0804', 'stop-opacity': 0.5 }),
			el('stop', { offset: 0.12, 'stop-color': '#1a0804', 'stop-opacity': 0.3 }),
			el('stop', { offset: 0.45, 'stop-color': '#1a0804', 'stop-opacity': 0.1 }),
			el('stop', { offset: 1, 'stop-color': '#1a0804', 'stop-opacity': 0 }),
		),
	);
	return el('g', { mask: `url(#${cut})` }, el('rect', { ...area, fill: `url(#${g})` }));
}
