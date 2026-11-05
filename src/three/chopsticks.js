/**
 * @module @logomarks/mockups/three/chopsticks
 *
 * A pair of chopsticks in a paper sleeve, lying on the table: a long
 * narrow sleeve of paper (the brand's mark and name printed along it in
 * one ink), soft and round over the sticks inside and pressed flat at its
 * folded end, the sticks' square tops poking out of its open end, a
 * little apart. The paper is the boxes' baked board (kraft, white or a
 * colour, its grain over the ink); the sticks are pale wood, their grain
 * running their length. One pair, or two side by side.
 */

import { reader } from '../util/reader.js';
import { rng } from '../util/rng.js';
import { mix } from '../util/color.js';
import { ink as inked } from '../render/ink.js';
import { canvas2d } from '../render/image.js';
import { resolveBoard, FIBRE_LOOKS } from '../materials/board.js';
import { shoot } from './shot.js';
import { UNIT } from './deskplane.js';
import { boardKit, bakeBoard, bakedMaterial } from './board.js';
import { tableShot, dressTable, brandPrint } from './tabletop.js';

/** A sleeve and its sticks, in mm: the sleeve's length, width and height over the sticks, how far the sticks poke out, their length, and their tops' and tips' side. */
export const CHOPSTICKS = Object.freeze({ length: 205, width: 26, height: 8, out: 32, stick: 212, top: 6.4, tip: 3.4 });

/** The layouts: one pair, or two side by side. */
export const CHOPSTICK_LAYOUTS = /** @type {const} */ (['single', 'pair']);

/**
 * The sleeve's cross-section at a point along it: a flattened round over the sticks, pressed flat towards the folded end.
 *
 * @param {number} along How far along, 0 (the open end) to 1 (the folded end).
 * @param {number} around The angle round it, radians (0 at the middle of the top).
 * @returns {[number, number]} The point across (mm from the middle) and up (mm from the table).
 */
export function sleeveSection(along, around) {
	const C = CHOPSTICKS;
	// pressed flat over the last stretch, where only paper is folded over
	const press = Math.min(1, Math.max(0, (along - 0.92) / 0.06));
	const h = C.height * (1 - 0.82 * press);
	const s = Math.sin(around);
	const c = Math.cos(around);
	// a superellipse: flat-ish on the table and on top, round at the sides
	const k = 0.6;
	const x = (Math.sign(s) * Math.abs(s) ** k * C.width) / 2;
	const y = h / 2 + (Math.sign(c) * Math.abs(c) ** k * h) / 2;
	return [x, y * (c < 0 ? 0.92 : 1)];
}

/**
 * Where the sleeves lie: one, or two side by side and a little staggered, turned across the table.
 *
 * @param {'single' | 'pair'} layout The layout.
 * @param {string} seed The seed.
 * @returns {{ x: number, z: number, turn: number }[]} Each sleeve's centre (mm) and turn (degrees).
 */
export function chopstickPoses(layout, seed) {
	const r = rng(`${seed}:chopsticks`);
	const turn = -28 + r.range(-3, 3);
	if (layout === 'single') return [{ x: 0, z: 0, turn }];
	return [
		{ x: -22, z: -12, turn: turn + r.range(-2, 2) },
		{ x: 22, z: 12, turn: turn + r.range(-2, 2) },
	];
}

