/**
 * @module @logomarks/mockups/three/takeaway
 *
 * A takeaway bag, closed: a flat-bottomed kraft paper bag standing square,
 * its sides gussets pleated in along a centre crease (a shallow V, deepest
 * at the top edge), its top folded flat and over once onto the front, the
 * fold as wide as the bag, held shut by a round seal sticker
 * across the fold's edge, the brand's mark on it. The paper is the
 * boxes' baked kraft (or white, or a colour), creased where it folds; the
 * sticker is printed and a little glossier, bridging the step from the
 * flap to the bag. It stands on a sweep printed with the table.
 */

import { reader } from '../util/reader.js';
import { ink as inked } from '../render/ink.js';
import { canvas2d } from '../render/image.js';
import { resolveBoard, FIBRE_LOOKS } from '../materials/board.js';
import { shoot } from './shot.js';
import { UNIT } from './deskplane.js';
import { boardKit, bakeBoard, bakedMaterial } from './board.js';
import { drawSvg } from './printart.js';
import { tableShot, dressTable } from './tabletop.js';
import { scene as doc } from '../render/scene.js';
import { el } from '../render/svg.js';
import { fitArt } from '../render/fit.js';

/** The bag, in mm: its width, depth (the gusset), the height to its folded top, how far the gussets' creases pleat in (low down, and at the top edge), the folded flap, and the seal's diameter. */
export const TAKEAWAY = Object.freeze({ width: 160, depth: 96, height: 232, pleat: Object.freeze([5, 18]), flap: 46, seal: 52 });

/**
 * How far a gusset's centre crease pleats in at a height: a little all the way up, deepening towards the top edge, where the folded top pulls it in.
 *
 * @param {number} y Height, mm.
 * @returns {number} The crease's depth in from the side, mm.
 */
export function pleat(y) {
	const [low, top] = TAKEAWAY.pleat;
	return low + (top - low) * Math.max(0, Math.min(1, y / TAKEAWAY.height)) ** 4;
}

/**
 * The seal's print: a disc of the seal's colour, the mark in the middle in its ink.
 *
 * @param {import('../types.js').Art} mark The mark.
 * @param {{ color: string, ink: string, px?: number }} o The disc's colour, the ink, and pixels per mm (12).
 * @returns {Promise<HTMLCanvasElement>} A square canvas the seal's size, clear outside the disc.
 */
export function sealCanvas(mark, { color, ink, px = 12 }) {
	const D = TAKEAWAY.seal;
	const w = Math.round(D * px);
	const sc = doc({ width: w, height: w, key: `seal:${color}:${ink}` });
	sc.add(el('circle', { cx: w / 2, cy: w / 2, r: w / 2 - 1, fill: color }));
	sc.add(fitArt(sc, inked(mark, ink), { x: w * 0.24, y: w * 0.24, width: w * 0.52, height: w * 0.52 }, 'contain'));
	return drawSvg(sc.svg(), w, w);
}

/**
 * A flat face as a mesh: four corners (or more, a fan from the first), its UVs spanning its own box.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {[number, number, number][]} pts The corners, mm, counter-clockwise seen from outside.
 * @param {[number, number][]} uvs Their UVs.
 * @param {import('three').Material} mat The material.
 * @param {number} u Scene units per mm.
 * @returns {import('three').Mesh} The face.
 */
function facet(THREE, pts, uvs, mat, u) {
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap((p) => p.map((v) => v * u)), 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs.flat(), 2));
	g.setIndex(pts.slice(2).flatMap((_, i) => [0, i + 1, i + 2]));
	g.computeVertexNormals();
	const m = new THREE.Mesh(g, mat);
	m.castShadow = m.receiveShadow = true;
	return m;
}

/**
 * A sheet of paper between four corners: a bilinear patch bowed out along its normal and softly wrinkled, as a filled bag's sides are.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {[number, number, number][]} c The corners, mm: bottom-left, bottom-right, top-right, top-left, seen from outside.
 * @param {{ bulge?: number, wrinkle?: number, seed?: number, mat: import('three').Material, u: number }} o How far it bows out and how deep its wrinkles are (mm), a seed, the material, and scene units per mm.
 * @returns {import('three').Mesh} The sheet, its UVs spanning it.
 */
