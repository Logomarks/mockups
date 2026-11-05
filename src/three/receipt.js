/**
 * @module @logomarks/mockups/three/receipt
 *
 * A till receipt on a table: a strip of thermal paper, its far end
 * curling up as paper off a roll does, its near end lifting a little, a
 * slight cup across its width, both ends torn along the printer's serrated
 * edge. Thermal paper is thin and a little glossy, its back blank. The
 * print is composed from the brand (the mark and name, the items, the
 * total, a barcode) or the caller's own file.
 */

import { reader } from '../util/reader.js';
import { brandOf } from '../util/brand.js';
import { resolveSurface } from '../materials/desk.js';
import { canvas2d } from '../render/image.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg, trimCanvas } from './printart.js';
import { UNIT, deskCanvas, deskMesh, contactMesh } from './deskplane.js';
import { receiptSvg, receiptLength, resolveItems, RECEIPT } from '../parts/receipt.js';

/** How the strip bends, mm: the far end's curl (its radius, and how much of the length it takes), the near end's lift, and the cup across the width. */
export const CURL = Object.freeze({ radius: 42, share: 0.2, lift: 7, cup: 1.4 });

/**
 * Where a point of the strip lies, from where it is on the flat paper: flat on the table in the middle, rolling up round a cylinder at the far end, lifting at the near end, cupped across.
 *
 * @param {number} x Across the strip from its middle, mm.
 * @param {number} s Along it from its near end, mm.
 * @param {number} length The strip's length, mm.
 * @param {number} [width=RECEIPT.width] Its width, mm.
 * @returns {[number, number, number]} The point (x across, y up, z towards the camera), mm, the strip centred on the origin.
 */
export function curlPoint(x, s, length, width = RECEIPT.width) {
	const C = CURL;
	const flatEnd = length * (1 - C.share);
	const near = length * 0.12;
	const cup = C.cup * (x / (width / 2)) ** 2;
	let y;
	let along;
	if (s > flatEnd) {
		const a = (s - flatEnd) / C.radius;
		along = flatEnd + C.radius * Math.sin(a);
		y = C.radius * (1 - Math.cos(a));
	} else if (s < near) {
		along = s;
		y = C.lift * ((near - s) / near) ** 2;
	} else {
		along = s;
		y = 0;
	}
	return [x, y + cup, length / 2 - along];
}

/**
 * The torn ends: the printer's serrated cut along both ends, as an alpha mask.
 *
 * @param {number} length The strip's length, mm.
 * @param {number} [px=4] Pixels per mm.
 * @returns {HTMLCanvasElement} The mask (white is paper).
 */
export function tearMask(length, px = 4) {
	const W = Math.round(RECEIPT.width * px);
	const H = Math.round(length * px);
	const [c, g] = canvas2d(W, H);
	g.fillStyle = '#ffffff';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#000000';
	const tooth = 2.2 * px;
	const deep = 0.9 * px;
	for (const end of [0, H]) {
		g.beginPath();
		g.moveTo(0, end);
		for (let x = 0; x <= W + tooth; x += tooth) {
			g.lineTo(x, end);
			g.lineTo(x + tooth / 2, end === 0 ? deep : H - deep);
		}
		g.lineTo(W, end);
		g.fill();
	}
	return c;
}

/**
 * A receipt on a table, in 3D on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./receipt.js').ReceiptSceneOptions} options The mark (inline), the brand, the items or a print file, and how to show them.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function receiptScene(canvas, options) {
	const o = reader('receiptScene', options);
	const brand = brandOf(o, { color: '#232323' });
	const items = resolveItems(o.raw('items'));
	const currency = o.text('currency', '£');
	const { print } = /** @type {import('./receipt.js').ReceiptSceneOptions} */ (options);
	const light = o.num('light', 0.4, -1, 1);
	const seed = o.text('seed', 'receipt');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'oak');
	const desk = surf.texture ? await deskCanvas(surf, { span: 700, light, seed }) : null;
	const length = print ? o.num('length', 200, 60, 600) : receiptLength(items.length, !!brand.name);
	const face = print ? await trimCanvas(print, { trim: [RECEIPT.width, length], px: 10 }) : await drawSvg(receiptSvg(brand, { items, seed, currency }), RECEIPT.width * 10, length * 10);
	const shot = { ...shotOf(o, { ground: desk?.color ?? surf.color, light, layout: 'flat', fit: 0.78, view: { tilt: 38, turn: -18 } }), lens: lensOf(o, { aperture: 0.014, blur: 0.5 }) };

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const u = 1 / UNIT;
		if (desk) scene.add(deskMesh(THREE, desk, surf.texture));
		const geo = keep(new THREE.PlaneGeometry(RECEIPT.width, length, 16, 160));
		const p = geo.attributes.position;
		for (let i = 0; i < p.count; i++) {
			const [x, y, z] = curlPoint(p.getX(i), p.getY(i) + length / 2, length);
			p.setXYZ(i, x * u, y * u + 0.0012, z * u);
		}
		geo.computeVertexNormals();
		const map = keep(new THREE.CanvasTexture(face));
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = 8;
		const alphaMap = keep(new THREE.CanvasTexture(tearMask(length)));
		// thermal paper: thin, faintly blue-white, a soft gloss; its back blank and a shade greyer
		const paper = { roughness: 0.42, clearcoat: 0.15, clearcoatRoughness: 0.4, alphaMap, alphaTest: 0.5, envMapIntensity: 0.8 };
		const front = keep(new THREE.MeshPhysicalMaterial({ ...paper, map, color: '#f7f8f8', side: THREE.FrontSide }));
		const back = keep(new THREE.MeshPhysicalMaterial({ ...paper, color: '#ecedeb', side: THREE.BackSide }));
		for (const mat of [front, back]) {
			const m = new THREE.Mesh(geo, mat);
			// it casts its shadow on the table; it takes none on itself (so thin a sheet would only streak)
			m.castShadow = true;
			scene.add(m);
		}
		scene.add(await contactMesh(THREE, { feet: [{ x: 0, z: -length * CURL.share * 0.3, w: RECEIPT.width, d: length * (1 - CURL.share * 0.6), lift: 0.12 }], light, strength: 0.7 * surf.shadow }));
		return { width: RECEIPT.width * 1.5 * u, height: length * 1.02 * u, center: [0, 0, 0], focus: [0, 0, 0] };
	});
}
