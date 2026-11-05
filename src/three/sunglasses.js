/**
 * @module @logomarks/mockups/three/sunglasses
 *
 * The artwork reflected in a pair of sunglasses: glossy acetate frames
 * resting on a ledge, their curved dark lenses reflecting a street (by
 * day, at golden hour or at dusk) with the artwork on a poster behind the
 * camera. The lenses are true curved shells and the rims bend with them,
 * so the reflection bends and shrinks towards their rims as it would; the
 * frames take the same street in their gloss. The street behind the
 * glasses is the same panorama, far out of focus through a long lens; the
 * near lens is sharp. No face, no person.
 */

import { reader } from '../util/reader.js';
import { isHex } from '../util/color.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { resolveSurface } from '../materials/desk.js';
import { deskCanvas, deskMesh, UNIT } from './deskplane.js';
import { streetCanvas, STREET_TIMES } from './streetenv.js';
import { artHref } from '../render/art.js';
import { canvas2d } from '../render/image.js';

/** The frame's finishes: glossy black, crystal grey, and a warm brown. */
export const SUNGLASS_FRAMES = Object.freeze({ black: '#0b0b0c', smoke: '#3c3d40', havana: '#4a2c1c' });

/** The lenses: dark smoke glass, or a mirror coating. */
export const SUNGLASS_LENSES = /** @type {const} */ (['smoke', 'mirror']);

/** The glasses, in mm: a lens's half-width and half-height, the rim round it (top, sides, bottom), the bridge, the frame's depth, and the temples' length. */
export const GLASSES = Object.freeze({ a: 27, b: 20, top: 6, side: 4, bottom: 3.2, bridge: 17, depth: 4, temple: 140, curve: 100 });

/**
 * How far a point on a lens (or its rim) sits behind the lens's centre: the lens is a sphere's cap, and the rim bends with it.
 *
 * @param {number} x Across, mm from the lens's centre.
 * @param {number} y Up, mm.
 * @returns {number} The sag, mm.
 */
export const sag = (x, y) => (x * x + y * y) / (2 * GLASSES.curve);

/**
 * A lens's outline, in mm round its centre: a squarish superellipse, narrower at the bottom, its outer top corner lifted.
 *
 * @param {number} t The angle round it, radians.
 * @returns {[number, number]} The point (x outward to the temple's side, y up).
 */
export function lensPoint(t) {
	const G = GLASSES;
	const c = Math.cos(t);
	const s = Math.sin(t);
	const n = 2.9;
	let x = Math.sign(c) * Math.abs(c) ** (2 / n) * G.a;
	let y = Math.sign(s) * Math.abs(s) ** (2 / n) * G.b;
	if (y < 0) x *= 1 - 0.2 * (-y / G.b);
	if (y > 0 && x > 0) y += 2.5 * (x / G.a) * (y / G.b);
	return [x, y];
}

/**
 * The outline sampled evenly round, each point with its outward normal.
 *
 * @param {number} steps How many points.
 * @returns {{ p: [number, number], n: [number, number] }[]} The points (mm) and normals.
 */
export function lensOutline(steps) {
	const pts = Array.from({ length: steps }, (_, i) => lensPoint((i / steps) * Math.PI * 2));
	return pts.map((p, i) => {
		const a = pts[(i + steps - 1) % steps];
		const b = pts[(i + 1) % steps];
		const tx = b[0] - a[0];
		const ty = b[1] - a[1];
		const l = Math.hypot(tx, ty) || 1;
		return { p, n: [ty / l, -tx / l] };
	});
}

