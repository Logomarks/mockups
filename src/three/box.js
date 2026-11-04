/**
 * @module @arraypress/mockups/three/box
 *
 * Packaging boxes in 3D, built from slabs of board: a corrugated mailer
 * (a tray with a lid hinged along its back edge and a tuck flap that drops
 * inside the front wall; its cut edges show the flutes) and a rigid
 * shoebox-style box (a base and a deeper-skirted lid, wrapped, so its edges
 * are the paper's colour), the lid closed or lifted. The art is printed on
 * the lid; a second artwork can go on the front, fitted to it (whole and
 * centred on a shallow skirt). Every flat face is board baked at its real
 * size (the kraft photograph, or the board's colour with its grain; ink in
 * the fibres; occlusion in the corners; folds), matte with the grain's
 * relief. Sizes are real: a mailer of 250 × 180 × 80 mm and a lid box of
 * 320 × 200 × 110 mm. `board`, `lining` and `open` mean what they do in the
 * 2D `box`.
 */

import { resolveSurface } from '../materials/desk.js';
import { resolveBoard, liningFor, FIBRE_LOOKS } from '../materials/board.js';
import { lidPose } from '../parts/lid.js';
import { faceFit } from '../parts/print.js';
import { reader } from '../util/reader.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { panelCanvas, artAspect } from './printart.js';
import { deskCanvas, deskMesh, contactMesh, UNIT } from './deskplane.js';
import { boardMaterial, fluteMap, boardKit, bakeBoard, bakedMaterial } from './board.js';

