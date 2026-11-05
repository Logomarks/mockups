/**
 * @module @logomarks/mockups/three/phone
 *
 * A phone in 3D, generic: a rounded slab with a metal frame (its edges
 * rounded into the glass), side buttons, and the screen behind glossy
 * glass that reflects a soft studio. Two shots. `'corner'` is a macro of
 * the phone lying on a surface: its top corner, the time, and the brand's
 * app first on the home screen among generic apps, the lens focused on
 * the brand's icon and everything else falling out of focus. `'pair'` is
 * two phones floating straight on in front of a wall of glazed tiles,
 * their shadows soft on the tiles: the brand's page and its menu, or two
 * screenshots. No maker's shapes, icons or marks.
 */

import { reader } from '../util/reader.js';
import { mix } from '../util/color.js';
import { scene as svgScene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { fitArt } from '../render/fit.js';
import { PHONE } from '../objects/phone.js';
import { resolveBody } from '../materials/body.js';
import { appsScreen } from '../parts/screen/apps.js';
import { brandUi } from '../parts/screen/brandui.js';
import { brandOf } from '../util/brand.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg } from './printart.js';
import { roundedShape } from './card.js';
import { studioEnvironment } from './studioenv.js';
import { UNIT } from './deskplane.js';

/** The shots: a macro of the corner, or two phones on a tiled wall. */
export const PHONE_SCENE_LAYOUTS = /** @type {const} */ (['corner', 'pair']);

/** What the pair's screens show: the brand's page and its menu, composed from the mark, or the art (and `back`) as screenshots. */
export const PHONE_SCREENS = /** @type {const} */ (['ui', 'art']);

/** The tiles on the pair's wall, in mm: width, height, the grout between them, and their depth. */
export const TILE = Object.freeze({ width: 15, height: 24, grout: 1.4, depth: 3 });

/** The screen texture's pixels per mm. */
const PX = 22;

/**
 * The brand's app on the home screen: where its icon's centre is on the phone's face, in mm from the phone's centre (y up).
 *
 * @returns {[number, number]} The point.
 */
export function iconPoint() {
	const sw = PHONE.width - 2 * PHONE.bezel;
	const k = sw / 1080;
	const cell = (1080 - 128) / 4;
	return [-PHONE.width / 2 + PHONE.bezel + (64 + cell / 2) * k, PHONE.height / 2 - PHONE.bezel - (230 + cell * 0.37) * k];
}

/**
 * The tiles of a wall, each tile's centre and its colour's nudge, row by row, centred on the origin.
 *
 * @param {{ width: number, height: number, seed?: string }} o The wall's size in mm.
 * @returns {{ x: number, y: number, shade: number }[]} The tiles (mm), and each one's shade, −1–1.
 */
export function tileGrid({ width, height }) {
	const pw = TILE.width + TILE.grout;
	const ph = TILE.height + TILE.grout;
	const cols = Math.ceil(width / pw);
	const rows = Math.ceil(height / ph);
	/** @type {{ x: number, y: number, shade: number }[]} */
	const out = [];
	for (let j = 0; j < rows; j++) {
		for (let i = 0; i < cols; i++) {
			// a fixed hash, so the same wall comes back every time
			const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
			out.push({ x: (i - (cols - 1) / 2) * pw, y: (j - (rows - 1) / 2) * ph, shade: (h - Math.floor(h)) * 2 - 1 });
		}
	}
	return out;
}

/**
 * The phone's face drawn: black glass, and the screen inside its bezel with rounded corners.
 *
 * @param {(sc: import('../render/scene.js').Scene, w: number, h: number) => string} draw Draws the screen in `[0, w] × [0, h]`.
 * @param {string} key The drawing's key.
 * @returns {Promise<HTMLCanvasElement>} The face, at PX per mm.
 */
export function faceCanvas(draw, key) {
	const W = Math.round(PHONE.width * PX);
	const H = Math.round(PHONE.height * PX);
	const b = PHONE.bezel * PX;
	const sc = svgScene({ width: W, height: H, key });
	const clip = sc.id('screen');
	sc.def(el('clipPath', { id: clip }, el('rect', { x: b, y: b, width: W - 2 * b, height: H - 2 * b, rx: PHONE.screenRadius * PX })));
	sc.add(el('rect', { width: W, height: H, fill: '#050506' }), el('g', { 'clip-path': `url(#${clip})` }, el('g', { transform: `translate(${b} ${b})` }, draw(sc, W - 2 * b, H - 2 * b))));
	return drawSvg(sc.svg(), W, H);
}

/**
 * A phone, standing, its screen facing +z, centred on the origin.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {typeof import('three/addons/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry} Rounded The rounded box.
 * @param {{ face: import('three').Texture, metal: import('three').Material, u: number }} o The face's texture, the frame's material, and scene units per mm.
 * @returns {import('three').Group} The phone.
 */
export function phoneMesh(THREE, Rounded, { face, metal, u }) {
	const P = PHONE;
	const edge = 1.3;
	const shape = roundedShape(THREE, (P.width - 2 * edge) * u, (P.height - 2 * edge) * u, (P.radius - edge) * u);
	// the slab: flat sides of metal, rounded into the glass front and back
	const back = new THREE.MeshPhysicalMaterial({ color: '#1a1b1e', roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 });
	const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: (P.depth - 2 * edge) * u, bevelEnabled: true, bevelThickness: edge * u, bevelSize: edge * u, bevelSegments: 8, curveSegments: 24 }), [back, metal]);
	body.position.z = (-P.depth / 2 + edge) * u;
	// the face: the screen under glass, its own light, the studio in its gloss
	const glass = new THREE.ShapeGeometry(roundedShape(THREE, (P.width - 2 * edge - 0.2) * u, (P.height - 2 * edge - 0.2) * u, (P.radius - edge - 0.1) * u), 24);
	const pos = glass.attributes.position;
	const uv = glass.attributes.uv;
	for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (P.width * u) + 0.5, pos.getY(i) / (P.height * u) + 0.5);
	const screen = new THREE.Mesh(glass, new THREE.MeshPhysicalMaterial({ color: '#000000', emissive: '#ffffff', emissiveMap: face, emissiveIntensity: 1, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.7 }));
	screen.position.z = (P.depth / 2 + 0.02) * u;
	const phone = new THREE.Group();
	phone.add(body, screen);
	// the buttons: an action key and the volume rocker on the left, the side key on the right
	for (const [side, y, len] of [[-1, 50, 7], [-1, 36, 12], [-1, 21, 12], [1, 30, 18]]) {
		const key = new THREE.Mesh(new Rounded(1.6 * u, len * u, 3 * u, 2, 0.7 * u), metal);
		key.position.set(side * (P.width / 2 + 0.25) * u, y * u, 0);
		phone.add(key);
	}
	phone.traverse((m) => {
		if (m instanceof THREE.Mesh) m.castShadow = m.receiveShadow = true;
	});
	return phone;
}