/**
 * Sunglasses with the artwork reflected in them, on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./sunglasses.js').SunglassesSceneOptions} options The artwork (inline), and the glasses and street.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function sunglassesScene(canvas, options) {
	const o = reader('sunglassesScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const time = o.oneOf('time', 'day', /** @type {(keyof typeof STREET_TIMES)[]} */ (Object.keys(STREET_TIMES)));
	const lensKind = o.oneOf('lens', 'smoke', SUNGLASS_LENSES);
	const frameName = o.raw('frame') ?? 'black';
	const frame = typeof frameName === 'string' && Object.hasOwn(SUNGLASS_FRAMES, frameName) ? SUNGLASS_FRAMES[/** @type {keyof typeof SUNGLASS_FRAMES} */ (frameName)] : isHex(frameName) ? /** @type {string} */ (frameName) : null;
	if (!frame) throw new TypeError(`sunglassesScene: frame is 'black', 'smoke', 'havana' or a hex colour (got ${JSON.stringify(frameName)})`);
	const seed = o.text('seed', 'sunglasses');
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), 'concrete');
	const shot = { ...shotOf(o, { ground: '#000000', light: 0.6, layout: 'upright', fit: 0.86, view: { tilt: 16, turn: -26, fov: 24 } }), lighting: /** @type {const} */ ('none'), toneMapping: /** @type {const} */ ('aces'), lens: lensOf(o, { aperture: 0.012, samples: 32 }) };
	const desk = await deskCanvas(surf, { span: 900, light: 0.6, seed });
	const img = new Image();
	img.src = artHref(art);
	await img.decode();

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const street = keep(new THREE.CanvasTexture(streetCanvas(img, { time, seed })));
		street.mapping = THREE.EquirectangularReflectionMapping;
		street.colorSpace = THREE.SRGBColorSpace;
		scene.environment = street;
		scene.background = street;
		scene.backgroundBlurriness = 0.45;
		scene.backgroundIntensity = 0.9;
		scene.environmentIntensity = 1;
		scene.add(deskMesh(THREE, desk, surf.texture, 5));

		const u = 1 / UNIT;
		// each takes the street as its own map: three.js only honours a material's intensity when it has one
		const acetate = new THREE.MeshPhysicalMaterial({ color: frame, envMap: street, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.8 });
		const glass =
			lensKind === 'mirror'
				? new THREE.MeshPhysicalMaterial({ color: '#7d7f84', envMap: street, metalness: 1, roughness: 0.02, envMapIntensity: 1.1 })
				: new THREE.MeshPhysicalMaterial({ color: '#050506', envMap: street, roughness: 0.015, ior: 2.1, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.8 });
		const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
		const glasses = glassesMesh(THREE, RoundedBoxGeometry, { acetate, glass, u });
		scene.add(glasses.group, contactShadow(THREE, keep, glasses.width));

		// the low sun: a warm key behind the glasses' left, its shadow soft on the ledge; the sky fills
		const sun = new THREE.DirectionalLight('#ffe2bd', time === 'dusk' ? 0.6 : 2.6);
		sun.position.set(-1.6, 2.4, -1.4);
		sun.castShadow = true;
		sun.shadow.mapSize.set(2048, 2048);
		sun.shadow.camera.left = sun.shadow.camera.bottom = -1.4;
		sun.shadow.camera.right = sun.shadow.camera.top = 1.4;
		sun.shadow.radius = 6;
		sun.shadow.bias = -0.0004;
		sun.shadow.normalBias = 0.004;
		scene.add(sun);
		return { width: glasses.width, height: glasses.height, center: glasses.center, focus: glasses.focus };
	});
}

/**
 * The glasses: two rims of polished acetate, each a rounded profile swept round its lens, a bridge arching between
 * them, curved lenses, and the temples open behind; resting on the ground on the rims and the temples' tips.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {typeof import('three/addons/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry} Rounded The rounded box.
 * @param {{ acetate: import('three').Material, glass: import('three').Material, u: number }} o The materials, and scene units per mm.
 * @returns {{ group: import('three').Group, width: number, height: number, center: [number, number, number], focus: [number, number, number] }} The glasses on the ground, their size, the point to look at, and the near lens's centre to focus on.
 */