export function sheet(THREE, c, { bulge = 0, wrinkle = 0, seed = 0, mat, u }) {
	const n = 24;
	const pos = [];
	const uv = [];
	const idx = [];
	const at = (s, t) => [0, 1, 2].map((k) => (1 - t) * ((1 - s) * c[0][k] + s * c[1][k]) + t * ((1 - s) * c[3][k] + s * c[2][k]));
	// the patch's normal, from its diagonals
	const d1 = [0, 1, 2].map((k) => c[2][k] - c[0][k]);
	const d2 = [0, 1, 2].map((k) => c[3][k] - c[1][k]);
	const nx = d1[1] * d2[2] - d1[2] * d2[1];
	const ny = d1[2] * d2[0] - d1[0] * d2[2];
	const nz = d1[0] * d2[1] - d1[1] * d2[0];
	const l = Math.hypot(nx, ny, nz) || 1;
	for (let j = 0; j <= n; j++) {
		for (let i = 0; i <= n; i++) {
			const s = i / n;
			const t = j / n;
			const p = at(s, t);
			const w = Math.sin(Math.PI * s) * Math.sin(Math.PI * t);
			const crinkle = Math.sin(s * 9.1 + seed) * Math.sin(t * 7.3 + seed * 1.7) + 0.5 * Math.sin(s * 17.3 + t * 11.9 + seed * 2.3);
			const off = bulge * w + wrinkle * crinkle * w;
			pos.push((p[0] + (off * nx) / l) * u, (p[1] + (off * ny) / l) * u, (p[2] + (off * nz) / l) * u);
			uv.push(s, t);
		}
	}
	for (let j = 0; j < n; j++) {
		for (let i = 0; i < n; i++) {
			const a = j * (n + 1) + i;
			idx.push(a, a + 1, a + n + 2, a, a + n + 2, a + n + 1);
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	g.setIndex(idx);
	g.computeVertexNormals();
	const m = new THREE.Mesh(g, mat);
	m.castShadow = m.receiveShadow = true;
	return m;
}

/**
 * A closed takeaway bag on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./takeaway.js').TakeawaySceneOptions} options The mark (inline), and the bag and its seal.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function takeawayScene(canvas, options) {
	const o = reader('takeawayScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const paper = resolveBoard(/** @type {import('../materials/board.js').BoardOption} */ (o.raw('paper') ?? 'kraft'), 'takeawayScene');
	const seal = o.color('seal', '#1c1a17');
	const ink = o.color('ink', '#f4f1ea');
	const t = await tableShot(o, { layout: 'upright', fit: 0.72, view: { tilt: 10, turn: -26, fov: 26 }, surface: 'concrete', aperture: 0.014, span: 900, seed: 'takeaway' });
	const B = TAKEAWAY;
	const sticker = await sealCanvas(art, { color: seal, ink });

	return shoot(canvas, t.shot, async (THREE, scene, keep) => {
		const u = 1 / UNIT;
		const kraft = paper.name === 'kraft';
		const kit = await boardKit(THREE, kraft ? FIBRE_LOOKS.kraft : paper.look, t.seed, kraft ? 2.2 : 1);
		keep(kit.normal);
		keep(kit.rough);
		let n = 0;
		const face = (size, extra = {}) => {
			const m = keep(bakedMaterial(THREE, kit, bakeBoard(kit, { size, color: paper.color, kraft, seed: `${t.seed}:${n++}`, ...extra }), size, paper.color));
			m.side = THREE.DoubleSide;
			return m;
		};
		const [W, D, H, F] = [B.width / 2, B.depth / 2, B.height, B.flap];
		const zf = D;
		const bag = new THREE.Group();
		// front and back stand straight up, bowed out a little by what's inside, softly wrinkled; the front is flat under the flap and the seal
		const band = H - F - B.seal / 2 - 4;
		bag.add(sheet(THREE, [[-W, 0, zf], [W, 0, zf], [W, band, zf], [-W, band, zf]], { bulge: 3.5, wrinkle: 0.7, seed: 1, mat: face([B.width, band], { ao: { bottom: 0.25, reach: 0.08 }, folds: { left: 0.18, right: 0.18 } }), u }));
		bag.add(sheet(THREE, [[-W, band, zf], [W, band, zf], [W, H, zf], [-W, H, zf]], { wrinkle: 0.15, seed: 4, mat: face([B.width, H - band], { folds: { left: 0.18, right: 0.18 } }), u }));
		bag.add(sheet(THREE, [[W, 0, -D], [-W, 0, -D], [-W, H, -D], [W, H, -D]], { bulge: 3, wrinkle: 0.6, seed: 2, mat: face([B.width, H], { folds: { left: 0.18, right: 0.18, top: 0.2 } }), u }));
		// the top, folded flat across the bag from back to front, as wide as it
		bag.add(sheet(THREE, [[-W, H, zf], [W, H, zf], [W, H, -D], [-W, H, -D]], { bulge: 1.2, wrinkle: 0.4, seed: 3, mat: face([B.width, B.depth], { folds: { top: 0.2, bottom: 0.25 } }), u }));
		// the gussets: each side pleated in along its centre crease, a shallow V that deepens towards the top edge
		const bands = [0, H * 0.72, H];
		for (const s of [-1, 1]) {
			const sideMat = face([B.depth / 2, H], { folds: { left: 0.2, right: 0.14 } });
			const crease = (y) => /** @type {[number, number, number]} */ ([s * (W - pleat(y)), y, 0]);
			for (let b = 0; b < bands.length - 1; b++) {
				const [y0, y1] = [bands[b], bands[b + 1]];
				const halves = [
					/** @type {[number, number, number][]} */ ([[s * W, y0, zf], crease(y0), crease(y1), [s * W, y1, zf]]),
					/** @type {[number, number, number][]} */ ([crease(y0), [s * W, y0, -D], [s * W, y1, -D], crease(y1)]),
				];
				for (const [k, c] of halves.entries()) {
					// wound so each half faces out on its side
					const q = s > 0 ? c : [c[1], c[0], c[3], c[2]];
					bag.add(sheet(THREE, q, { bulge: 0.8, wrinkle: 0.45, seed: 5 + k + 2 * b + s, mat: sideMat, u }));
				}
			}
		}
		// the flap: folded over the top and down the front, a double thickness, standing just off it at its bottom edge
		const flapMat = face([B.width, F], { folds: { top: 0.3 }, ao: { bottom: 0.1, reach: 0.04 } });
		const lift = 1.6;
		bag.add(facet(THREE, [[-W - 0.5, H - F, zf + lift], [W + 0.5, H - F, zf + lift], [W + 0.5, H + 0.4, zf + 1.6], [-W - 0.5, H + 0.4, zf + 1.6]], [[0, 0], [1, 0], [1, 1], [0, 1]], flapMat, u));
		// the fold's rounded edge
		const roll = new THREE.Mesh(new THREE.CylinderGeometry(1.3 * u, 1.3 * u, (B.width + 1) * u, 12, 1, true), flapMat);
		roll.rotation.z = Math.PI / 2;
		roll.position.set(0, (H - 0.6) * u, (zf + 0.4) * u);
		bag.add(roll);
		// the shade the flap's edge casts on the front
		const [sc, sg] = canvas2d(8, 64);
		const grad = sg.createLinearGradient(0, 0, 0, 64);
		grad.addColorStop(0, 'rgba(0,0,0,0.42)');
		grad.addColorStop(1, 'rgba(0,0,0,0)');
		sg.fillStyle = grad;
		sg.fillRect(0, 0, 8, 64);
		const shade = new THREE.Mesh(new THREE.PlaneGeometry(B.width * u, 9 * u), keep(new THREE.MeshBasicMaterial({ map: keep(new THREE.CanvasTexture(sc)), transparent: true, depthWrite: false })));
		shade.position.set(0, (H - F - 4.5) * u, (zf + 0.15) * u);
		bag.add(shade);

		// the seal: a printed disc across the flap's edge, bridging the step onto the bag
		const map = keep(new THREE.CanvasTexture(sticker));
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = 8;
		const disc = new THREE.PlaneGeometry(B.seal * u, B.seal * u, 48, 48);
		const p = disc.attributes.position;
		for (let i = 0; i < p.count; i++) {
			const y = p.getY(i) / u; // mm from the seal's centre, at the flap's edge
			// fully up on the flap from its edge, sloping down onto the bag over the 3 mm below it
			const k = Math.min(1, Math.max(0, (y + 3) / 3));
			p.setZ(i, (0.25 + lift * k * k * (3 - 2 * k)) * u);
		}
		disc.computeVertexNormals();
		const label = new THREE.Mesh(disc, keep(new THREE.MeshPhysicalMaterial({ map, transparent: true, alphaTest: 0.5, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.25, envMapIntensity: 1 })));
		label.position.set(0, (H - F) * u, zf * u);
		label.castShadow = true;
		bag.add(label);
		scene.add(bag);

		await dressTable(THREE, scene, keep, t, { feet: [{ x: 0, z: 0, w: B.width, d: B.depth, radius: 2, lift: 0.06 }], shade: 1.3 });
		return { width: Math.hypot(B.width, B.depth) * 1.1 * u, height: (H + 10) * u, center: [0, H * 0.5 * u, 0], focus: [0, (H - F) * u, zf * u] };
	});
}

