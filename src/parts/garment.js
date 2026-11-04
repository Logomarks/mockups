/**
 * @module @arraypress/mockups/parts/garment
 *
 * A piece of cloth lying flat, built up the way a photo of one reads: its
 * soft shadow on the surface, the dyed cloth, the print warped by the folds
 * and settled into the fibres, seams and trims, the fabric's texture over
 * everything, the folds' light and shade, and the edges rolling down to the
 * surface. Shapes are drawn in millimetres (smooth outlines through a few
 * points, so a garment is a short list of its real measurements); the
 * textures and maps are laid in pixels over the same box.
 */

import { el } from '../render/svg.js';
import { weave, inkSteps } from '../materials/fabric.js';
import { shadeMap, warpMap } from '../materials/folds.js';
import { clamp, n } from '../util/num.js';
import { luma } from '../util/color.js';

/**
 * A smooth closed outline through points (Catmull-Rom as cubic Béziers); a point marked as a corner keeps its corner.
 *
 * @param {import('./garment.js').OutlinePoint[]} pts The points, in mm: `[x, y]`, or `[x, y, true]` for a corner.
 * @param {boolean} [closed=true] Whether it closes.
 * @returns {{ d: string, poly: [number, number][] }} Path data, and the outline sampled as a polygon.
 */
export function smooth(pts, closed = true) {
	const k = pts.length;
	const at = (i) => (closed ? pts[(i + k) % k] : pts[clamp(i, 0, k - 1)]);
	let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
	/** @type {[number, number][]} */
	const poly = [];
	for (let i = 0; i < (closed ? k : k - 1); i++) {
		const p0 = at(i - 1);
		const p1 = at(i);
		const p2 = at(i + 1);
		const p3 = at(i + 2);
		const t1 = p1[2] || (!closed && i === 0) ? [0, 0] : [(p2[0] - p0[0]) / 6, (p2[1] - p0[1]) / 6];
		const t2 = p2[2] || (!closed && i === k - 2) ? [0, 0] : [(p3[0] - p1[0]) / 6, (p3[1] - p1[1]) / 6];
		const c1 = [p1[0] + t1[0], p1[1] + t1[1]];
		const c2 = [p2[0] - t2[0], p2[1] - t2[1]];
		d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
		for (let s = 0; s < 8; s++) {
			const t = s / 8;
			const u = 1 - t;
			poly.push([u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0], u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]]);
		}
	}
	return { d: closed ? d + 'Z' : d, poly };
}

/**
 * A row of stitches along a path, in mm.
 *
 * @param {string} d The path.
 * @param {{ color?: string, opacity?: number, width?: number, stitch?: number }} [o] The thread's colour and opacity, its width, a stitch's length.
 * @returns {string} The markup.
 */
export function stitches(d, { color = '#000', opacity = 0.3, width = 0.5, stitch = 2.6 } = {}) {
	return el('path', { d, fill: 'none', stroke: color, 'stroke-opacity': opacity, 'stroke-width': width, 'stroke-dasharray': `${n(stitch)} ${n(stitch * 0.45)}`, 'stroke-linecap': 'round' });
}

/**
 * A seam along a path, in mm: the slight hollow where two pieces of cloth are sewn, a dark line with a lit lip beside it.
 *
 * @param {string} d The path.
 * @param {number} [depth=1] How deep it reads.
 * @returns {string} The markup.
 */
export function seam(d, depth = 1) {
	return (
		el('path', { d, fill: 'none', stroke: '#000', 'stroke-opacity': 0.2 * depth, 'stroke-width': 1.4 }) +
		el('path', { d, fill: 'none', stroke: '#000', 'stroke-opacity': 0.22 * depth, 'stroke-width': 0.5 }) +
		el('path', { d, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.12 * depth, 'stroke-width': 0.8, transform: 'translate(0 1.1)' })
	);
}

/**
 * Rib knit along a path, in mm (a collar, a cuff, a hem band): the band in the cloth's colour, crossed by fine ribs.
 *
 * @param {string} d The band's centre line.
 * @param {number} width The band's width.
 * @param {string} color The cloth's colour.
 * @param {number} [pitch=1.4] The ribs' spacing.
 * @returns {string} The markup.
 */
