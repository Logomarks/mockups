/**
 * @module @arraypress/mockups/three/mug
 *
 * A ceramic 11 oz mug in 3D: 82 mm across and 95 mm tall, turned on a
 * lathe (a footed base, a straight wall, a rounded rim, an inner wall and
 * floor), with a looped handle, all in a glossy glaze. The print is a decal
 * round the wall: a piece centred on the front (or on both sides), or a
 * wrap that runs round the mug and meets at the handle, as sublimation
 * prints are made. One mug, or a pair with the second turned to show its
 * back.
 */

import { scene as doc } from '../render/scene.js';
import { el } from '../render/svg.js';
import { resolveSurface } from '../materials/desk.js';
import { reader } from '../util/reader.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { drawSvg, artAspect } from './printart.js';
import { deskCanvas, deskMesh, contactMesh, UNIT } from './deskplane.js';
import { studioEnvironment } from './studioenv.js';

/** An 11 oz mug, in mm: its outer radius, height, the printed band's bottom and top, and its wall's thickness. */
export const MUG = Object.freeze({ radius: 41, height: 95, band: Object.freeze([4, 92.5]), wall: 3.4 });

/** How a print sits on the mug. */
export const MUG_PRINTS = /** @type {const} */ (['auto', 'front', 'both', 'wrap']);

/**
 * How a print sits, from its proportions: wide art wraps, anything else is a piece on the front.
 *
 * @param {import('./mug.js').MugPrint} print The option.
 * @param {number} aspect The art's width over its height.
 * @returns {'front' | 'both' | 'wrap'} The print.
 */
export function printMode(print, aspect) {
	if (print !== 'auto') return print;
	return aspect >= 1.8 ? 'wrap' : 'front';
}

/**
 * Where the art goes on the printed band, in mm from the band's left edge (the back of the mug, opposite the front) and top. The front of the mug is the band's middle.
 *
 * @param {'front' | 'both' | 'wrap'} mode The print.
 * @param {number} aspect The art's width over its height.
 * @param {'left' | 'right'} handle Which side the handle is on, seen from the front.
 * @returns {{ x: number, y: number, w: number, h: number }[]} The art's boxes on the band.
 */
export function decalBoxes(mode, aspect, handle) {
	const C = 2 * Math.PI * MUG.radius;
	const H = MUG.band[1] - MUG.band[0];
	if (mode === 'wrap') {
		// round the mug from handle to handle, leaving a gap under it
		const maxW = C - 34;
		const h = Math.min(H - 8, maxW / aspect);
		const w = h * aspect;
		const centre = handle === 'right' ? C * 0.25 : C * 0.75;
		return [{ x: centre - w / 2, y: (H - h) / 2, w, h }];
	}
	const h = Math.min(H - 12, 92 / aspect);
	const w = h * aspect;
	const piece = (cx) => ({ x: cx - w / 2, y: (H - h) / 2, w, h });
	return mode === 'both' ? [piece(C / 2), piece(0)] : [piece(C / 2)];
}

/**
 * The printed band as a canvas: the glaze's colour, the art laid on it.
 *
 * @param {import('../types.js').Art} art The art (inline).
 * @param {{ mode: 'front' | 'both' | 'wrap', aspect: number, handle: 'left' | 'right', color: string, px?: number }} o The print, the art's proportions, the handle's side, the mug's colour, and pixels per mm (8).
 * @returns {Promise<HTMLCanvasElement>} The canvas: u round the mug from the back, v down the band.
 */
export async function decalCanvas(art, { mode, aspect, handle, color, px = 8 }) {
	const C = 2 * Math.PI * MUG.radius;
	const H = MUG.band[1] - MUG.band[0];
	const w = Math.round(C * px);
	const h = Math.round(H * px);
	const sc = doc({ width: w, height: h, key: 'mug' });
	const place = sc.image(art, aspect);
	sc.add(el('rect', { width: w, height: h, fill: color }));
	for (const b of decalBoxes(mode, aspect, handle)) {
		sc.add(place(b.x * px, b.y * px, b.w * px, b.h * px));
		// a wrap crossing the seam carries on from the other edge
		if (b.x < 0) sc.add(place((b.x + C) * px, b.y * px, b.w * px, b.h * px));
		if (b.x + b.w > C) sc.add(place((b.x - C) * px, b.y * px, b.w * px, b.h * px));
	}
	return drawSvg(sc.svg(), w, h);
}

/**
 * A lathe profile in mm, as three.js points in scene units.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {[number, number][]} pts The profile: radius and height.
 * @returns {import('three').Vector2[]} The points.
 */
const profile = (THREE, pts) => pts.map(([r, y]) => new THREE.Vector2(r / UNIT, y / UNIT));

/**
 * One mug: its base, printed wall, rim and inside, and handle.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {{ glaze: import('three').Material, inner: import('three').Material, printed: import('three').Material, handle: 'left' | 'right' }} o The materials and the handle's side.
 * @returns {import('three').Group} The mug, standing on y = 0, its front towards +z.
 */
