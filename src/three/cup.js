/**
 * @module @logomarks/mockups/three/cup
 *
 * A takeaway coffee cup: a 12 oz paper cup (90 mm across the rim, 60 at
 * the base, 110 tall, its rim rolled), a domed sip lid in moulded
 * plastic, and a cardboard sleeve round its middle with the brand printed
 * on it in one ink. Turned on a lathe as the mug is; the sleeve is the
 * boxes' baked board (the kraft photograph, ink in its fibres, its grain's
 * relief), the cup coated paper with a soft sheen, the lid glossy and
 * reflecting the studio. It stands on a sweep printed with the table.
 */

import { reader } from '../util/reader.js';
import { isHex, mix } from '../util/color.js';
import { ink as inked } from '../render/ink.js';
import { resolveBoard, FIBRE_LOOKS } from '../materials/board.js';
import { shoot } from './shot.js';
import { UNIT } from './deskplane.js';
import { boardKit, bakeBoard, bakedMaterial, toothMap } from './board.js';
import { tableShot, dressTable, brandPrint } from './tabletop.js';

/** A 12 oz cup, in mm: the base's and the rim's radius, its height, the rolled rim's radius, and the sleeve's bottom and top. */
export const CUP = Object.freeze({ base: 30, rim: 45, height: 110, roll: 1.7, sleeve: Object.freeze([30, 84]) });

/** The lids' plastics by name. */
export const CUP_LIDS = Object.freeze({ white: '#f2f1ec', black: '#18181a' });

/**
 * The cup wall's radius at a height.
 *
 * @param {number} y Height, mm.
 * @returns {number} The outer radius there, mm.
 */
export const cupRadius = (y) => CUP.base + ((CUP.rim - CUP.base) * y) / CUP.height;

/**
 * The cup's profile for the lathe: the recessed base, the tapered wall, and the rolled rim, out and over.
 *
 * @returns {[number, number][]} Radius and height, mm, from the middle of the base round to the rim's inside.
 */
export function cupProfile() {
	const { base, rim, height, roll } = CUP;
	const pts = /** @type {[number, number][]} */ ([
		[0, 4],
		[base - 2.5, 4],
		[base - 1.2, 2],
		[base - 0.6, 0.3],
		[base - 0.1, 0],
	]);
	for (let i = 0; i <= 12; i++) pts.push([cupRadius((height * i) / 12), (height * i) / 12]);
	// the rolled rim: a bead of paper turned out and over
	for (let i = 0; i <= 12; i++) {
		const a = -Math.PI / 2 + (i / 12) * Math.PI * 1.5;
		pts.push([rim + roll * 0.4 + Math.cos(a) * roll, height + roll * 0.6 + Math.sin(a) * roll]);
	}
	return pts;
}

/**
 * A domed sip lid's profile: a skirt snapped over the rim, a recessed deck, a raised drinking ring, and a low dome.
 *
 * @returns {[number, number][]} Radius and height, mm, from the skirt's bottom edge inwards.
 */
export function lidProfile() {
	const { rim, height } = CUP;
	return [
		[rim + 1.9, height - 2.5],
		[rim + 2.4, height - 1.6],
		[rim + 2.6, height + 2],
		[rim + 2.2, height + 3.8],
		[rim + 1.2, height + 4.4],
		[rim - 1.2, height + 4.2],
		[rim - 3, height + 2.4],
		[rim - 4.5, height + 2],
		[rim - 6, height + 4],
		[rim - 7, height + 9.5],
		[rim - 8, height + 11],
		[rim - 10.5, height + 11.2],
		[rim - 12, height + 10],
		[rim - 14, height + 8.5],
		[18, height + 8.2],
		[8, height + 8.6],
		[0, height + 8.7],
	];
}