export function rib(d, width, color, pitch = 1.4) {
	const band = { d, fill: 'none', 'stroke-width': width, 'stroke-linejoin': 'round' };
	return (
		el('path', { ...band, stroke: color }) +
		el('path', { ...band, stroke: '#000', 'stroke-opacity': 0.14, 'stroke-dasharray': `${n(pitch * 0.45)} ${n(pitch * 0.55)}` }) +
		el('path', { ...band, stroke: '#fff', 'stroke-opacity': 0.06, 'stroke-dasharray': `${n(pitch * 0.3)} ${n(pitch * 0.7)}`, 'stroke-dashoffset': -pitch * 0.55 })
	);
}

/**
 * A garment lying flat, with its shadow.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('./garment.js').GarmentPart} o The garment.
 * @returns {string} The markup.
 */
export function garment(sc, o) {
	const { mm, origin, outline, cloth, color, dark, kind, light, seed } = o;
	const [ox, oy] = origin;
	const T = `translate(${n(ox)} ${n(oy)}) scale(${n(mm)})`;
	const px = (x, y) => [ox + x * mm, oy + y * mm];
	const b = cloth.box;
	const [bx, by] = px(b.x0, b.y0);
	const box = { x: bx, y: by, w: (b.x1 - b.x0) * mm, h: (b.y1 - b.y0) * mm };
	const clip = sc.id('cloth');
	sc.def(el('clipPath', { id: clip }, el('path', { d: outline.d, transform: T })));
	const clipped = (...inner) => el('g', { 'clip-path': `url(#${clip})` }, ...inner);

	// the shadow: cloth lies close, so a tight dark line and a soft wide falloff
	const away = -clamp(light, -1, 1);
	const k = clamp(o.shadow ?? 1, 0, 3);
	const shade = (dx, dy, sigma, alpha) =>
		el('path', { d: outline.d, transform: `translate(${n(ox + dx * away * mm)} ${n(oy + dy * mm)}) scale(${n(mm)})`, fill: '#000', opacity: clamp(alpha * k), filter: sc.blur(sigma) });
	const shadow = k > 0 ? shade(0.5, 0.9, 1, 0.42) + shade(2.5, 4, 5, 0.22) + shade(7, 12, 18, 0.09) : '';

	let print = '';
	const warp = warpMap(cloth);
	// water-based ink soaks into a pale cloth (the weave shows through it); on anything deeper it's a plastisol layer on top
	const soak = luma(color) > 0.72;
	for (const p of o.prints ?? []) {
		const [x, y] = px(p.rect.x, p.rect.y);
		const place = sc.image(p.art, p.rect.w / p.rect.h);
		const f = sc.id('print');
		const steps = inkSteps({ dark, ink: p.ink ?? null });
		sc.def(
			el(
				'filter',
				{ id: f, filterUnits: 'userSpaceOnUse', x: box.x, y: box.y, width: box.w, height: box.h, 'color-interpolation-filters': 'sRGB' },
				steps.before,
				el('feImage', { href: warp.href, x: box.x, y: box.y, width: box.w, height: box.h, preserveAspectRatio: 'none', result: 'map' }),
				el('feDisplacementMap', { in: 'art', in2: 'map', scale: 2 * (o.warp ?? 5) * mm, xChannelSelector: 'R', yChannelSelector: 'A', result: 'warped' }),
				steps.after,
			),
		);
		print += el('g', { filter: `url(#${f})`, opacity: dark ? 0.94 : 0.97, style: soak ? 'mix-blend-mode:multiply' : null }, place(x, y, p.rect.w * mm, p.rect.h * mm));
	}

	const relief = o.relief ?? {};
	return (
		shadow +
		el('path', { d: outline.d, transform: T, fill: color }) +
		(o.under ? el('g', { transform: T }, o.under) : '') +
		clipped(
			print,
			o.over ? el('g', { transform: T }, o.over) : '',
			weave(sc, { kind, mm, dark, seed, box, heather: o.heather }),
			el('image', { x: box.x, y: box.y, width: box.w, height: box.h, href: shadeMap(cloth, light, { dark: dark ? 0.45 : 0.35, bright: dark ? 0.16 : 0.25, ...relief }), preserveAspectRatio: 'none' }),
			// the edge rolling down to the surface
			el('path', { d: outline.d, transform: T, fill: 'none', stroke: '#000', 'stroke-opacity': dark ? 0.28 : 0.14, 'stroke-width': 2.4, filter: sc.blur(0.9) }),
		) +
		(o.top ? el('g', { transform: T }, o.top) : '')
	);
}