/**
 * A phone scene on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./phone.js').PhoneSceneOptions} options The mark (or screenshots), the brand, and how it's shot.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function phoneScene(canvas, options) {
	const o = reader('phoneScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const back = /** @type {import('../types.js').Art | undefined} */ (o.raw('back'));
	const layout = o.oneOf('layout', 'corner', PHONE_SCENE_LAYOUTS);
	const screens = o.oneOf('screen', back ? 'art' : 'ui', PHONE_SCREENS);
	const fill = o.oneOf('fill', 'cover', /** @type {const} */ (['cover', 'top']));
	const brand = brandOf(o, { color: '#1f5c4c' });
	const { color, ink } = brand;
	const name = brand.name || 'Brand';
	const body = resolveBody(o.raw('finish') ?? (layout === 'corner' ? 'graphite' : 'silver'), 'phoneScene');
	const corner = layout === 'corner';
	const background = o.color('background', corner ? mix(color, '#0d0e10', 0.62) : '#f2b134');
	const wallpaper = o.color('wallpaper', corner ? '#0b0c0e' : mix(color, '#000000', 0.55));
	const seed = o.text('seed', 'phone');
	const shot = {
		...shotOf(o, { ground: background, light: -0.4, layout: 'upright', fit: corner ? 0.9 : 0.9, view: corner ? { tilt: 38, turn: -30, fov: 26 } : { tilt: 0, turn: 0, fov: 18 } }),
		lighting: /** @type {const} */ ('none'),
		lens: lensOf(o, corner ? { aperture: 0.05, samples: 40 } : { aperture: 0.006, samples: 24 }),
	};
	const faces = corner
		? [await faceCanvas((sc, w, h) => appsScreen(sc, { width: w, height: h, mark: art, name, color, ink, wallpaper, hole: PHONE.hole * PX }), `apps:${seed}`)]
		: screens === 'art'
			? await Promise.all([art, back ?? art].map((a, i) => faceCanvas((sc, w, h) => fitArt(sc, a, { x: 0, y: 0, width: w, height: h }, fill), `shot${i}:${seed}`)))
			: await Promise.all(/** @type {const} */ (['page', 'menu']).map((state) => faceCanvas((sc, w, h) => brandUi(sc, { width: w, height: h, mark: art, name, color, state, seed }), `${state}:${seed}`)));

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
		const u = 1 / UNIT;
		scene.environment = keep(studioEnvironment(THREE, { light: -0.4 }));
		scene.environmentIntensity = corner ? 1.1 : 0.9;
		const metal = new THREE.MeshPhysicalMaterial({ color: body.color, metalness: 1, roughness: corner ? 0.26 : 0.28, envMapIntensity: corner ? 1.8 : 1.2 });
		const textures = faces.map((c) => {
			const t = keep(new THREE.CanvasTexture(c));
			t.colorSpace = THREE.SRGBColorSpace;
			t.anisotropy = 16;
			return t;
		});
		return corner ? cornerSet(THREE, RoundedBoxGeometry, scene, { face: textures[0], metal, background, u }) : pairSet(THREE, RoundedBoxGeometry, scene, { faces: textures, metal, wall: background, u });
	});
}

