/**
 * @module @logomarks/mockups/three/deskplane
 *
 * The desk under the 3D print scenes, and the soft contact shadows on it,
 * both drawn by the 2D modules: the surface (concrete, oak, linen, paper)
 * rendered into a texture at its true scale in millimetres, and each
 * object's footprint shadowed as the 2D sheets are, onto a clear plane
 * laid just over the desk. The scenes work in units of 100 mm.
 */

import { scene } from '../render/scene.js';
import { canvas2d } from '../render/image.js';
import { surfaceLayer } from '../materials/desk.js';
import { flatShadow, outline } from '../parts/sheet.js';
import { hex } from '../util/color.js';
import { drawSvg } from './printart.js';

/** Millimetres in one scene unit. */
export const UNIT = 100;

/**
 * A desk surface drawn into a canvas, and its mean colour (what the exposure measures bare ground against).
 *
 * @param {import('../materials/desk.js').Surface} surf The surface.
 * @param {{ span: number, light: number, seed: string, px?: number }} o How many mm the canvas spans, where the light is, the seed, and the canvas's side (2048).
 * @returns {Promise<{ canvas: HTMLCanvasElement, color: string, span: number }>} The canvas, its mean colour, and its span in mm.
 */
export async function deskCanvas(surf, { span, light, seed, px = 2048 }) {
	const sc = scene({ width: px, height: px, key: `desk:${seed}` });
	sc.add(surfaceLayer(sc, surf, { light, seed, mm: px / span }));
	const canvas = await drawSvg(sc.svg(), px, px);
	// the mean, from a small copy
	const [, g] = canvas2d(16, 16);
	g.drawImage(canvas, 0, 0, 16, 16);
	const d = g.getImageData(0, 0, 16, 16).data;
	const sum = [0, 0, 0];
	for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += d[i + k];
	return { canvas, color: hex(sum.map((v) => v / 256)), span };
}

/**
 * The desk as a matte plane lying at y = 0, centred on the origin.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {{ canvas: HTMLCanvasElement, span: number }} desk The drawn desk.
 * @param {import('../materials/desk.js').Texture | null} texture Which texture it is (oak is a little glossier).
 * @param {number} [reach=3] How many times the drawn desk's span the plane covers: the drawing sits in the middle, mirrored round it out to the horizon.
 * @returns {import('three').Mesh} The plane; it takes shadows.
 */
export function deskMesh(THREE, desk, texture, reach = 3) {
	const map = new THREE.CanvasTexture(desk.canvas);
	map.colorSpace = THREE.SRGBColorSpace;
	map.anisotropy = 8;
	const k = Math.max(1, Math.round(reach) | 1);
	map.wrapS = map.wrapT = THREE.MirroredRepeatWrapping;
	map.repeat.set(k, k);
	// the middle tile is the drawing as it is (the mirrored ones lie round it)
	map.offset.set(-(k - 1) / 2, -(k - 1) / 2);
	const size = (desk.span * k) / UNIT;
	const mat = new THREE.MeshStandardMaterial({ map, roughness: texture === 'oak' ? 0.62 : 0.95, metalness: 0, envMapIntensity: texture === 'oak' ? 0.6 : 0.2 });
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
	mesh.rotation.x = -Math.PI / 2;
	mesh.position.y = 0.0002;
	mesh.receiveShadow = true;
	return mesh;
}

/**
 * The contact shadows under footprints on the desk: the 2D flat shadows drawn onto a clear plane, centred on the origin.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {object} o What's lying there.
 * @param {import('./deskplane.js').Footprint[]} o.feet Each footprint: its centre and size in mm (z towards the camera), turn, corner radius, and lift.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} [o.strength=0.8] How dark.
 * @param {number} [o.px=4] Pixels per mm.
 * @returns {Promise<import('three').Mesh>} The plane.
 */
export async function contactMesh(THREE, { feet, light, strength = 0.8, px = 4 }) {
	const pad = 60;
	const reach = Math.max(...feet.map((f) => Math.max(Math.abs(f.x), Math.abs(f.z)) + Math.hypot(f.w, f.d) / 2)) + pad;
	const W = Math.round(2 * reach * px);
	const sc = scene({ width: W, height: W, key: 'contact' });
	for (const f of feet) {
		sc.add(flatShadow(sc, { d: outline(f.w * px, f.d * px, (f.radius ?? 0) * px), cx: W / 2 + f.x * px, cy: W / 2 + f.z * px, angle: f.angle ?? 0, mm: px, light, lift: f.lift ?? 0.2, strength }));
	}
	const map = new THREE.CanvasTexture(await drawSvg(sc.svg(), W, W));
	map.colorSpace = THREE.SRGBColorSpace;
	const size = (2 * reach) / UNIT;
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false }));
	mesh.rotation.x = -Math.PI / 2;
	mesh.position.y = 0.0006;
	mesh.renderOrder = -1;
	return mesh;
}
