/**
 * @module @logomarks/mockups/three/keynote
 *
 * A keynote: a big screen over a stage, the brand's lockup on a field of
 * its colour, seen from the back of a dark hall over the audience's
 * heads. The screen lights the stage, its two chairs and the heads in its
 * own colour; uplights at the stage's ends wash the wall beside the
 * screen in the brand's colour; a truss of spot fixtures and speakers
 * hangs above. The lens is focused on the screen, so the nearest rows of
 * heads fall softly out of focus. The audience are anonymous silhouettes.
 */

import { reader } from '../util/reader.js';
import { mix } from '../util/color.js';
import { rng } from '../util/rng.js';
import { scene as svgScene } from '../render/scene.js';
import { fitArt } from '../render/fit.js';
import { splashScreen, SPLASH_STYLES } from '../parts/screen/splash.js';
import { brandOf } from '../util/brand.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg } from './printart.js';
import { glowColor } from './glow.js';

/** What the screen shows: the brand's splash, or the art. */
export const KEYNOTE_SCREENS = /** @type {const} */ (['splash', 'art']);

/** The hall, in metres: the screen's width and height and how high its bottom is, the stage's width, depth and height, and where the audience sits (its first and last rows' distance from the wall). */
export const HALL = Object.freeze({ screen: 9.6, screenHeight: 4.1, screenBottom: 1.9, stage: 14, stageDepth: 4, stageHeight: 0.8, rows: [6.5, 14.4] });

/** Scene units per metre. */
const M = 10;

/**
 * The audience: each person's place (x across, z from the wall, metres), their head's size and height, and their lean.
 *
 * @param {string} seed The seed.
 * @returns {{ x: number, z: number, head: number, height: number, lean: number }[]} The people, front row first.
 */
export function audience(seed) {
	const r = rng(`${seed}:audience`);
	/** @type {{ x: number, z: number, head: number, height: number, lean: number }[]} */
	const out = [];
	const [first, last] = HALL.rows;
	for (let z = first; z <= last; z += 0.95) {
		const shift = r.range(-0.2, 0.2);
		for (let x = -9; x <= 9; x += 0.56) {
			// the aisle down the middle, and an empty seat now and then
			if (Math.abs(x + shift) < 0.6 || r.next() < 0.1) continue;
			out.push({ x: x + shift + r.range(-0.06, 0.06), z: z + r.range(-0.05, 0.05), head: r.range(0.095, 0.115), height: r.range(1.1, 1.26), lean: r.range(-0.15, 0.15) });
		}
	}
	return out;
}