/**
 * A takeaway cup on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./cup.js').CupSceneOptions} options The mark (inline), and the cup, lid and sleeve.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function cupScene(canvas, options) {
	const o = reader('cupScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const color = o.color('color', '#f4f3ef');
	const lidName = o.raw('lid') ?? 'white';
	const lidColor = typeof lidName === 'string' && Object.hasOwn(CUP_LIDS, lidName) ? CUP_LIDS[/** @type {keyof typeof CUP_LIDS} */ (lidName)] : isHex(lidName) ? /** @type {string} */ (lidName) : null;
	if (!lidColor) throw new TypeError(`cupScene: lid is 'white', 'black' or a hex colour (got ${JSON.stringify(lidName)})`);
	const sleeve = resolveBoard(/** @type {import('../materials/board.js').BoardOption} */ (o.raw('sleeve') ?? 'kraft'), 'cupScene');
	const ink = o.color('ink', sleeve.name === 'black' ? '#f1ede4' : '#1c1a17');
	const name = o.text('name', '');
	const t = await tableShot(o, { layout: 'upright', fit: 0.62, view: { tilt: 15, turn: 0, fov: 26 }, surface: 'concrete', aperture: 0.016, span: 600, seed: 'cup' });
	const [s0, s1] = CUP.sleeve;
	const sleeveH = s1 - s0;
	const C = 2 * Math.PI * (cupRadius((s0 + s1) / 2) + 1.4);
	// the print on the front third of the sleeve, where it faces the camera
	const printH = sleeveH * 0.6;
	const printW = C * 0.24;
	const print = await brandPrint({ mark: inked(art, ink), name, ink, size: [C, sleeveH], box: [(C - printW) / 2, (sleeveH - printH) / 2, printW, printH], layout: name ? 'row' : 'stack' });

	return shoot(canvas, t.shot, async (THREE, scene, keep) => {
		const u = 1 / UNIT;
		const seg = 160;
		const lathe = (pts, mat) => {
			const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r * u, y * u)), seg, -Math.PI, Math.PI * 2), mat);
			m.castShadow = m.receiveShadow = true;
			scene.add(m);
			return m;
		};
		const tooth = keep(toothMap(THREE, `${t.seed}:cup`));
		tooth.repeat.set(6, 3);
		// coated paperboard: smooth, a soft sheen down the wall
		const paper = keep(new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.35, bumpMap: tooth, bumpScale: 0.15, envMapIntensity: 0.9 }));
		const plastic = keep(new THREE.MeshPhysicalMaterial({ color: lidColor, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.18, envMapIntensity: 1.1, side: THREE.DoubleSide }));
		lathe(cupProfile(), paper);
		lathe(lidProfile(), plastic);
		// the sip hole: a dark slot in the drinking ring, facing the camera
		const hole = new THREE.Mesh(new THREE.CapsuleGeometry(1.6 * u, 7 * u, 4, 12), keep(new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.6 })));
		hole.rotation.z = Math.PI / 2;
		hole.position.set(0, (CUP.height + 10.9) * u, (CUP.rim - 9.2) * u);
		hole.scale.set(1, 1, 0.35);
		scene.add(hole);

		// the sleeve: baked board round a cone just off the wall, its cut edges' thickness showing
		const kraft = sleeve.name === 'kraft';
		const kit = await boardKit(THREE, kraft ? FIBRE_LOOKS.kraft : sleeve.look, t.seed, kraft ? 2.2 : 1.2);
		keep(kit.normal);
		keep(kit.rough);
		const baked = bakeBoard(kit, { size: [C, sleeveH], color: sleeve.color, kraft, seed: `${t.seed}:sleeve`, print, folds: { top: 0.05, bottom: 0.08 } });
		const board = keep(bakedMaterial(THREE, kit, baked, [C, sleeveH], sleeve.color));
		const edge = keep(new THREE.MeshStandardMaterial({ color: mix(sleeve.color, '#000000', 0.25), roughness: 0.95, side: THREE.DoubleSide }));
		const out = (y) => cupRadius(y) + 1.6;
		lathe([[out(s0), s0], [out(s1), s1]], board);
		lathe([[out(s1), s1], [out(s1) - 1.5, s1]], edge);
		lathe([[out(s0) - 1.5, s0], [out(s0), s0]], edge);

		await dressTable(THREE, scene, keep, t, { feet: [{ x: 0, z: 0, w: CUP.base * 2, d: CUP.base * 2, radius: CUP.base, lift: 0.05 }], shade: 1.1, gloss: 1.3 });
		const top = CUP.height + 9;
		return { width: 150 * u, height: top * u, center: [0, top * 0.5 * u, 0], focus: [0, (s0 + s1) * 0.5 * u, cupRadius(57) * u] };
	});
}