/**
 * Chopsticks in a paper sleeve on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./chopsticks.js').ChopsticksSceneOptions} options The mark (inline), the name, and the sleeve.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function chopsticksScene(canvas, options) {
	const o = reader('chopsticksScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const paper = resolveBoard(/** @type {import('../materials/board.js').BoardOption} */ (o.raw('paper') ?? 'white'), 'chopsticksScene');
	const ink = o.color('ink', paper.name === 'black' ? '#f1ede4' : '#1c1a17');
	const wood = o.color('wood', '#d9bc8f');
	const name = o.text('name', '');
	const layout = o.oneOf('layout', 'single', CHOPSTICK_LAYOUTS);
	const t = await tableShot(o, { layout: 'flat', fit: 0.86, view: { tilt: 44, turn: 0, fov: 28 }, surface: 'slate', aperture: 0.016, span: 600, seed: 'chopsticks' });
	const C = CHOPSTICKS;
	const around = 2.6 * C.width;
	// the print runs along the top: the canvas is the sleeve unrolled, u along it, v round it (the top in the middle)
	const band = C.width * 0.62;
	const print = await brandPrint({ mark: inked(art, ink), name, ink, size: [C.length, around], box: [C.length * 0.3, (around - band) / 2, C.length * 0.55, band], layout: 'row' });
	const poses = chopstickPoses(layout, t.seed);

	return shoot(canvas, t.shot, async (THREE, scene, keep) => {
		const u = 1 / UNIT;
		const kraft = paper.name === 'kraft';
		const kit = await boardKit(THREE, kraft ? FIBRE_LOOKS.kraft : paper.look, t.seed, kraft ? 1.8 : 0.8);
		keep(kit.normal);
		keep(kit.rough);
		const baked = bakeBoard(kit, { size: [C.length, around], color: paper.color, kraft, seed: `${t.seed}:sleeve`, print });
		const skin = keep(bakedMaterial(THREE, kit, baked, [C.length, around], paper.color));
		skin.side = THREE.DoubleSide;
		const grain = keep(new THREE.CanvasTexture(woodCanvas(wood, t.seed)));
		grain.colorSpace = THREE.SRGBColorSpace;
		const stick = keep(new THREE.MeshStandardMaterial({ map: grain, roughness: 0.62, envMapIntensity: 0.6 }));
		const sleeveGeo = keep(sleeveGeometry(THREE, u));
		const stickGeo = keep(stickGeometry(THREE, u));
		for (const p of poses) {
			const g = new THREE.Group();
			const sleeve = new THREE.Mesh(sleeveGeo, skin);
			sleeve.castShadow = sleeve.receiveShadow = true;
			g.add(sleeve);
			// the sticks' tops out of the open end (at z = 0, the sleeve running back along -z), a little apart
			for (const s of [-1, 1]) {
				const m = new THREE.Mesh(stickGeo, stick);
				m.position.set(s * (C.top * 0.62) * u, (C.top / 2 + 0.6) * u, (C.out - C.stick / 2) * u);
				m.rotation.y = s * 0.012;
				m.castShadow = m.receiveShadow = true;
				g.add(m);
			}
			// centred on the whole length, sticks and sleeve
			const span = C.length + C.out;
			g.children.forEach((m) => (m.position.z += (span / 2 - C.out) * u));
			g.position.set(p.x * u, 0, p.z * u);
			g.rotation.y = (p.turn * Math.PI) / 180;
			scene.add(g);
		}
		const span = C.length + C.out;
		await dressTable(THREE, scene, keep, t, { feet: poses.map((p) => ({ x: p.x, z: p.z, w: C.width, d: span, angle: -p.turn, radius: 6, lift: 0.08 })), shade: 1.2 });
		const W = span + (layout === 'pair' ? 60 : 0);
		return { width: W * 0.95 * u, height: W * 0.7 * u, center: [0, 0, 0], focus: [0, C.height * u, 0] };
	});
}

/**
 * The sleeve: its cross-section swept along it, open at the near end (z = 0) and pressed flat at the far end; u along it, v round it with the top at 0.5.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {number} u Scene units per mm.
 * @returns {import('three').BufferGeometry} The sleeve, lying along -z from the origin.
 */
function sleeveGeometry(THREE, u) {
	const C = CHOPSTICKS;
	const n = 80;
	const m = 48;
	const pos = [];
	const uv = [];
	const idx = [];
	for (let i = 0; i <= n; i++) {
		const along = i / n;
		for (let j = 0; j <= m; j++) {
			// round from the middle of the underside, so the top is the middle of the canvas
			const a = Math.PI + (j / m) * Math.PI * 2;
			const [x, y] = sleeveSection(along, a);
			pos.push(x * u, y * u, -along * C.length * u);
			uv.push(along, 1 - j / m);
		}
	}
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < m; j++) {
			const a = i * (m + 1) + j;
			const b = a + m + 1;
			idx.push(a, b, a + 1, a + 1, b, b + 1);
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	g.setIndex(idx);
	g.computeVertexNormals();
	return g;
}

/**
 * A chopstick: square at the top, tapering to a slimmer tip, its edges eased.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {number} u Scene units per mm.
 * @returns {import('three').BufferGeometry} The stick along z, its top towards +z, centred.
 */
function stickGeometry(THREE, u) {
	const C = CHOPSTICKS;
	// a four-sided cylinder turned square-on is a tapered square stick
	const g = new THREE.CylinderGeometry((C.top / Math.SQRT2) * u, (C.tip / Math.SQRT2) * u, C.stick * u, 4, 24);
	g.rotateY(Math.PI / 4);
	g.rotateX(Math.PI / 2);
	return g;
}

/**
 * Pale wood's grain: fine streaks along the stick, a little uneven in tone.
 *
 * @param {string} color The wood's colour.
 * @param {string} seed The seed.
 * @returns {HTMLCanvasElement} The texture (u round, v along).
 */
function woodCanvas(color, seed) {
	const [c, g] = canvas2d(128, 512);
	const r = rng(`${seed}:wood`);
	g.fillStyle = color;
	g.fillRect(0, 0, 128, 512);
	for (let i = 0; i < 60; i++) {
		g.fillStyle = mix(color, r.next() < 0.6 ? '#7a5532' : '#ffffff', r.range(0.05, 0.22));
		g.fillRect(r.range(0, 128), 0, r.range(0.5, 2.5), 512);
	}
	return c;
}
