/**
 * @module @arraypress/mockups/three/cd
 *
 * A CD in 3D: a jewel case (clear polystyrene lid and hinge, a black or
 * clear tray, the booklet under the lid) or a board digipak, with the disc
 * half out from behind it, its face drawn by the 2D disc part (printed, or
 * bare silver with an iridescent coat). Standing on a paper sweep by
 * default, or lying flat. Laid out by the 2D `cdLayout`, so the two match.
 */

import { resolveGround } from '../materials/ground.js';
import { resolveStock } from '../materials/paper.js';
import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { canvas2d } from '../render/image.js';
import { cdLayout, PACKAGINGS } from '../objects/cd.js';
import { disc, DISC } from '../parts/cd/disc.js';
import { JEWEL } from '../parts/cd/jewel.js';
import { DIGIPAK } from '../parts/cd/digipak.js';
import { clamp } from '../util/num.js';
import { texture } from './textures.js';
import { drawSvg, panelCanvas } from './printart.js';
import { stockMaterial } from './board.js';
import { footShadow } from './foot.js';
import { shoot } from './shot.js';

/** The scene's unit: the case's height, 125 mm. */
const UNIT = 125;

/** How deep things are, mm: a jewel case, its lid, a digipak, a disc. */
const DEPTH = Object.freeze({ jewel: 10.4, lid: 1.6, digipak: 7, disc: 1.2 });

/**
 * A disc's face as a canvas, drawn by the 2D disc part.
 *
 * @param {import('../types.js').Art} art The cover.
 * @param {'art' | 'silver' | import('../types.js').Art} face Printed with the cover, bare, or its own art.
 * @param {number} [size=1024] The canvas's side.
 * @returns {Promise<HTMLCanvasElement>} The canvas.
 */
export function discCanvas(art, face, size = 1024) {
	const sc = scene({ width: size, height: size, key: 'disc' });
	const print = face === 'silver' ? null : sc.image(face === 'art' ? art : face, 1);
	sc.add(el('rect', { width: size, height: size, fill: '#c9ccd0' }), disc(sc, { cx: size / 2, cy: size / 2, mm: size / (2 * DISC.radius), print, light: 0 }));
	return drawSvg(sc.svg(), size, size);
}

/**
 * A disc's alpha: solid, with its hole cut out.
 *
 * @param {number} [size=512] The canvas's side.
 * @returns {HTMLCanvasElement} The canvas.
 */
function holeCanvas(size = 512) {
	const [c, g] = canvas2d(size, size);
	g.fillStyle = '#fff';
	g.fillRect(0, 0, size, size);
	g.fillStyle = '#000';
	g.beginPath();
	g.arc(size / 2, size / 2, (size / 2) * (DISC.hole / DISC.radius), 0, Math.PI * 2);
	g.fill();
	return c;
}