export function glassesMesh(THREE, Rounded, { acetate, glass, u }) {
	const G = GLASSES;
	const front = new THREE.Group();
	const cx = G.a + G.bridge / 2;
	const add = (parent, geo, mat) => {
		const m = new THREE.Mesh(geo, mat);
		m.castShadow = m.receiveShadow = true;
		parent.add(m);
		return m;
	};
	/** @type {import('three').Object3D[]} */
	const tips = [];
	/** @type {import('three').Object3D[]} */
	const rims = [];
	for (const side of [-1, 1]) {
		const half = new THREE.Group();
		rims.push(add(half, rimGeometry(THREE, side, u), acetate));
		// the lens sits in the rim's groove, a little behind its front
		add(half, lensGeometry(THREE, side, u), glass).position.z = G.depth * 0.6 * u;
		half.position.x = side * cx * u;
		// the face form: each half wrapped back a little at its outer edge
		half.rotation.y = side * -0.09;
		front.add(half);
		// the end piece, and the temple open behind it, splayed a touch, its tip bent down
		const temple = new THREE.Group();
		add(temple, new Rounded(5.5 * u, 10 * u, 14 * u, 3, 2 * u), acetate).position.set(-side * 1.5 * u, 0, 2 * u);
		add(temple, new Rounded(3.6 * u, 8.5 * u, G.temple * u, 3, 1.6 * u), acetate).position.z = (-G.temple / 2) * u;
		const tip = add(temple, new Rounded(3.4 * u, 6.5 * u, 36 * u, 3, 1.6 * u), acetate);
		tips.push(tip);
		tip.position.set(0, -10 * u, (-G.temple - 12) * u);
		tip.rotation.x = 0.6;
		temple.position.set(side * (cx + G.a + 2) * u, 10 * u, 0);
		temple.rotation.y = side * 0.05;
		front.add(temple);
	}
	// the bridge: a rounded bar arching from rim to rim
	const w = (G.bridge / 2 - 1.5) * u;
	const arch = new THREE.CatmullRomCurve3([new THREE.Vector3(-w, 9 * u, 0), new THREE.Vector3(0, 10.5 * u, 0), new THREE.Vector3(w, 9 * u, 0)]);
	const bridge = add(front, new THREE.TubeGeometry(arch, 24, 2.8 * u, 16, false), acetate);
	bridge.scale.set(1, 1.25, 0.8);
	bridge.position.z = G.depth * 0.5 * u;
	// tipped back until the rims and the temples' tips both touch the ground
	const group = new THREE.Group();
	group.add(front);
	const lowest = (list) => Math.min(...list.map((m) => new THREE.Box3().setFromObject(m, true).min.y));
	let [lo, hi] = [-0.4, 0.4];
	for (let i = 0; i < 24; i++) {
		front.rotation.x = (lo + hi) / 2;
		front.updateMatrixWorld(true);
		if (lowest(tips) < lowest(rims)) lo = front.rotation.x;
		else hi = front.rotation.x;
	}
	const box = new THREE.Box3().setFromObject(front, true);
	front.position.y = -box.min.y;
	front.position.z = -(box.min.z + box.max.z) / 2;
	front.updateMatrixWorld(true);
	const near = new THREE.Vector3(-cx * u, 0, G.depth * u).applyMatrix4(front.matrixWorld);
	const width = (2 * (cx + G.a + G.side) + 6) * u;
	const height = (G.b * 2 + G.top + G.bottom) * u;
	return { group, width, height, center: [0, height * 0.5, near.z], focus: [near.x, near.y, near.z] };
}

/**
 * A rim: a rounded profile (fuller at the brow, slimmer at the bottom) swept round the lens's outline.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {number} side Which rim (−1 left, 1 right).
 * @param {number} u Scene units per mm.
 * @returns {import('three').BufferGeometry} The rim, its back at z = 0.
 */
