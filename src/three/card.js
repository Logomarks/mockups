/**
 * @module @arraypress/mockups/three/card
 *
 * Business cards in 3D: each card a thin slab of board 85 × 55 mm with
 * (optionally) rounded corners, the front printed on one face and the back
 * on the other, its cut edge plain or painted, lying on a desk drawn by the
 * 2D surfaces, in the 2D mockup's layouts (one card, a pair, a stack with a
 * back beside it, a fan). Soft shadows: the studio's, and the 2D contact
 * shadows under each card on the desk.
 */

import { cardPlacements, CARD } from '../objects/card.js';
import { resolveSurface } from '../materials/desk.js';
import { resolveStock } from '../materials/paper.js';
import { reader } from '../util/reader.js';
import { turnedBox, union } from '../util/fit.js';
import { mix } from '../util/color.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { trimCanvas } from './printart.js';
import { deskCanvas, deskMesh, contactMesh, UNIT } from './deskplane.js';
import { stockMaterial, boardMaterial, toothMap } from './board.js';

/** The layouts a 3D card scene takes. */
export const CARD_SCENE_LAYOUTS = /** @type {const} */ (['flat', 'pair', 'stack', 'fan']);

/**
 * Where each card lies in 3D, back to front, in mm: the 2D layout centred on the origin, each card resting on the one under it.
 *
 * @param {import('./card.js').CardSceneLayout} layout The layout.
 * @param {boolean} twoSided Whether there's a back.
 * @param {number} count How many cards a stack or fan has.
 * @param {string} seed The seed.
 * @param {number} thickness The board's thickness, in mm.
 * @returns {{ cards: import('./card.js').CardPose[], width: number, depth: number }} The cards (centre x, height y, z towards the camera, turn, side, lift), and the layout's width and depth in mm.
 */
export function cardPoses(layout, twoSided, count, seed, thickness) {
	const placed = cardPlacements(layout, twoSided, count, seed);
	const box = union(placed.map((c) => turnedBox(c.x, c.y, CARD.width, CARD.height, c.angle)));
	const cx = (box.x0 + box.x1) / 2;
	const cz = (box.y0 + box.y1) / 2;
	const cards = placed.map((c, i) => ({
		x: c.x - cx,
		z: c.y - cz,
		// a stack piles up by its layers; overlapping cards rest one on the next
		y: (layout === 'stack' ? c.layer : i) * thickness * 1.02,
		angle: c.angle,
		side: c.side,
		lift: c.lift,
	}));
	return { cards, width: box.x1 - box.x0, depth: box.y1 - box.y0 };
}

/**
 * A rounded rectangle as a three.js shape, centred on the origin.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @param {number} r The corners' radius.
 * @returns {import('three').Shape} The shape.
 */
export function roundedShape(THREE, w, h, r) {
	const s = new THREE.Shape();
	const x = -w / 2;
	const y = -h / 2;
	const k = Math.min(Math.max(0, r), w / 2, h / 2);
	s.moveTo(x + k, y);
	s.lineTo(x + w - k, y);
	if (k) s.quadraticCurveTo(x + w, y, x + w, y + k);
	s.lineTo(x + w, y + h - k);
	if (k) s.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
	s.lineTo(x + k, y + h);
	if (k) s.quadraticCurveTo(x, y + h, x, y + h - k);
	s.lineTo(x, y + k);
	if (k) s.quadraticCurveTo(x, y, x + k, y);
	return s;
}

/**
 * A face of a shape with UVs spanning its box (u across, v up), so a print fills it.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('three').Shape} shape The shape.
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @returns {import('three').ShapeGeometry} The face, in the xy plane facing +z.
 */
function face(THREE, shape, w, h) {
	const g = new THREE.ShapeGeometry(shape, 8);
	const p = g.attributes.position;
	const uv = g.attributes.uv;
	for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
	return g;
}

/**
 * One card: the edge an extruded slab, the faces printed, lying flat with its top up.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {object} o The card, in scene units.
 * @param {number} o.w Its width.
 * @param {number} o.h Its height (depth on the desk).
 * @param {number} o.t Its thickness.
 * @param {number} o.r Its corners' radius.
 * @param {import('three').Material} o.top The face up.
 * @param {import('three').Material} o.bottom The face down.
 * @param {import('three').Material} o.edge The cut edge.
 * @returns {import('three').Group} The card, its underside at y = 0.
 */
