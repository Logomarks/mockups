/**
 * @module @logomarks/mockups/three/binder
 *
 * Binders standing in a row on a paper sweep, as a brand book is shot:
 * three or four board binders side by side, their spines towards the
 * camera's side and the front one's cover to it, under a hard key light
 * that throws one crisp shadow across the floor. Each spine carries the
 * name running down it with the mark at its foot; the cover carries the
 * mark, a title, a grid of dots and the name set large. The board is
 * matte with its tooth, its edges softly rounded; the top shows the
 * covers' edges and the pages between them.
 */

import { reader } from '../util/reader.js';
import { brandOf } from '../util/brand.js';
import { mix } from '../util/color.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg } from './printart.js';
import { coverSvg, spineSvg } from '../parts/cover.js';
import { UNIT, contactMesh } from './deskplane.js';
import { toothMap } from './board.js';

/** A binder, in mm: its cover's width and height, and its thickness (the spine's width). */
export const BINDER = Object.freeze({ width: 235, height: 315, thickness: 46, board: 3, radius: 2.5 });

/**
 * Where each binder stands: in a row through their thickness, a hair apart, centred on the origin.
 *
 * @param {number} count How many.
 * @param {number} [gap=2] The gap between them, mm.
 * @returns {number[]} Each one's centre along the row (z, towards the camera), mm, back to front.
 */
export function binderRow(count, gap = 2) {
	const pitch = BINDER.thickness + gap;
	return Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * pitch);
}

/**
 * The top (or bottom) of a binder: the two covers' edges along its sides, the spine's along its back, and the pages set in between.
 *
 * @param {string} color The board's colour.
 * @param {number} [px=6] Pixels per mm.
 * @returns {string} The SVG, width (the binder's) by thickness.
 */
export function edgeSvg(color, px = 6) {
	const { width: W, thickness: T, board: b } = BINDER;
	const k = (v) => v * px;
	const pages = '#efece4';
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${k(W)}" height="${k(T)}">` +
		`<rect width="${k(W)}" height="${k(T)}" fill="${mix(color, '#000000', 0.55)}"/>` +
		`<rect x="${k(b + 1.5)}" y="${k(b + 1)}" width="${k(W - b - 5)}" height="${k(T - 2 * b - 2)}" fill="${pages}"/>` +
		Array.from({ length: 14 }, (_, i) => `<rect x="${k(b + 1.5)}" y="${k(b + 1 + ((T - 2 * b - 2) * (i + 0.5)) / 14)}" width="${k(W - b - 5)}" height="${k(0.25)}" fill="#000" opacity="0.08"/>`).join('') +
		`<rect width="${k(W)}" height="${k(b)}" fill="${color}"/><rect y="${k(T - b)}" width="${k(W)}" height="${k(b)}" fill="${color}"/><rect width="${k(b)}" height="${k(T)}" fill="${color}"/>` +
		`</svg>`
	);
}

/**
 * Binders in a row, in 3D on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./binder.js').BinderSceneOptions} options The mark (inline), the brand, and how to show them.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function binderScene(canvas, options) {
	const o = reader('binderScene', options);
	const brand = brandOf(o, { color: '#e2552c' });
	const count = Math.round(o.num('count', 4, 1, 6));
	const title = o.text('title', '');
	const ground = o.color('ground', '#bfcdd6');
	const light = o.num('light', 0.6, -1, 1);
	const seed = o.text('seed', 'binder');
	const B = BINDER;
	const px = 5;
	const shot = { ...shotOf(o, { ground, light, layout: 'upright', fit: 0.7, view: { tilt: 5, turn: -38, fov: 26 } }), lens: lensOf(o, { aperture: 0.006, blur: 0.3 }) };
	const covers = await Promise.all(Array.from({ length: count }, (_, i) => drawSvg(coverSvg(brand, { size: [B.width, B.height], title, volume: i + 1, px }), B.width * px, B.height * px)));
	const spines = await Promise.all(Array.from({ length: count }, (_, i) => drawSvg(spineSvg(brand, { size: [B.thickness, B.height], title, volume: i + 1, px: px * 2 }), B.thickness * px * 2, B.height * px * 2)));
	const edge = await drawSvg(edgeSvg(brand.color, px), B.width * px, B.thickness * px);

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
		const u = 1 / UNIT;
		const tex = (c) => {
			const t = keep(new THREE.CanvasTexture(c));
			t.colorSpace = THREE.SRGBColorSpace;
			t.anisotropy = 8;
			return t;
		};
		const tooth = keep(toothMap(THREE, seed));
		tooth.repeat.set(6, 8);
		// matte board: its tooth in the bump, a faint sheen at grazing angles
		const board = (map) => keep(new THREE.MeshPhysicalMaterial({ map, roughness: 0.78, bumpMap: tooth, bumpScale: 0.6, sheen: 0.3, sheenRoughness: 0.7, sheenColor: '#ffffff', envMapIntensity: 0.5 }));
		const plain = board(null);
		plain.color.set(brand.color);
		const top = board(tex(edge));
		const geo = keep(new RoundedBoxGeometry(B.width * u, B.height * u, B.thickness * u, 4, B.radius * u));
		binderRow(count).forEach((z, i) => {
			// faces: +x the fore-edge, −x the spine, +y the top, −y the bottom, +z the front cover, −z the back
			const mesh = new THREE.Mesh(geo, [top, board(tex(spines[i])), top, plain, board(tex(covers[i])), plain]);
			mesh.position.set(0, (B.height / 2) * u, z * u);
			mesh.castShadow = mesh.receiveShadow = true;
			scene.add(mesh);
		});
		// the key: hard and low from the front's side, one crisp shadow across the floor
		scene.traverse((l) => {
			if (l instanceof THREE.DirectionalLight) {
				l.position.set(4.4 * Math.sign(light || 1), 5.6, 1.4);
				l.intensity = 1.6;
				l.shadow.mapSize.set(4096, 4096);
				l.shadow.radius = 1.5;
				l.shadow.camera.left = l.shadow.camera.bottom = -3;
				l.shadow.camera.right = l.shadow.camera.top = 3;
				l.shadow.normalBias = 0.002;
			}
			if (l instanceof THREE.HemisphereLight) l.intensity = 0.75;
		});
		// the soft shade where each one stands on the paper
		const feet = binderRow(count).map((z) => ({ x: 0, z, w: B.width, d: B.thickness, radius: B.radius, lift: 0.05 }));
		scene.add(await contactMesh(THREE, { feet, light, strength: 0.9 }));
		const span = (count * (B.thickness + 2)) * u;
		return { width: Math.max(B.width * u, span) * 1.25, height: B.height * u, center: [0, (B.height / 2) * u, 0], focus: [-(B.width / 2) * u, (B.height / 2) * u, 0] };
	});
}
