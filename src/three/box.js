/**
 * @module @arraypress/mockups/three/box
 *
 * Packaging boxes in 3D, built from slabs of board: a corrugated mailer
 * (a tray with a lid hinged along its back edge and a tuck flap that drops
 * inside the front wall; its cut edges show the flutes) and a rigid
 * shoebox-style box (a base and a deeper-skirted lid, wrapped, so its edges
 * are the paper's colour), the lid closed or lifted. The art is printed on
 * the lid; a second artwork can go on the front. Sizes are real: a mailer
 * of 250 × 180 × 80 mm and a lid box of 320 × 200 × 110 mm.
 */

import { resolveSurface } from '../materials/desk.js';
import { reader } from '../util/reader.js';
import { clamp } from '../util/num.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { panelCanvas, artAspect } from './printart.js';
import { deskCanvas, deskMesh, contactMesh, UNIT } from './deskplane.js';
import { boardMaterial, fluteMap, toothMap, shadeMap } from './board.js';

/** The kinds of box. */
export const BOX_KINDS = /** @type {const} */ (['mailer', 'lid']);

/** Each kind's size in mm (width, depth, height), its board's thickness, and a lid box's skirt. */
export const BOXES = Object.freeze({
	mailer: Object.freeze({ width: 250, depth: 180, height: 80, board: 3, skirt: 0 }),
	lid: Object.freeze({ width: 320, depth: 200, height: 110, board: 2.5, skirt: 40 }),
});

/** A flute's pitch along a corrugated edge, in mm (B-flute: about 6.5 mm a flute; the tile has four). */
const FLUTE_TILE = 26;

/**
 * Where the lid is for an amount of opening.
 *
 * @param {'mailer' | 'lid'} kind The box.
 * @param {number} open How open, 0 (closed) to 1.
 * @returns {{ hinge: number, lift: number, tilt: number, slide: number }} A mailer's lid angle (degrees about its back edge); a lid box's lid raised (mm), tilted towards the camera (degrees) and slid back (mm).
 */
export function lidPose(kind, open) {
	const k = clamp(open, 0, 1);
	if (kind === 'mailer') return { hinge: 112 * k, lift: 0, tilt: 0, slide: 0 };
	return { hinge: 0, lift: 150 * k, tilt: 14 * k, slide: 30 * k };
}

/**
 * The extent of the box and its lid, for framing.
 *
 * @param {'mailer' | 'lid'} kind The box.
 * @param {number} open How open, 0–1.
 * @returns {{ width: number, height: number, centerY: number }} The width and height to frame, and the height of their middle, in mm.
 */
export function boxExtent(kind, open) {
	const b = BOXES[kind];
	const p = lidPose(kind, open);
	const top = kind === 'mailer' ? b.height + Math.sin((p.hinge * Math.PI) / 180) * b.depth : b.height + b.board + p.lift + Math.sin((p.tilt * Math.PI) / 180) * b.depth * 0.5;
	return { width: Math.hypot(b.width, b.depth) * 1.05, height: top + b.depth * 0.45, centerY: top / 2 };
}

/**
 * Corrugated edges' UVs in mm-sized tiles: along a face's longer side and across its shorter, so the flutes keep their pitch on every edge.
 *
 * @param {import('three').BoxGeometry} geo The slab.
 * @param {number[]} faces Which of its six faces (+x, -x, +y, -y, +z, -z) are cut edges.
 * @param {number} tile The tile's length along the edge, in scene units.
 */
function edgeUVs(geo, faces, tile) {
	const p = geo.attributes.position;
	const uv = geo.attributes.uv;
	const { width, height, depth } = geo.parameters;
	const ext = [width, height, depth];
	for (const f of faces) {
		const normal = Math.floor(f / 2) === 0 ? 0 : Math.floor(f / 2) === 1 ? 1 : 2;
		const axes = [0, 1, 2].filter((a) => a !== normal);
		const [long, short] = ext[axes[0]] >= ext[axes[1]] ? axes : [axes[1], axes[0]];
		for (let i = f * 4; i < f * 4 + 4; i++) {
			const c = [p.getX(i), p.getY(i), p.getZ(i)];
			uv.setXY(i, (c[long] + ext[long] / 2) / tile, (c[short] + ext[short] / 2) / ext[short]);
		}
	}
}

