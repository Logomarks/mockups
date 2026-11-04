/**
 * @module @arraypress/mockups/parts/pavement
 *
 * Level ground in perspective: a pavement of square slabs (the joints
 * projected line by line, fading with distance), a kerb, and the road
 * beyond it, each lit by a soft falloff. The grid is what makes a street
 * read as receding; the kerb and road set the scale.
 */

import { el } from '../render/svg.js';
import { polyPath, clipRect } from '../util/shape.js';
import { clipNear } from '../util/camera.js';
import { mix } from '../util/color.js';
import { clamp } from '../util/num.js';

/**
 * A rectangle of ground, cut to what's in front of the camera, in pixels.
 *
 * @param {import('../util/camera.js').View} view The view.
 * @param {number} x0 Its left edge (world x).
 * @param {number} x1 Its right edge.
 * @param {number} z0 Its back edge (world z).
 * @param {number} z1 Its front edge.
 * @param {number} [y=0] Its height.
 * @returns {import('../util/shape.js').Vec2[]} The outline.
 */
export const patch = (view, x0, x1, z0, z1, y = 0) => frameClip(view, clipNear(view, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], 0.4).map((p) => view.at(p)));

/**
 * Points in pixels, clipped to the frame (with a margin), so nothing far off it is drawn.
 *
 * @param {import('../util/camera.js').View} view The view.
 * @param {import('../util/shape.js').Vec2[]} pts The polygon.
 * @returns {import('../util/shape.js').Vec2[]} The part on (or near) the frame.
 */
const frameClip = (view, pts) => clipRect(pts, -view.width * 0.1, -view.height * 0.1, view.width * 1.1, view.height * 1.1);

/**
 * A street: pavement, kerb and road.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('../util/camera.js').View} view The view.
 * @param {object} o The street.
 * @param {[number, number]} o.x How far it runs, left and right (world x).
 * @param {number} o.back Where the pavement starts (world z: the building line).
 * @param {number} o.kerb Where the kerb is (world z).
 * @param {number} [o.slab=0.6] A paving slab's side.
 * @param {string} [o.paving='#b9b5ad'] The paving's colour.
 * @param {string} [o.road='#4a4b4f'] The road's colour.
 * @param {number} [o.light=0.3] Where the light is, left (-1) to right (1).
 * @returns {string} The markup.
 */
export function street(sc, view, { x, back, kerb, slab = 0.6, paving = '#b9b5ad', road = '#4a4b4f', light = 0.3 }) {
	const [x0, x1] = x;
	const kh = 0.13;
	const far = kerb + 40;
	const ids = { pave: sc.id('pave'), road: sc.id('road') };
	const yTop = view.at([0, 0, back])[1];
	const yBot = view.height;
	sc.def(el('linearGradient', { id: ids.pave, gradientUnits: 'userSpaceOnUse', x1: 0, y1: yTop, x2: 0, y2: yBot }, el('stop', { offset: 0, 'stop-color': mix(paving, '#000', 0.12) }), el('stop', { offset: 1, 'stop-color': mix(paving, '#fff', 0.06) })));
	sc.def(el('linearGradient', { id: ids.road, gradientUnits: 'userSpaceOnUse', x1: 0, y1: view.at([0, 0, kerb])[1], x2: 0, y2: yBot }, el('stop', { offset: 0, 'stop-color': mix(road, '#000', 0.1) }), el('stop', { offset: 1, 'stop-color': mix(road, '#fff', 0.05) })));
	const roadPoly = patch(view, x0, x1, kerb, far);
	const pave = patch(view, x0, x1, back, kerb, kh);
	const kerbFace = frameClip(view, clipNear(view, [[x0, kh, kerb], [x1, kh, kerb], [x1, 0, kerb], [x0, 0, kerb]], 0.4).map((p) => view.at(p)));
	// the joints: lines each way, fading with distance
	let joints = '';
	const line = (a, b) => {
		const seg = clipNear(view, [a, b, b], 0.4);
		if (seg.length < 2) return;
		const cut = clipRect([view.at(seg[0]), view.at(seg[1]), view.at(seg[1])], 0, 0, view.width, view.height);
		if (cut.length < 2) return;
		const [p, q] = [cut[0], cut[1]];
		const d = (view.depth(a) + view.depth(b)) / 2;
		joints += el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], 'stroke-opacity': clamp(0.5 - d * 0.012, 0.06, 0.45) });
	};
	for (let z = back + slab; z < kerb - 0.05; z += slab) line([x0, kh, z], [x1, kh, z]);
	for (let xx = Math.ceil(x0 / slab) * slab; xx <= x1; xx += slab) line([xx, kh, back], [xx, kh, kerb]);
	const lw = Math.max(0.6, view.width / 1600);
	return el(
		'g',
		{},
		roadPoly.length > 2 && el('path', { d: polyPath(roadPoly), fill: `url(#${ids.road})` }),
		pave.length > 2 && el('path', { d: polyPath(pave), fill: `url(#${ids.pave})` }),
		el('g', { stroke: mix(paving, '#000', 0.45), 'stroke-width': lw }, joints),
		kerbFace.length > 2 && el('path', { d: polyPath(kerbFace), fill: mix(paving, '#000', 0.25 - light * 0.05) }),
		kerbFace.length > 2 && el('path', { d: polyPath(patch(view, x0, x1, kerb - 0.15, kerb, kh)), fill: mix(paving, '#fff', 0.12) }),
	);
}