function rimGeometry(THREE, side, u) {
	const G = GLASSES;
	const steps = 128;
	const ring = 28;
	const outline = lensOutline(steps);
	const pos = [];
	for (const { p, n } of outline) {
		// the rim's width here: the brow at the top, the sides, the slimmer bottom
		const up = Math.max(0, n[1]) ** 2;
		const down = Math.max(0, -n[1]) ** 2;
		const w = G.side + (G.top - G.side) * up + (G.bottom - G.side) * down;
		for (let j = 0; j < ring; j++) {
			const a = (j / ring) * Math.PI * 2;
			// a rounded rectangle in profile: across the rim (from just inside the lens's edge) and through its depth
			const c = Math.cos(a);
			const s = Math.sin(a);
			const k = 2 / 2.8;
			const across = (w + 1) / 2 + (Math.sign(c) * Math.abs(c) ** k * (w + 1)) / 2 - 1;
			const depth = G.depth / 2 + (Math.sign(s) * Math.abs(s) ** k * G.depth) / 2;
			const x = p[0] + n[0] * across;
			const y = p[1] + n[1] * across;
			pos.push(side * x * u, y * u, (depth - sag(x, y)) * u);
		}
	}
	const idx = [];
	for (let i = 0; i < steps; i++) {
		for (let j = 0; j < ring; j++) {
			const a = i * ring + j;
			const b = ((i + 1) % steps) * ring + j;
			const c = i * ring + ((j + 1) % ring);
			const d = ((i + 1) % steps) * ring + ((j + 1) % ring);
			if (side > 0) idx.push(a, c, b, b, c, d);
			else idx.push(a, b, c, b, d, c);
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setIndex(idx);
	g.computeVertexNormals();
	return g;
}

/**
 * A curved lens: rings from its centre out to its outline (grown a little), each point sunk onto the sphere so it bulges forward.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {number} side Which lens (−1 left, 1 right).
 * @param {number} u Scene units per mm.
 * @returns {import('three').BufferGeometry} The lens, facing +z.
 */
function lensGeometry(THREE, side, u) {
	const rings = 18;
	const steps = 96;
	const pos = [];
	const idx = [];
	pos.push(0, 0, 0);
	for (let k = 1; k <= rings; k++) {
		for (let i = 0; i < steps; i++) {
			const [x, y] = lensPoint((i / steps) * Math.PI * 2);
			// grown 1 mm past its opening, into the groove
			const f = (k / rings) * 1.015;
			const px = side * x * f;
			const py = y * f;
			pos.push(px * u, py * u, -sag(px, py) * u);
		}
	}
	for (let i = 0; i < steps; i++) idx.push(0, 1 + i, 1 + ((i + 1) % steps));
	for (let k = 1; k < rings; k++) {
		for (let i = 0; i < steps; i++) {
			const a = 1 + (k - 1) * steps + i;
			const b = 1 + (k - 1) * steps + ((i + 1) % steps);
			idx.push(a, a + steps, b, b, a + steps, b + steps);
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	// wound for +z on the right lens; the left lens is mirrored, so it winds the other way
	g.setIndex(side > 0 ? idx : idx.map((_, i) => idx[i - (i % 3) + [0, 2, 1][i % 3]]));
	g.computeVertexNormals();
	return g;
}

/**
 * The soft shade where the rims and the temples' tips meet the ledge: the sky's light blocked close to them.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {<T extends { dispose(): void }>(t: T) => T} keep Keeps a texture to free with the scene.
 * @param {number} width The glasses' width.
 * @returns {import('three').Mesh} A clear plane just over the ground.
 */
function contactShadow(THREE, keep, width) {
	const [c, g] = canvas2d(256, 256);
	const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
	grad.addColorStop(0, 'rgba(0,0,0,0.55)');
	grad.addColorStop(0.5, 'rgba(0,0,0,0.2)');
	grad.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, 256, 256);
	const map = keep(new THREE.CanvasTexture(c));
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.05, width * 1.3), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }));
	mesh.rotation.x = -Math.PI / 2;
	mesh.position.y = 0.0008;
	return mesh;
}