/**
 * A slab of board with a material per face.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {[number, number, number]} size Its width, height and depth.
 * @param {[number, number, number]} at Its centre.
 * @param {import('three').Material[]} mats Its faces' materials: +x, -x, +y, -y, +z, -z.
 * @param {{ edges: number[], tile: number } | null} [flutes] Faces to map as corrugated edges.
 * @returns {import('three').Mesh} The slab.
 */
function slab(THREE, size, at, mats, flutes = null) {
	const geo = new THREE.BoxGeometry(...size);
	if (flutes) edgeUVs(geo, flutes.edges, flutes.tile);
	const m = new THREE.Mesh(geo, mats);
	m.position.set(...at);
	m.castShadow = true;
	m.receiveShadow = true;
	return m;
}

/**
 * A box in 3D on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./box.js').BoxSceneOptions} options The lid's art (inline), and how to show it.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function boxScene(canvas, options) {
	const o = reader('boxScene', options);
	const { art, side } = /** @type {import('./box.js').BoxSceneOptions} */ (options);
	const kind = o.oneOf('kind', 'mailer', BOX_KINDS);
	const open = o.num('open', 0, 0, 1);
	const color = o.color('color', '#f3f1ec');
	const inside = o.color('inside', kind === 'mailer' ? '#c7a274' : '#f3f1ec');
	const print = o.oneOf('print', 'cover', /** @type {const} */ (['cover', 'logo']));
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const seed = o.text('seed', 'box');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'light');
	const desk = surf.texture ? await deskCanvas(surf, { span: 1400, light, seed }) : null;
	const ext = boxExtent(kind, open);
	const shot = shotOf(o, { ground: desk?.color ?? surf.color, light, layout: 'upright', fit: 0.74, view: { tilt: 26, turn: -32 } });
	const b = BOXES[kind];
	const u = 1 / UNIT;
	const [W, D, H, t] = [b.width * u, b.depth * u, b.height * u, b.board * u];
	const lidSize = /** @type {[number, number]} */ (kind === 'mailer' ? [b.width, b.depth] : [b.width + 2 * b.board + 2, b.depth + 2 * b.board + 2]);
	const aspect = print === 'logo' ? await artAspect(art) : 1;
	const sideAspect = side && print === 'logo' ? await artAspect(side) : 1;

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const tex = (c) => {
			const tx = keep(new THREE.CanvasTexture(c));
			tx.colorSpace = THREE.SRGBColorSpace;
			tx.anisotropy = 8;
			return tx;
		};
		const top = tex(await panelCanvas(art, { size: lidSize, color, fit: print, aspect }));
		const front = side
			? tex(await panelCanvas(side, { size: kind === 'mailer' ? [b.width, b.height - b.board] : [lidSize[0], b.skirt], color, fit: print, aspect: sideAspect, scale: 0.7 }))
			: null;
		// the paper's tooth over every face, a tile every 40 mm
		const tooth = keep(toothMap(THREE, seed));
		tooth.repeat.set(b.width / 40, b.depth / 40);
		const board = (c, map = null) => {
			const m = keep(boardMaterial(THREE, c, map));
			m.bumpMap = tooth;
			m.bumpScale = 0.35;
			return m;
		};
		// the plain faces carry baked occlusion: inside, shadow gathers in the corners and where walls meet the floor; outside, a little at the foot
		const shaded = (c, ao) => {
			const m = board(c, keep(ao));
			m.color.set(c);
			return m;
		};
		const outer = shaded(color, shadeMap(THREE, { bottom: 0.16, sides: 0.05, reach: 0.12 }));
		const inner = shaded(inside, shadeMap(THREE, { sides: 0.42, bottom: 0.5, top: 0.12, reach: 0.18 }));
		const lidTop = board(color, top);
		const frontFace = front ? board(color, front) : outer;
		// a mailer's cut edges show the flutes; a rigid box is wrapped, so its edges are its paper
		const edge = kind === 'mailer' ? keep(boardMaterial(THREE, '#ffffff', keep(fluteMap(THREE, color, inside)))) : outer;
		const ft = FLUTE_TILE * u;
		const E = edge;
		const box = new THREE.Group();
		const pose = lidPose(kind, open);

		if (kind === 'mailer') {
			const h = H - t;
			box.add(
				slab(THREE, [W - 2 * t, t, D - 2 * t], [0, t / 2, 0], [E, E, inner, outer, E, E], { edges: [0, 1, 4, 5], tile: ft }),
				slab(THREE, [W, h, t], [0, h / 2, D / 2 - t / 2], [E, E, E, E, frontFace, inner], { edges: [0, 1, 2, 3], tile: ft }),
				slab(THREE, [W, h, t], [0, h / 2, -D / 2 + t / 2], [E, E, E, E, inner, outer], { edges: [0, 1, 2, 3], tile: ft }),
				slab(THREE, [t, h, D - 2 * t], [-W / 2 + t / 2, h / 2, 0], [inner, outer, E, E, E, E], { edges: [2, 3, 4, 5], tile: ft }),
				slab(THREE, [t, h, D - 2 * t], [W / 2 - t / 2, h / 2, 0], [outer, inner, E, E, E, E], { edges: [2, 3, 4, 5], tile: ft }),
			);
			// the lid turns about the back wall's top edge; its tuck flap drops inside the front wall
			const lid = new THREE.Group();
			lid.position.set(0, h, -D / 2);
			const fh = h - 2 * t - 0.08;
			lid.add(
				slab(THREE, [W, t, D], [0, t / 2, D / 2], [E, E, lidTop, inner, E, E], { edges: [0, 1, 4, 5], tile: ft }),
				slab(THREE, [W - 2 * t - 0.03, fh, t], [0, -fh / 2, D - 1.5 * t - 0.01], [E, E, E, E, outer, inner], { edges: [0, 1, 2, 3], tile: ft }),
			);
			lid.rotation.x = (-pose.hinge * Math.PI) / 180;
			box.add(lid);
		} else {
			const s = b.skirt * u;
			const c = t + 0.01; // the lid's clearance round the base
			box.add(
				slab(THREE, [W - 2 * t, t, D - 2 * t], [0, t / 2, 0], [E, E, inner, outer, E, E]),
				slab(THREE, [W, H, t], [0, H / 2, D / 2 - t / 2], [E, E, inner, E, outer, inner]),
				slab(THREE, [W, H, t], [0, H / 2, -D / 2 + t / 2], [E, E, inner, E, inner, outer]),
				slab(THREE, [t, H, D - 2 * t], [-W / 2 + t / 2, H / 2, 0], [inner, outer, inner, E, E, E]),
				slab(THREE, [t, H, D - 2 * t], [W / 2 - t / 2, H / 2, 0], [outer, inner, inner, E, E, E]),
			);
			const lw = W + 2 * c;
			const ld = D + 2 * c;
			const lid = new THREE.Group();
			lid.add(
				slab(THREE, [lw, t, ld], [0, s - t / 2, 0], [E, E, lidTop, inner, E, E]),
				slab(THREE, [lw, s - t, t], [0, (s - t) / 2, ld / 2 - t / 2], [E, E, E, E, frontFace, inner]),
				slab(THREE, [lw, s - t, t], [0, (s - t) / 2, -ld / 2 + t / 2], [E, E, E, E, inner, outer]),
				slab(THREE, [t, s - t, ld - 2 * t], [-lw / 2 + t / 2, (s - t) / 2, 0], [inner, outer, E, E, E, E]),
				slab(THREE, [t, s - t, ld - 2 * t], [lw / 2 - t / 2, (s - t) / 2, 0], [outer, inner, E, E, E, E]),
			);
			// closed, the lid's top rests on the base's walls; lifted, it rises, slides back and tips towards the camera
			lid.position.set(0, H + t - s + pose.lift * u, -pose.slide * u);
			lid.rotation.x = (pose.tilt * Math.PI) / 180;
			box.add(lid);
		}
		scene.add(box);
		if (desk) scene.add(deskMesh(THREE, desk, surf.texture));
		scene.add(await contactMesh(THREE, { feet: [{ x: 0, z: 0, w: b.width, d: b.depth, lift: 0.1 }], light, strength: strength * surf.shadow * 1.4 }));
		return { width: ext.width * u, height: ext.height * u, center: [0, ext.centerY * u, 0] };
	});
}