/**
 * A keynote on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./keynote.js').KeynoteSceneOptions} options The mark (or a slide), the brand, and how it's shot.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function keynoteScene(canvas, options) {
	const o = reader('keynoteScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const screen = o.oneOf('screen', 'splash', KEYNOTE_SCREENS);
	const { name, color, ink } = brandOf(o, { color: '#2f9e4f' });
	const wash = o.color('wash', color);
	const style = o.oneOf('style', 'stage', SPLASH_STYLES);
	const seed = o.text('seed', 'keynote');
	const H = HALL;
	const shot = {
		...shotOf(o, { ground: '#030303', light: 0, layout: 'upright', fit: 0.92, view: { tilt: -6.2, turn: 0, fov: 34 } }),
		lighting: /** @type {const} */ ('none'),
		toneMapping: /** @type {const} */ ('aces'),
		lens: lensOf(o, { aperture: 0.01, samples: 40 }),
	};
	const px = 120;
	const [w, h] = [Math.round(H.screen * px), Math.round(H.screenHeight * px)];
	const sc = svgScene({ width: w, height: h, key: 'keynote' });
	sc.add(screen === 'art' ? fitArt(sc, art, { x: 0, y: 0, width: w, height: h }, 'cover') : splashScreen(sc, { width: w, height: h, mark: art, name, color, ink, style, scale: o.num('scale', 0.24, 0.05, 0.6) }));
	const picture = await drawSvg(sc.svg(), w, h);

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const { RectAreaLightUniformsLib } = await import('three/addons/lights/RectAreaLightUniformsLib.js');
		const { RoundedBoxGeometry: Rounded } = await import('three/addons/geometries/RoundedBoxGeometry.js');
		RectAreaLightUniformsLib.init();
		const map = keep(new THREE.CanvasTexture(picture));
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = 8;
		const add = (geo, mat, [x, y, z], shadow = true) => {
			const m = new THREE.Mesh(geo, mat);
			m.position.set(x * M, y * M, z * M);
			m.castShadow = m.receiveShadow = shadow;
			scene.add(m);
			return m;
		};
		const matte = (color, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness });
		const sy = H.screenBottom + H.screenHeight / 2;
		// the hall: a dark floor and walls, the screen's wall a little lighter so the washes show on it
		const floor = add(new THREE.PlaneGeometry(60 * M, 60 * M), matte('#0d0d0e', 0.7), [0, 0, 10]);
		floor.rotation.x = -Math.PI / 2;
		add(new THREE.PlaneGeometry(30 * M, 14 * M), matte('#3a3a3c', 0.9), [0, 7, 0]);
		for (const s of [-1, 1]) add(new THREE.PlaneGeometry(40 * M, 14 * M), matte('#0a0a0b'), [s * 12, 7, 15]).rotation.y = -s * (Math.PI / 2);
		// the screen, its own light, and a black border round it
		add(new THREE.PlaneGeometry((H.screen + 0.12) * M, (H.screenHeight + 0.12) * M), matte('#050505', 0.5), [0, sy, 0.05], false);
		add(new THREE.PlaneGeometry(H.screen * M, H.screenHeight * M), new THREE.MeshBasicMaterial({ map, toneMapped: false }), [0, sy, 0.07], false);
		const glow = new THREE.RectAreaLight(glowColor(picture), 14, H.screen * M, H.screenHeight * M);
		glow.position.set(0, sy * M, 0.1 * M);
		scene.add(glow);
		// the stage: a timber floor, its dark front, steps down the middle, two chairs and their side tables
		add(new THREE.BoxGeometry(H.stage * M, H.stageHeight * M, H.stageDepth * M), [matte('#1a1714'), matte('#1a1714'), matte('#a88f72', 0.5), matte('#1a1714'), matte('#4a3b2e', 0.7), matte('#1a1714')], [0, H.stageHeight / 2, H.stageDepth / 2]);
		for (let i = 0; i < 3; i++) {
			const t = (i + 1) / 4;
			add(new THREE.BoxGeometry(2.4 * M, H.stageHeight * (1 - t) * M, 0.36 * M), [matte('#2a221b'), matte('#2a221b'), matte('#8f7b63', 0.55), matte('#2a221b'), matte('#5a4836', 0.7), matte('#2a221b')], [0, (H.stageHeight * (1 - t)) / 2, H.stageDepth + 0.18 + i * 0.36]);
		}
		const cloth = matte('#d8cfc0', 0.9);
		for (const s of [-1, 1]) {
			const x = s * 5.2;
			const y = H.stageHeight;
			add(new Rounded(0.8 * M, 0.4 * M, 0.75 * M, 3, 0.06 * M), cloth, [x, y + 0.32, 2.2]);
			add(new Rounded(0.8 * M, 0.5 * M, 0.16 * M, 3, 0.06 * M), cloth, [x, y + 0.7, 1.9]);
			for (const a of [-1, 1]) add(new Rounded(0.12 * M, 0.5 * M, 0.75 * M, 3, 0.05 * M), cloth, [x + a * 0.42, y + 0.45, 2.2]);
			add(new THREE.CylinderGeometry(0.22 * M, 0.22 * M, 0.03 * M, 24), matte('#d9d4cc', 0.4), [x + s * 0.9, y + 0.55, 2.3]);
			add(new THREE.CylinderGeometry(0.02 * M, 0.02 * M, 0.55 * M, 8), matte('#202020', 0.4), [x + s * 0.9, y + 0.27, 2.3]);
		}
		// the washes: uplights at the stage's ends, the wall beside the screen in the brand's colour
		for (const s of [-1, 1]) {
			const up = new THREE.SpotLight(wash, 60000, 0, 0.62, 1, 2);
			up.position.set(s * (H.screen / 2 + 1.1) * M, (H.stageHeight + 0.1) * M, 0.5 * M);
			up.target.position.set(s * (H.screen / 2 + 1.2) * M, 6 * M, 0);
			scene.add(up, up.target);
		}
		// the truss, its fixtures (lenses lit) and the speakers hanging from it
		const steel = new THREE.MeshStandardMaterial({ color: '#2a2a2c', metalness: 0.6, roughness: 0.45 });
		trussMesh(THREE, scene, steel, { y: 7.6, z: 3.2, span: 18 });
		const lens = new THREE.MeshBasicMaterial({ color: '#ffe9c8', toneMapped: false });
		for (let i = 0; i < 8; i++) {
			const x = (i - 3.5) * 1.6;
			add(new THREE.BoxGeometry(0.34 * M, 0.3 * M, 0.3 * M), matte('#111112', 0.5), [x, 7.2, 3.2]);
			// the head tipped towards the hall, its lens a bright disc
			const head = new THREE.Group();
			const can = new THREE.Mesh(new THREE.CylinderGeometry(0.17 * M, 0.2 * M, 0.38 * M, 24), matte('#0c0c0d', 0.4));
			const disc = new THREE.Mesh(new THREE.CircleGeometry(0.08 * M, 24), lens);
			disc.rotation.x = Math.PI / 2;
			disc.position.y = -0.191 * M;
			head.add(can, disc);
			head.position.set(x * M, 6.85 * M, 3.2 * M);
			head.rotation.x = -0.75;
			scene.add(head);
		}
		for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.7 * M, 2.4 * M, 0.7 * M), matte('#0b0b0c', 0.6), [s * 7.6, 6.2, 3.4]);
		// the audience: heads and shoulders, dark against the light
		const people = audience(seed);
		const skin = new THREE.MeshStandardMaterial({ color: '#141210', roughness: 0.7 });
		const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), skin, people.length);
		const shoulders = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.9 }), people.length);
		const m4 = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const e = new THREE.Euler();
		people.forEach((p, i) => {
			q.setFromEuler(e.set(0, 0, p.lean * 0.3));
			m4.compose(new THREE.Vector3(p.x * M, p.height * M, p.z * M), q, new THREE.Vector3(0.92, 1.18, 1).multiplyScalar(p.head * M));
			heads.setMatrixAt(i, m4);
			m4.compose(new THREE.Vector3(p.x * M, (p.height - 0.27) * M, p.z * M), q, new THREE.Vector3(0.23, 0.15, 0.13).multiplyScalar(M));
			shoulders.setMatrixAt(i, m4);
		});
		scene.add(heads, shoulders);
		// the hall's own faint light, so the truss, the speakers and the edges of things read against the dark
		const house = new THREE.HemisphereLight('#a8b0c0', '#000000', 0.5);
		const spill = new THREE.DirectionalLight('#fff1dc', 0.6);
		spill.position.set(0, 9 * M, 14 * M);
		scene.add(house, spill);
		return { width: 16.5 * M, height: 8.4 * M, center: [0, 3.75 * M, 0], focus: [0, sy * M, 0] };
	});
}