export { lidPose };

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
	const board = resolveBoard(/** @type {import('../materials/board.js').BoardOption} */ (o.raw('board')), 'boxScene');
	const lining = o.color('lining', liningFor(board, kind));
	const liningKraft = lining === liningFor(board, kind) && (board.name === 'kraft' || (board.name === 'white' && kind === 'mailer'));
	const outKraft = board.name === 'kraft';
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
	const frontSize = /** @type {[number, number]} */ (kind === 'mailer' ? [b.width, b.height - b.board] : [lidSize[0], b.skirt]);
	const aspect = print === 'logo' ? await artAspect(art) : 1;
	const sideAspect = side ? await artAspect(side) : 1;
	// a side print fills the front when it suits it, otherwise it sits whole in the middle
	const sideFit = print === 'logo' ? 'logo' : faceFit(sideAspect, frontSize[0] / frontSize[1]);
	const topPrint = await panelCanvas(art, { size: lidSize, color: null, fit: print, aspect });
	const frontPrint = side ? await panelCanvas(side, { size: frontSize, color: null, fit: sideFit, aspect: sideAspect, scale: 0.7 }) : null;

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const kit = await boardKit(THREE, outKraft ? FIBRE_LOOKS.kraft : board.look, seed, outKraft ? 2.2 : board.look === FIBRE_LOOKS.white ? 1.1 : 1.6);
		keep(kit.normal);
		keep(kit.rough);
		/** @type {Map<string, import('three').Material>} */
		const made = new Map();
		let n = 0;
		/**
		 * A face of board, baked at its size (faces alike share one).
		 *
		 * @param {'out' | 'in'} side Outside (the board) or inside (the lining).
		 * @param {[number, number]} size Its size, mm.
		 * @param {Omit<import('./board.js').BakeOptions, 'size' | 'color' | 'kraft' | 'seed'>} [extra] Its print, occlusion and folds.
		 * @returns {import('three').Material} The material.
		 */
		const face = (side, size, extra = {}) => {
			const key = `${side}:${size.map(Math.round).join('x')}:${JSON.stringify(extra.ao ?? null)}:${JSON.stringify(extra.folds ?? null)}:${extra.print ? n : ''}`;
			let m = made.get(key);
			if (!m) {
				const color = side === 'in' ? lining : board.color;
				const baked = bakeBoard(kit, { size, color, kraft: side === 'in' ? liningKraft : outKraft, seed: `${seed}:${n++}`, ...extra });
				m = keep(bakedMaterial(THREE, kit, baked, size, color));
				made.set(key, m);
			}
			return m;
		};
		const AO_IN = { sides: 0.42, bottom: 0.5, top: 0.12, reach: 0.18 };
		const AO_FLOOR = { sides: 0.42, bottom: 0.42, top: 0.42, reach: 0.18 };
		const AO_OUT = { bottom: 0.16, sides: 0.05, reach: 0.12 };
		const wallH = kind === 'mailer' ? b.height - b.board : b.height;
		// a mailer's side print is on its front wall; a lid box's is on its lid's skirt
		const outFront = face('out', [b.width, wallH], { print: kind === 'mailer' ? frontPrint : null, ao: AO_OUT, folds: kind === 'mailer' ? { top: 0.14 } : {} });
		const outBack = face('out', [b.width, wallH], { ao: AO_OUT });
		const outSide = face('out', [b.depth, wallH], { ao: AO_OUT });
		const inWall = face('in', [b.width, wallH], { ao: AO_IN });
		const inSide = face('in', [b.depth, wallH], { ao: AO_IN });
		const inFloor = face('in', [b.width, b.depth], { ao: AO_FLOOR });
		const under = face('out', [b.width, b.depth]);
		const lidTop = face('out', lidSize, { print: topPrint, folds: kind === 'mailer' ? { top: 0.12, bottom: 0.1 } : {} });
		const lidIn = face('in', lidSize, { ao: { sides: 0.12, bottom: 0.12, top: 0.12, reach: 0.12 } });
		// a mailer's cut edges show the flutes; a rigid box is wrapped, so its edges are its paper
		const edge = kind === 'mailer' ? keep(boardMaterial(THREE, '#ffffff', keep(fluteMap(THREE, board.color, lining)))) : outBack;
		const ft = FLUTE_TILE * u;
		const E = edge;
		const box = new THREE.Group();
		const pose = lidPose(kind, open);

		if (kind === 'mailer') {
			const h = H - t;
			const fh = h - 2 * t - 0.08;
			const flapOut = face('out', [b.width - 2 * b.board, fh / u]);
			const flapIn = face('in', [b.width - 2 * b.board, fh / u]);
			box.add(
				slab(THREE, [W - 2 * t, t, D - 2 * t], [0, t / 2, 0], [E, E, inFloor, under, E, E], { edges: [0, 1, 4, 5], tile: ft }),
				slab(THREE, [W, h, t], [0, h / 2, D / 2 - t / 2], [E, E, E, E, outFront, inWall], { edges: [0, 1, 2, 3], tile: ft }),
				slab(THREE, [W, h, t], [0, h / 2, -D / 2 + t / 2], [E, E, E, E, inWall, outBack], { edges: [0, 1, 2, 3], tile: ft }),
				slab(THREE, [t, h, D - 2 * t], [-W / 2 + t / 2, h / 2, 0], [inSide, outSide, E, E, E, E], { edges: [2, 3, 4, 5], tile: ft }),
				slab(THREE, [t, h, D - 2 * t], [W / 2 - t / 2, h / 2, 0], [outSide, inSide, E, E, E, E], { edges: [2, 3, 4, 5], tile: ft }),
			);
			// the lid turns about the back wall's top edge; its tuck flap drops inside the front wall
			const lid = new THREE.Group();
			lid.position.set(0, h, -D / 2);
			lid.add(
				slab(THREE, [W, t, D], [0, t / 2, D / 2], [E, E, lidTop, lidIn, E, E], { edges: [0, 1, 4, 5], tile: ft }),
				slab(THREE, [W - 2 * t - 0.03, fh, t], [0, -fh / 2, D - 1.5 * t - 0.01], [E, E, E, E, flapOut, flapIn], { edges: [0, 1, 2, 3], tile: ft }),
			);
			lid.rotation.x = (-pose.hinge * Math.PI) / 180;
			box.add(lid);
		} else {
			const s = b.skirt * u;
			const c = t + 0.01; // the lid's clearance round the base
			const skirtOut = face('out', [lidSize[0], b.skirt], { print: frontPrint });
			const skirtPlain = face('out', [lidSize[0], b.skirt]);
			const skirtSide = face('out', [lidSize[1], b.skirt]);
			const skirtIn = face('in', [lidSize[0], b.skirt]);
			const rim = face('in', [b.width, b.board * 4]);
			box.add(
				slab(THREE, [W - 2 * t, t, D - 2 * t], [0, t / 2, 0], [E, E, inFloor, under, E, E]),
				slab(THREE, [W, H, t], [0, H / 2, D / 2 - t / 2], [E, E, rim, E, outFront, inWall]),
				slab(THREE, [W, H, t], [0, H / 2, -D / 2 + t / 2], [E, E, rim, E, inWall, outBack]),
				slab(THREE, [t, H, D - 2 * t], [-W / 2 + t / 2, H / 2, 0], [inSide, outSide, rim, E, E, E]),
				slab(THREE, [t, H, D - 2 * t], [W / 2 - t / 2, H / 2, 0], [outSide, inSide, rim, E, E, E]),
			);
			const lw = W + 2 * c;
			const ld = D + 2 * c;
			const lid = new THREE.Group();
			lid.add(
				slab(THREE, [lw, t, ld], [0, s - t / 2, 0], [E, E, lidTop, lidIn, E, E]),
				slab(THREE, [lw, s - t, t], [0, (s - t) / 2, ld / 2 - t / 2], [E, E, E, E, frontPrint ? skirtOut : skirtPlain, skirtIn]),
				slab(THREE, [lw, s - t, t], [0, (s - t) / 2, -ld / 2 + t / 2], [E, E, E, E, skirtIn, skirtPlain]),
				slab(THREE, [t, s - t, ld - 2 * t], [-lw / 2 + t / 2, (s - t) / 2, 0], [skirtIn, skirtSide, E, E, E, E]),
				slab(THREE, [t, s - t, ld - 2 * t], [lw / 2 - t / 2, (s - t) / 2, 0], [skirtSide, skirtIn, E, E, E, E]),
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
