/**
 * @module @logomarks/mockups/three/menu
 *
 * A restaurant's menu on the table: a single heavy card lying a little
 * askew (`'card'`), or a tri-fold standing open in a zigzag, its inside
 * spread to the camera (`'folded'`). The print is the caller's file or a
 * menu composed from the brand (the lockup, the courses, the prices). The
 * stock is uncoated with its tooth; the table is one of the drawn
 * surfaces, out of focus beyond the menu.
 */

import { reader } from '../util/reader.js';
import { brandOf } from '../util/brand.js';
import { mix } from '../util/color.js';
import { resolveStock } from '../materials/paper.js';
import { resolveSurface } from '../materials/desk.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg, trimCanvas } from './printart.js';
import { cardMesh } from './card.js';
import { stockMaterial, boardMaterial, toothMap } from './board.js';
import { UNIT, deskCanvas, deskMesh, contactMesh } from './deskplane.js';
import { menuCardSvg, menuSpreadSvg, resolveSections, MENU_SIZES } from '../parts/menu.js';

/** The layouts: one card lying, or a tri-fold standing open. */
export const MENU_LAYOUTS = /** @type {const} */ (['card', 'folded']);

/** How far each fold of the tri-fold is opened from flat, degrees (each panel turned this much from the one before). */
export const FOLD = 56;

/**
 * Where the tri-fold's panels stand: a zigzag, each panel turned alternately left and right of square to the camera, centred on the origin.
 *
 * @param {number} [fold=FOLD] The angle between neighbouring panels' faces, degrees from flat.
 * @returns {{ x: number, z: number, turn: number }[]} Each panel's centre (mm, z towards the camera) and turn about the vertical (degrees).
 */
export function zigzag(fold = FOLD) {
	const P = MENU_SIZES.panel[0];
	const half = fold / 2;
	const turns = [half, -half, half];
	let x = 0;
	let z = 0;
	const panels = turns.map((turn) => {
		const a = (turn * Math.PI) / 180;
		const dx = P * Math.cos(a);
		const dz = P * Math.sin(a);
		const p = { x: x + dx / 2, z: z + dz / 2, turn };
		x += dx;
		z += dz;
		return p;
	});
	const zs = panels.map((p) => p.z);
	const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
	return panels.map((p) => ({ x: p.x - x / 2, z: p.z - cz, turn: p.turn }));
}

/**
 * A menu on a table, in 3D on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./menu.js').MenuSceneOptions} options The mark (inline), the brand, the courses or a print file, and how to show them.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function menuScene(canvas, options) {
	const o = reader('menuScene', options);
	const brand = brandOf(o, { color: '#1f5c4c', paper: '#f3efe6' });
	const layout = o.oneOf('layout', 'card', MENU_LAYOUTS);
	const sections = resolveSections(o.raw('sections'));
	const { print } = /** @type {import('./menu.js').MenuSceneOptions} */ (options);
	const bleed = o.num('bleed', 0, 0, 10);
	const light = o.num('light', 0.4, -1, 1);
	const seed = o.text('seed', 'menu');
	const stock = resolveStock(/** @type {import('../materials/paper.js').StockName} */ (o.raw('stock') ?? 'uncoated'), 'menuScene');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'oak');
	const desk = surf.texture ? await deskCanvas(surf, { span: 1200, light, seed }) : null;
	const card = layout === 'card';
	const [CW, CH] = MENU_SIZES.card;
	const [PW, PH] = MENU_SIZES.panel;
	const face = card
		? print
			? await trimCanvas(print, { trim: [CW, CH], bleed, px: 5 })
			: await drawSvg(menuCardSvg(brand, { sections }), CW * 5, CH * 5)
		: print
			? await trimCanvas(print, { trim: [3 * PW, PH], bleed, px: 6 })
			: await drawSvg(menuSpreadSvg(brand, { sections }), 3 * PW * 6, PH * 6);
	const shot = {
		...shotOf(o, { ground: desk?.color ?? surf.color, light, layout: card ? 'flat' : 'upright', fit: card ? 0.86 : 0.8, view: card ? { tilt: 32, turn: -12 } : { tilt: 12, turn: 0 } }),
		backdrop: !card && desk ? { canvas: desk.canvas, span: desk.span / UNIT } : null,
		lens: lensOf(o, { aperture: 0.012, blur: 0.5 }),
	};

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const u = 1 / UNIT;
		const tooth = keep(toothMap(THREE, seed));
		tooth.repeat.set(5, 5);
		const printed = (repeat = 1, offset = 0) => {
			const t = keep(new THREE.CanvasTexture(face));
			t.colorSpace = THREE.SRGBColorSpace;
			t.anisotropy = 8;
			t.repeat.set(repeat, 1);
			t.offset.set(offset, 0);
			return keep(stockMaterial(THREE, stock, t, tooth));
		};
		const plain = keep(stockMaterial(THREE, stock, null, tooth));
		plain.color.set(card ? brand.paper : brand.color);
		const edge = keep(boardMaterial(THREE, mix(brand.paper, '#000000', 0.06)));
		if (card) {
			if (desk) scene.add(deskMesh(THREE, desk, surf.texture));
			const turn = -6;
			const m = cardMesh(THREE, { w: CW * u, h: CH * u, t: 0.6 * u, r: 0, top: printed(), bottom: plain, edge });
			m.position.y = 0.0008;
			m.rotation.y = (-turn * Math.PI) / 180;
			scene.add(m);
			scene.add(await contactMesh(THREE, { feet: [{ x: 0, z: 0, w: CW, d: CH, angle: turn, lift: 0.25 }], light, strength: surf.shadow }));
			return { width: CW * u, height: CH * u, center: [0, 0, 0], focus: [0, 0, 0] };
		}
		// the tri-fold: each panel its third of the spread, standing on its foot
		zigzag().forEach((p, i) => {
			const m = cardMesh(THREE, { w: PW * u, h: PH * u, t: 0.3 * u, r: 0, top: printed(1 / 3, i / 3), bottom: plain, edge });
			// stood up: the printed face to the camera, the panel's foot on the table
			m.rotation.set(Math.PI / 2, (-p.turn * Math.PI) / 180, 0, 'YXZ');
			m.position.set(p.x * u, (PH / 2) * u, p.z * u);
			scene.add(m);
		});
		const feet = zigzag().map((p) => ({ x: p.x, z: p.z, w: PW, d: 2, angle: p.turn, lift: 0.02 }));
		scene.add(await contactMesh(THREE, { feet, light, strength: 1.2 * surf.shadow }));
		return { width: 3 * PW * u, height: PH * u, center: [0, (PH / 2) * u, 0], focus: [0, (PH / 2) * u, 0] };
	});
}
