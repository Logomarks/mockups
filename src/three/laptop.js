/**
 * @module @logomarks/mockups/three/laptop
 *
 * A laptop in a dark room: a generic clamshell (a thin metal base, a lid
 * with even black bezels; no maker's shapes or marks) open on a dark
 * shelf against a dark wall, its screen a soft field of the brand's
 * colour with the lockup in the middle. The screen is the only real light:
 * it falls on the shelf and the keyboard deck in its own colour and fades
 * into the room. Seen straight on, the camera a little above the deck.
 */

import { reader } from '../util/reader.js';
import { mix } from '../util/color.js';
import { scene as svgScene } from '../render/scene.js';
import { fitArt } from '../render/fit.js';
import { LAPTOP } from '../objects/laptop.js';
import { resolveBody } from '../materials/body.js';
import { splashScreen, SPLASH_STYLES } from '../parts/screen/splash.js';
import { brandOf } from '../util/brand.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg } from './printart.js';
import { glowColor } from './glow.js';
import { roundedShape } from './card.js';
import { studioEnvironment } from './studioenv.js';
import { UNIT } from './deskplane.js';

/** What the screen shows: the brand's splash (its lockup on its colour), or the art. */
export const LAPTOP_SCREENS = /** @type {const} */ (['splash', 'art']);

/** The screen's width in mm (inside the bezels) and its proportions. */
const SCREEN = Object.freeze({ width: LAPTOP.width - 2 * LAPTOP.side, aspect: 1.6 });

/**
 * Where the screen sits on the lid and how the lid stands: the hinge, the lid's lean, and the screen's centre and size, in mm.
 *
 * @returns {{ hinge: [number, number, number], lean: number, center: [number, number, number], width: number, height: number }} The hinge (on the base's back edge), the lean (radians past upright), and the screen.
 */
export function laptopScreen() {
	const L = LAPTOP;
	const lean = (L.lean * Math.PI) / 180;
	const hinge = /** @type {[number, number, number]} */ ([0, L.base - 1, -L.depth / 2 + 5]);
	const h = SCREEN.width / SCREEN.aspect;
	// up the lid from the hinge: the chin, then half the screen
	const along = L.lid - L.top - h / 2;
	const out = L.shell - 0.9;
	return {
		hinge,
		lean,
		center: [0, hinge[1] + Math.cos(lean) * along + Math.sin(lean) * out, hinge[2] - Math.sin(lean) * along + Math.cos(lean) * out],
		width: SCREEN.width,
		height: h,
	};
}