/**
 * A box truss: four chords and their zig-zag lacing, spanning the hall.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('three').Scene} scene The scene.
 * @param {import('three').Material} steel Its material.
 * @param {{ y: number, z: number, span: number }} o Its height, distance from the wall and length, metres.
 */
function trussMesh(THREE, scene, steel, { y, z, span }) {
	const half = 0.2;
	const g = new THREE.Group();
	const bar = (a, b, r) => {
		const d = new THREE.Vector3().subVectors(b, a);
		const m = new THREE.Mesh(new THREE.CylinderGeometry(r * M, r * M, d.length(), 8), steel);
		m.position.copy(a).add(b).multiplyScalar(0.5);
		m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
		g.add(m);
	};
	const corners = [[-half, -half], [-half, half], [half, half], [half, -half]];
	for (const [cy, cz] of corners) bar(new THREE.Vector3((-span / 2) * M, (y + cy) * M, (z + cz) * M), new THREE.Vector3((span / 2) * M, (y + cy) * M, (z + cz) * M), 0.025);
	for (let x = -span / 2; x < span / 2; x += 0.5) {
		corners.forEach(([cy, cz], k) => {
			const [ny, nz] = corners[(k + 1) % 4];
			bar(new THREE.Vector3(x * M, (y + cy) * M, (z + cz) * M), new THREE.Vector3((x + 0.5) * M, (y + ny) * M, (z + nz) * M), 0.012);
		});
	}
	scene.add(g);
}