export function mugMesh(THREE, { glaze, inner, printed, handle }) {
	const R = MUG.radius;
	const [b0, b1] = MUG.band;
	const ri = R - MUG.wall;
	const seg = 128;
	// u = 0.5 at the front (+z): the lathe starts at the back
	const lathe = (pts, mat) => new THREE.Mesh(new THREE.LatheGeometry(profile(THREE, pts), seg, -Math.PI, Math.PI * 2), mat);
	const base = lathe(
		[
			[0, 1.8],
			[32, 1.8],
			[34.5, 0.6],
			[37, 0],
			[39.6, 0.5],
			[40.7, 1.9],
			[R, b0],
		],
		glaze,
	);
	const wall = lathe(
		[
			[R, b0],
			[R, b1],
		],
		printed,
	);
	const rim = lathe(
		[
			[R, b1],
			[R - 0.1, 93.8],
			[R - 0.7, 94.7],
			[R - 1.7, 95],
			[ri + 0.6, 94.7],
			[ri, 93.6],
			[ri, 12],
			[ri - 0.5, 9.4],
			[ri - 2, 7.9],
			[ri - 4.5, 7.3],
			[0, 7.2],
		],
		inner,
	);
	const s = handle === 'right' ? 1 : -1;
	const path = new THREE.CatmullRomCurve3(
		[
			[38.5, 79],
			[55, 80.5],
			[65.5, 70],
			[67, 47],
			[59, 28],
			[38.5, 21],
		].map(([x, y]) => new THREE.Vector3((s * x) / UNIT, y / UNIT, 0)),
	);
	const loop = new THREE.Mesh(new THREE.TubeGeometry(path, 96, 5.3 / UNIT, 20, false), glaze);
	// a handle is flattened: wider front to back than across
	loop.scale.z = 1.35;
	const mug = new THREE.Group();
	for (const m of [base, wall, rim, loop]) {
		m.castShadow = true;
		m.receiveShadow = true;
		mug.add(m);
	}
	return mug;
}

/**
 * A glaze: glossy ceramic, clearcoated, reflecting the room.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {string} color Its colour.
 * @param {import('three').Texture | null} [map] A print on it.
 * @returns {import('three').MeshPhysicalMaterial} The material.
 */
export function glazeMaterial(THREE, color, map = null) {
	return new THREE.MeshPhysicalMaterial({
		color: map ? '#ffffff' : color,
		map,
		roughness: 0.16,
		clearcoat: 1,
		clearcoatRoughness: 0.05,
		specularIntensity: 0.7,
		envMapIntensity: 1,
		side: THREE.DoubleSide,
	});
}

/**
 * A mug in 3D on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./mug.js').MugSceneOptions} options The print (inline) and how to show it.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function mugScene(canvas, options) {
	const o = reader('mugScene', options);
	const { art } = /** @type {import('./mug.js').MugSceneOptions} */ (options);
	const print = o.oneOf('print', 'auto', MUG_PRINTS);
	const layout = o.oneOf('layout', 'single', /** @type {const} */ (['single', 'pair']));
	const handle = o.oneOf('handle', 'right', /** @type {const} */ (['left', 'right']));
	const color = o.color('color', '#f6f5f1');
	const inside = o.color('inside', color);
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const seed = o.text('seed', 'mug');
	const spin = o.num('spin', 0, -360, 360);
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'light');
	const desk = surf.texture ? await deskCanvas(surf, { span: 900, light, seed }) : null;
	const shot = shotOf(o, { ground: desk?.color ?? surf.color, light, layout: 'upright', fit: layout === 'pair' ? 0.84 : 0.66, view: { tilt: 9, turn: 0 } });
	const aspect = await artAspect(art);
	const mode = printMode(print, aspect);
	const pair = layout === 'pair';
	// a pair: the first shows its front, the second, set a little back, its back and handle
	const mugs = pair
		? [
				{ x: -60, z: -26, turn: 180 },
				{ x: 60, z: 10, turn: 0 },
			]
		: [{ x: 0, z: 0, turn: 0 }];
	/** @type {import('three').Group[]} */
	const turned = [];
	// the mugs turn with the camera, so the print keeps facing it (and the handle stays to the side); `spin` turns them on
	let turn = shot.view?.turn ?? 0;
	const face = () => turned.forEach((g, i) => (g.rotation.y = ((mugs[i].turn + turn + spin) * Math.PI) / 180));

	const s = await shoot(canvas, shot, async (THREE, scene, keep) => {
		// a studio for the glaze to reflect: long soft highlights down the wall
		scene.environment = keep(studioEnvironment(THREE, { light }));
		scene.environmentIntensity = 1.5;
		const map = keep(new THREE.CanvasTexture(await decalCanvas(art, { mode, aspect, handle, color })));
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = 8;
		const glaze = keep(glazeMaterial(THREE, color));
		const inner = keep(glazeMaterial(THREE, inside));
		const printed = keep(glazeMaterial(THREE, color, map));
		for (const m of mugs) {
			const mug = mugMesh(THREE, { glaze, inner, printed, handle });
			mug.position.set(m.x / UNIT, 0, m.z / UNIT);
			turned.push(mug);
			scene.add(mug);
		}
		face();
		if (desk) scene.add(deskMesh(THREE, desk, surf.texture));
		const d = 2 * MUG.radius;
		scene.add(await contactMesh(THREE, { feet: mugs.map((m) => ({ x: m.x, z: m.z, w: d - 4, d: d - 4, radius: d / 2, lift: 0.05 })), light, strength: strength * surf.shadow * 1.1 }));
		return { width: (pair ? 270 : 120) / UNIT, height: MUG.height / UNIT, center: [pair ? 0 : 6 / UNIT, (MUG.height * 0.48) / UNIT, 0] };
	});
	return {
		...s,
		setView(next) {
			if (next.turn !== undefined) turn = next.turn;
			face();
			s.setView(next);
		},
	};
}