/**
 * A laptop in a dark room, on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./laptop.js').LaptopSceneOptions} options The mark (or a page), the brand, and how it's shot.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function laptopScene(canvas, options) {
	const o = reader('laptopScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const screen = o.oneOf('screen', 'splash', LAPTOP_SCREENS);
	const { name, color, ink } = brandOf(o, { color: '#4a3bd2' });
	const style = o.oneOf('style', 'corner', SPLASH_STYLES);
	const room = o.color('ground', '#121213');
	const body = resolveBody(o.raw('finish') ?? 'black', 'laptopScene');
	const S = laptopScreen();
	const shot = {
		...shotOf(o, { ground: room, light: 0, layout: 'upright', fit: 0.74, view: { tilt: -4, turn: 0, fov: 22 } }),
		lighting: /** @type {const} */ ('none'),
		toneMapping: /** @type {const} */ ('aces'),
		lens: lensOf(o, { aperture: 0.01, samples: 32 }),
	};
	const px = 6;
	const [w, h] = [Math.round(S.width * px), Math.round(S.height * px)];
	const sc = svgScene({ width: w, height: h, key: 'laptop' });
	sc.add(screen === 'art' ? fitArt(sc, art, { x: 0, y: 0, width: w, height: h }, 'cover') : splashScreen(sc, { width: w, height: h, mark: art, name, color, ink, style, scale: o.num('scale', 0.2, 0.05, 0.6) }));
	const picture = await drawSvg(sc.svg(), w, h);
	const glow = glowColor(picture);

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const { RectAreaLightUniformsLib } = await import('three/addons/lights/RectAreaLightUniformsLib.js');
		RectAreaLightUniformsLib.init();
		const u = 1 / UNIT;
		const L = LAPTOP;
		scene.environment = keep(studioEnvironment(THREE, { light: 0.3 }));
		scene.environmentIntensity = 0.35;
		const map = keep(new THREE.CanvasTexture(picture));
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = 8;
		const metal = new THREE.MeshPhysicalMaterial({ color: body.color, metalness: 0.55, roughness: 0.42, clearcoat: 0.3 });
		const add = (geo, mat) => {
			const m = new THREE.Mesh(geo, mat);
			m.castShadow = m.receiveShadow = true;
			scene.add(m);
			return m;
		};
		const slab = (w0, d0, t, r) => new THREE.ExtrudeGeometry(roundedShape(THREE, w0 * u, d0 * u, r * u), { depth: (t - 2) * u, bevelEnabled: true, bevelThickness: 1 * u, bevelSize: 1 * u, bevelSegments: 4, curveSegments: 16 });
		// the base, lying; its deck, a dark keyboard well
		const base = add(slab(L.width - 2, L.depth - 2, L.base, L.radius), metal);
		base.rotation.x = -Math.PI / 2;
		base.position.y = 1 * u;
		const deck = add(new THREE.PlaneGeometry((L.width - 50) * u, 100 * u), new THREE.MeshStandardMaterial({ color: '#0c0c0d', roughness: 0.7 }));
		deck.rotation.x = -Math.PI / 2;
		deck.position.set(0, (L.base + 0.05) * u, -40 * u);
		// the lid, leaning back from the hinge, the screen on it behind glass
		const lid = new THREE.Group();
		const shell = new THREE.Mesh(slab(L.width - 2, L.lid, L.shell, L.radius), metal);
		shell.position.set(0, (L.lid / 2) * u, 0);
		shell.castShadow = true;
		const bezel = new THREE.Mesh(new THREE.ShapeGeometry(roundedShape(THREE, (L.width - 4) * u, (L.lid - 2) * u, (L.radius - 1) * u), 16), new THREE.MeshPhysicalMaterial({ color: '#060606', roughness: 0.15, clearcoat: 1 }));
		bezel.position.set(0, (L.lid / 2) * u, (L.shell - 0.95) * u);
		const pane = new THREE.Mesh(new THREE.PlaneGeometry(S.width * u, S.height * u), new THREE.MeshBasicMaterial({ map, toneMapped: false }));
		pane.position.set(0, (L.lid - L.top - S.height / 2) * u, (L.shell - 0.9) * u);
		const gloss = new THREE.Mesh(pane.geometry, new THREE.MeshPhysicalMaterial({ color: '#000000', transparent: true, opacity: 0.06, roughness: 0.05, clearcoat: 1, envMapIntensity: 6 }));
		gloss.position.copy(pane.position).setZ((L.shell - 0.85) * u);
		lid.add(shell, bezel, pane, gloss);
		lid.position.set(...S.hinge.map((v) => v * u));
		lid.rotation.x = -S.lean;
		scene.add(lid);
		// the shelf and the wall behind it
		const shelf = add(new THREE.BoxGeometry(30, 0.5, 4), new THREE.MeshStandardMaterial({ color: mix(room, '#ffffff', 0.03), roughness: 0.5 }));
		shelf.position.set(0, -0.25, (L.depth / 2 + 40) * u - 2);
		const wall = add(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: mix(room, '#ffffff', 0.1), roughness: 0.95 }));
		wall.position.set(0, 4, -3);
		// the screen's light, its colour, from its face
		const light = new THREE.RectAreaLight(glow, 9, S.width * u, S.height * u);
		light.position.set(...S.center.map((v) => v * u));
		light.rotation.x = -S.lean;
		// the room's own dim light: enough to find the shelf, the wall and the laptop's edges
		const fill = new THREE.DirectionalLight('#c8ccd4', 0.9);
		fill.position.set(-1.5, 3, 4);
		scene.add(light, fill, new THREE.HemisphereLight('#ffffff', '#303030', 2.4));
		return { width: (L.width + 10) * u, height: (L.lid + L.base) * u, center: [0, (L.base + 105) * u, 0], focus: S.center.map((v) => v * u) };
	});
}