export function cardMesh(THREE, { w, h, t, r, top, bottom, edge }) {
	const shape = roundedShape(THREE, w, h, r);
	const hidden = new THREE.MeshBasicMaterial({ visible: false });
	const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 8 }), [hidden, edge]);
	const up = new THREE.Mesh(face(THREE, shape, w, h), top);
	up.position.z = t + 1e-5;
	const down = new THREE.Mesh(face(THREE, shape, w, h), bottom);
	down.rotation.y = Math.PI;
	down.position.z = -1e-5;
	const inner = new THREE.Group();
	inner.add(slab, up, down);
	inner.rotation.x = -Math.PI / 2;
	for (const m of [slab, up, down]) {
		m.castShadow = true;
		m.receiveShadow = true;
	}
	const g = new THREE.Group();
	g.add(inner);
	return g;
}

/**
 * Business cards in 3D on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./card.js').CardSceneOptions} options The front (and back), inline, and how to show them.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function cardScene(canvas, options) {
	const o = reader('cardScene', options);
	const { art, back } = /** @type {import('./card.js').CardSceneOptions} */ (options);
	const layout = o.oneOf('layout', back ? 'pair' : 'flat', CARD_SCENE_LAYOUTS);
	const edge = o.color('edge', null);
	const thickness = o.num('thickness', edge ? 1 : 0.45, 0.1, 3);
	const radius = o.num('radius', 0, 0, 10);
	const bleed = o.num('bleed', 0, 0, 10);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const count = Math.round(o.num('count', layout === 'fan' ? 5 : 10, 2, 40));
	const seed = o.text('seed', 'card');
	const stock = resolveStock(/** @type {import('../materials/paper.js').StockName} */ (o.raw('stock') ?? 'matte'), 'cardScene');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'concrete');
	const { cards, width, depth } = cardPoses(layout, !!back, count, seed, thickness);
	const desk = await deskCanvas(surf, { span: Math.max(width, depth) * 3.2, light, seed });
	const shot = shotOf(o, { ground: desk.color, light, layout: 'flat', fit: layout === 'flat' ? 0.62 : 0.8, view: { tilt: 0, turn: 0 } });

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const tex = async (a) => {
			const t = keep(new THREE.CanvasTexture(await trimCanvas(a, { trim: [CARD.width, CARD.height], bleed })));
			t.colorSpace = THREE.SRGBColorSpace;
			t.anisotropy = 8;
			return t;
		};
		const tooth = keep(toothMap(THREE, seed));
		tooth.repeat.set(2.2, 1.4);
		const front = keep(stockMaterial(THREE, stock, await tex(art), tooth));
		const rear = back ? keep(stockMaterial(THREE, stock, await tex(back), tooth)) : keep(stockMaterial(THREE, stock, null, tooth));
		const rim = keep(boardMaterial(THREE, edge ?? mix(stock.color, '#000000', 0.06)));
		const u = 1 / UNIT;
		scene.add(deskMesh(THREE, desk, surf.texture));
		for (const c of cards) {
			const m = cardMesh(THREE, {
				w: CARD.width * u,
				h: CARD.height * u,
				t: thickness * u,
				r: radius * u,
				top: c.side === 'back' ? rear : front,
				bottom: c.side === 'back' ? front : rear,
				edge: rim,
			});
			m.position.set(c.x * u, c.y * u + 0.0008, c.z * u);
			m.rotation.y = (-c.angle * Math.PI) / 180;
			scene.add(m);
		}
		// the 2D contact shadows on the desk (a stack's upper cards shadow only the cards under them)
		const feet = cards.filter((c, i) => layout !== 'stack' || c.y === 0 || i === cards.length - 1).map((c) => ({ x: c.x, z: c.z, w: CARD.width, d: CARD.height, angle: c.angle, radius, lift: c.lift + 0.15 }));
		scene.add(await contactMesh(THREE, { feet, light, strength: strength * surf.shadow * 1.35 }));
		return { width: width * u, height: depth * u, center: [0, 0, 0] };
	});
}