/**
 * The corner macro: the phone lying turned on a matte surface, lit by a soft key, the camera close over its top corner.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {typeof import('three/addons/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry} Rounded The rounded box.
 * @param {import('three').Scene} scene The scene.
 * @param {{ face: import('three').Texture, metal: import('three').Material, background: string, u: number }} o The face, the frame, the surface's colour, units per mm.
 * @returns {import('./shot.js').Group} What to frame, and the brand's icon to focus on.
 */
function cornerSet(THREE, Rounded, scene, { face, metal, background, u }) {
	const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: background, roughness: 0.8, envMapIntensity: 0.4 }));
	ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;
	const phone = phoneMesh(THREE, Rounded, { face, metal, u });
	phone.rotation.set(-Math.PI / 2, 0, -0.3);
	phone.position.y = (PHONE.depth / 2) * u;
	const key = new THREE.DirectionalLight('#ffffff', 2.2);
	key.position.set(-1.6, 2.2, -0.4);
	key.castShadow = true;
	key.shadow.mapSize.set(2048, 2048);
	key.shadow.camera.left = key.shadow.camera.bottom = -1.2;
	key.shadow.camera.right = key.shadow.camera.top = 1.2;
	key.shadow.radius = 8;
	key.shadow.bias = -0.0004;
	scene.add(ground, phone, key, new THREE.HemisphereLight('#ffffff', background, 0.6));
	phone.updateMatrixWorld(true);
	const [ix, iy] = iconPoint();
	const at = (x, y) => /** @type {[number, number, number]} */ (new THREE.Vector3(x * u, y * u, (PHONE.depth / 2) * u).applyMatrix4(phone.matrixWorld).toArray());
	return { width: 0.34, height: 0.3, center: at(ix + 3, iy + 1), focus: at(ix + 3, iy + 2) };
}

/**
 * The pair: two phones floating straight on before a wall of glazed tiles, a soft light above casting their shadows on it.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {typeof import('three/addons/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry} Rounded The rounded box.
 * @param {import('three').Scene} scene The scene.
 * @param {{ faces: import('three').Texture[], metal: import('three').Material, wall: string, u: number }} o The two faces, the frame, the tiles' colour, units per mm.
 * @returns {import('./shot.js').Group} What to frame.
 */
function pairSet(THREE, Rounded, scene, { faces, metal, wall, u }) {
	const gap = 26;
	const span = { width: 560, height: 380 };
	const tiles = tileGrid(span);
	const glaze = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.8 });
	const grid = new THREE.InstancedMesh(new Rounded(TILE.width * u, TILE.height * u, TILE.depth * u, 3, 0.9 * u), glaze, tiles.length);
	const m = new THREE.Matrix4();
	const c = new THREE.Color();
	tiles.forEach((t, i) => {
		m.makeTranslation(t.x * u, t.y * u, (TILE.depth / 2) * u);
		grid.setMatrixAt(i, m);
		grid.setColorAt(i, c.set(mix(wall, t.shade > 0 ? '#ffffff' : '#000000', Math.abs(t.shade) * 0.035)));
	});
	grid.receiveShadow = true;
	const grout = new THREE.Mesh(new THREE.PlaneGeometry(span.width * u * 1.2, span.height * u * 1.2), new THREE.MeshStandardMaterial({ color: mix(wall, '#8f9aa6', 0.7), roughness: 0.9 }));
	grout.receiveShadow = true;
	scene.add(grid, grout);
	const z = 24;
	faces.forEach((face, i) => {
		const phone = phoneMesh(THREE, Rounded, { face, metal, u });
		phone.position.set((i ? 1 : -1) * ((PHONE.width + gap) / 2) * u, 0, z * u);
		scene.add(phone);
	});
	// a large soft light high in front, so each phone's shadow falls below it on the tiles
	const key = new THREE.DirectionalLight('#ffffff', 1.1);
	key.position.set(-0.5, 1.2, 3);
	key.castShadow = true;
	key.shadow.mapSize.set(2048, 2048);
	key.shadow.camera.left = key.shadow.camera.bottom = -2.5;
	key.shadow.camera.right = key.shadow.camera.top = 2.5;
	key.shadow.radius = 22;
	key.shadow.blurSamples = 24;
	key.shadow.bias = -0.0005;
	scene.add(key, new THREE.HemisphereLight('#ffffff', '#e4ded4', 1.35));
	return { width: (2 * PHONE.width + gap) * u * 1.3, height: PHONE.height * u * 1.08, center: [0, 0, z * u], focus: [0, 0, (z + PHONE.depth / 2) * u] };
}