/**
 * A CD scene on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas to draw on.
 * @param {import('./cd.js').CdSceneOptions} options The artwork (inline), the 2D `cd` options, the layout and the view.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function cdScene(canvas, options) {
	const { art, packaging = 'jewel', side = 'right', tray = 'black', disc: face = 'art', layout = 'upright' } = options;
	if (!art) throw new TypeError('cdScene: art is required');
	if (!PACKAGINGS.includes(packaging)) throw new TypeError(`cdScene: packaging is 'jewel' or 'digipak' (got ${JSON.stringify(packaging)})`);
	if (layout !== 'upright' && layout !== 'flat') throw new TypeError(`cdScene: layout is 'upright' or 'flat' (got ${JSON.stringify(layout)})`);
	const peek = clamp(options.peek ?? 0.5, 0, 0.9);
	const light = clamp(options.light ?? 0.35, -1, 1);
	const g = resolveGround(options.ground);
	const L = cdLayout(packaging, side, peek);
	const u = (mm) => mm / UNIT;
	const jewel = packaging === 'jewel';
	const depth = jewel ? DEPTH.jewel : DEPTH.digipak;
	// centred on the case's middle, in scene units
	const ox = L.w / 2;
	const oy = L.h / 2;

	return shoot(canvas, { ...options, ground: g, light, layout }, async (THREE, root, keep) => {
		const group = new THREE.Group();
		const stand = layout === 'upright';
		// the case
		if (jewel) {
			const plastic = () =>
				new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: 0.02, thickness: u(1.2), ior: 1.57, specularIntensity: 1, envMapIntensity: 1 });
			const trayMat = tray === 'black' ? new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.42 }) : plastic();
			const back = new THREE.Mesh(new THREE.BoxGeometry(u(L.w - 1), u(L.h - 1), u(depth - DEPTH.lid - 0.6)), trayMat);
			back.position.z = -u(DEPTH.lid + 0.6) / 2;
			const cover = keep(texture(THREE, await panelCanvas(art, { size: [JEWEL.booklet.size, JEWEL.booklet.size], color: '#f4f2ee', px: 12 })));
			const booklet = new THREE.Mesh(new THREE.PlaneGeometry(u(JEWEL.booklet.size), u(JEWEL.booklet.size)), stockMaterial(THREE, resolveStock('gloss', 'cd'), cover));
			booklet.position.set(u(JEWEL.booklet.x + JEWEL.booklet.size / 2 - ox), u(oy - JEWEL.booklet.y - JEWEL.booklet.size / 2), u(depth / 2 - DEPTH.lid - 0.25));
			const lid = new THREE.Mesh(new THREE.BoxGeometry(u(L.w), u(L.h), u(DEPTH.lid)), plastic());
			lid.position.z = u(depth / 2 - DEPTH.lid / 2);
			// the hinge down the left: a rounded spine of the same plastic
			const hinge = new THREE.Mesh(new THREE.CylinderGeometry(u(depth / 2), u(depth / 2), u(L.h), 24, 1), plastic());
			hinge.scale.x = u(JEWEL.hinge) / u(depth);
			hinge.position.x = u(-ox + JEWEL.hinge / 2);
			group.add(back, booklet, lid, hinge);
			for (const m of [back, booklet, hinge]) m.castShadow = m.receiveShadow = true;
		} else {
			const front = keep(texture(THREE, await panelCanvas(art, { size: [DIGIPAK.width, DIGIPAK.height], color: '#f4f2ee', px: 12 })));
			const edge = stockMaterial(THREE, resolveStock('matte', 'cd'), null);
			const board = new THREE.Mesh(new THREE.BoxGeometry(u(L.w), u(L.h), u(depth)), [edge, edge, edge, edge, stockMaterial(THREE, resolveStock('matte', 'cd'), front), edge]);
			board.castShadow = board.receiveShadow = true;
			group.add(board);
		}
		// the disc, behind the case
		if (peek > 0) {
			const map = keep(texture(THREE, await discCanvas(art, /** @type {'art'} */ (face))));
			const alpha = keep(texture(THREE, holeCanvas(), false));
			const silver = face === 'silver';
			const top = new THREE.MeshPhysicalMaterial({
				map,
				alphaMap: alpha,
				alphaTest: 0.5,
				metalness: silver ? 0.85 : 0.05,
				roughness: silver ? 0.16 : 0.42,
				clearcoat: silver ? 0 : 0.35,
				iridescence: silver ? 1 : 0,
				iridescenceIOR: 1.6,
				iridescenceThicknessMinimum: 250,
				iridescenceThicknessMaximum: 900,
			});
			const rim = new THREE.MeshPhysicalMaterial({ color: '#e8ebee', transmission: 0.8, roughness: 0.2, thickness: u(1) });
			const cyl = new THREE.CylinderGeometry(u(DISC.radius), u(DISC.radius), u(DEPTH.disc), 128, 1);
			const d = new THREE.Mesh(cyl, [rim, top, top]);
			// stood up facing the camera, the print turned upright (and a little, as a disc is put back)
			d.rotation.set(Math.PI / 2, Math.PI / 2 + 0.3, 0);
			d.position.set(u(L.disc[0] - ox), u(oy - L.disc[1]), -u(depth / 2 + DEPTH.disc / 2 + 0.3));
			d.castShadow = d.receiveShadow = true;
			group.add(d);
		}
		const width = u(L.box.x1 - L.box.x0);
		const cx = u((L.box.x0 + L.box.x1) / 2 - ox);
		if (stand) {
			// standing on the floor, leaning back a touch
			const lean = new THREE.Group();
			lean.rotation.x = (-3 * Math.PI) / 180;
			group.position.y = u(L.h / 2) + 0.002;
			lean.add(group);
			root.add(lean);
			const foot = footShadow(THREE, { width: u(L.w), depth: u(depth), soft: 0.025, strength: 0.55 });
			root.add(foot);
			return { width, height: u(L.box.y1 - L.box.y0), center: [cx, u(L.h / 2), 0] };
		}
		group.rotation.x = -Math.PI / 2;
		group.position.y = u(depth / 2 + DEPTH.disc) + 0.001;
		root.add(group);
		return { width, height: u(L.box.y1 - L.box.y0), center: [cx, 0, 0] };
	});
}
