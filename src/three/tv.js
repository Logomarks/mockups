/**
 * @module @logomarks/mockups/three/tv
 *
 * A television in a dark room, its screen live: whatever the page draws on
 * a canvas (a shader, an effect, a feed), a video, or a picture. A CRT is
 * an old cabinet set (wood veneer, cream or black plastic) on splayed legs,
 * with a bezel, a control panel (two knobs, a speaker grille) and rabbit
 * ears; its bulging face shows the picture through the tube's curve,
 * scanlines and glow. A flat TV is a thin panel on a foot, its glass dark
 * and glossy. Generic: no maker's shapes, badges or logos. The screen
 * lights the floor in front of it in its own colour; a warm key and a
 * cold rim do the rest. Seen at an angle, the camera drifting a little.
 */

import { resolveSurface } from '../materials/desk.js';
import { isHex, mix } from '../util/color.js';
import { clamp } from '../util/num.js';
import { shoot } from './shot.js';
import { resolveDrift } from './vinyl.js';
import { deskCanvas } from './deskplane.js';
import { screenTexture } from './screen.js';
import { crtMaterial, resolveCrt } from './crt.js';

/** The kinds of set. */
export const TV_KINDS = /** @type {const} */ (['crt', 'flat']);

/** The cabinets by name: a wood veneer, or plastic. */
export const CABINETS = Object.freeze({ wood: '#5a3520', cream: '#d8cfbb', black: '#1c1c1f' });

/** The room's default dark, and the default view: turned to the set's left, a little above it. */
const ROOM = '#050506';
const VIEW = Object.freeze({ turn: -35, tilt: 12, distance: 1, fov: 32 });

/**
 * A TV scene on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas to draw on.
 * @param {import('./tv.js').TvSceneOptions} options What the screen shows, the set, and how it's shot.
 * @returns {Promise<import('./tv.js').TvScene>} The scene, running: the screen and its light are redrawn every frame while it's on screen (one still frame with reduced motion).
 * @throws {TypeError} For a bad option.
 */
export async function tvScene(canvas, options) {
	if (!options || typeof options !== 'object') throw new TypeError('tvScene: pass { screen, … }');
	const kind = options.kind ?? 'crt';
	if (!TV_KINDS.includes(kind)) throw new TypeError(`tvScene: kind is 'crt' or 'flat' (got ${JSON.stringify(kind)})`);
	const crt = kind === 'crt';
	const look = resolveCrt(options.crt ?? crt);
	const cabinet = options.cabinet ?? (crt ? 'wood' : 'black');
	const body = Object.hasOwn(CABINETS, cabinet) ? CABINETS[/** @type {keyof typeof CABINETS} */ (cabinet)] : isHex(cabinet) ? cabinet : null;
	if (!body) throw new TypeError(`tvScene: cabinet is 'wood', 'cream', 'black' or a hex colour (got ${JSON.stringify(cabinet)})`);
	const room = options.ground ?? ROOM;
	if (!isHex(room)) throw new TypeError(`tvScene: ground is a hex colour (got ${JSON.stringify(room)})`);
	const glowAsked = options.glow ?? null;
	if (glowAsked !== null && !isHex(glowAsked)) throw new TypeError(`tvScene: glow is a hex colour (got ${JSON.stringify(glowAsked)})`);
	const veneer = crt && cabinet === 'wood' ? await deskCanvas(resolveSurface({ texture: 'oak', color: body }), { span: 260, light: 0.35, seed: 'tv', px: 1024 }) : null;
	const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
	/** @type {import('./screen.js').ScreenTexture} */
	let screen;
	let setScreen = async (/** @type {import('./screen.js').ScreenSource} */ _) => {};

	const shot = await shoot(
		canvas,
		{
			ground: { color: room },
			light: 0.35,
			layout: 'upright',
			lighting: 'dark',
			toneMapping: 'aces',
			width: options.width,
			height: options.height,
			pixelRatio: options.pixelRatio,
			exposure: options.exposure ?? 1,
			fit: clamp(options.fit ?? 0.85, 0.2, 1),
			view: { ...VIEW, ...options.view },
			drift: resolveDrift(options.drift ?? true),
			fps: options.fps,
		},
		async (THREE, scene, keep) => {
			screen = await screenTexture(THREE, options.screen);
			keep(screen.texture);
			const woodMap = veneer ? keep(new THREE.CanvasTexture(veneer.canvas)) : null;
			if (woodMap) woodMap.colorSpace = THREE.SRGBColorSpace;
			const shell = new THREE.MeshStandardMaterial({ map: woodMap, color: woodMap ? '#ffffff' : body, roughness: woodMap ? 0.55 : 0.4 });
			const plastic = new THREE.MeshStandardMaterial({ color: crt && cabinet !== 'black' ? '#1a1a1c' : mix(body, '#000000', 0.25), roughness: 0.45 });
			const metal = new THREE.MeshStandardMaterial({ color: '#9a9a9e', roughness: 0.3, metalness: 0.9 });
			const face = crt ? crtMaterial(THREE, screen.texture, look) : new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false });
			const set = crt ? crtSet(THREE, RoundedBoxGeometry, { shell, plastic, metal, face }) : flatSet(THREE, RoundedBoxGeometry, { shell, metal, face });
			scene.add(set.group);

			// the screen's light on the floor and whatever's near, the room's key and rim
			const glow = new THREE.PointLight(glowAsked ?? '#5dffa0', 6, 6, 1.6);
			glow.position.set(set.screen[0], set.screen[1], set.screen[2] + 0.8);
			const rim = new THREE.DirectionalLight('#6f86ff', 1.3);
			rim.position.set(-3, 5, -4);
			const key = new THREE.SpotLight('#ffd9b0', 18, 14, 0.5, 0.6, 1.4);
			key.position.set(3, 6, 3);
			key.target.position.set(0, set.height / 2, 0);
			key.castShadow = true;
			key.shadow.mapSize.set(1024, 1024);
			key.shadow.bias = -0.0005;
			scene.add(glow, rim, key, key.target, new THREE.AmbientLight('#ffffff', 0.05));

			let light = { color: [0.36, 1, 0.63], level: 0.5 };
			let frames = 0;
			setScreen = async (source) => {
				const old = screen;
				screen = await screenTexture(THREE, source);
				if ('uniforms' in face) face.uniforms.uPic.value = screen.texture;
				else face.map = screen.texture;
				old.texture.dispose();
				frames = 0;
			};
			return {
				width: set.width,
				height: set.height,
				center: [0, set.height * 0.5, 0],
				tick(t) {
					screen.update();
					// the screen's light: its colour now and then, a faint flicker always
					if (frames++ % 8 === 0 && !glowAsked) light = screen.light();
					const [r, g, b] = light.color;
					if (!glowAsked) glow.color.setRGB(r, g, b, THREE.SRGBColorSpace);
					glow.intensity = 6 * clamp(light.level * 25, 0.6, 1.4) * (0.92 + 0.08 * Math.sin(t * 60)) * (0.9 + 0.1 * Math.sin(t * 1.3));
					if ('uniforms' in face) {
						face.uniforms.uTime.value = t;
						face.uniforms.uGlass.value.copy(glow.color).multiplyScalar(0.06 * clamp(light.level * 12, 0.4, 1));
					}
				},
			};
		},
	);
	return { ...shot, setScreen: (source) => setScreen(source) };
}

/**
 * An old CRT set on legs: a rounded cabinet, a bezel round the bulging screen, a control panel with knobs and a grille, splayed legs, and rabbit ears on a dome.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {typeof import('three/addons/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry} Rounded The rounded box.
 * @param {{ shell: import('three').Material, plastic: import('three').Material, metal: import('three').Material, face: import('three').Material }} m The materials.
 * @returns {{ group: import('three').Group, screen: [number, number, number], width: number, height: number }} The set (standing on y = 0), the screen's centre, and the set's width and height (to its ears).
 */
function crtSet(THREE, Rounded, { shell, plastic, metal, face }) {
	const tv = new THREE.Group();
	const add = (geo, mat, [x, y, z], cast = true) => {
		const mesh = new THREE.Mesh(geo, mat);
		mesh.position.set(x, y, z);
		mesh.castShadow = cast;
		tv.add(mesh);
		return mesh;
	};
	add(new Rounded(2.6, 1.9, 1.6, 6, 0.16), shell, [0, 0, 0]);
	add(new Rounded(1.86, 1.5, 0.06, 4, 0.1), plastic, [-0.3, 0, 0.8]);
	add(new Rounded(0.46, 1.5, 0.06, 4, 0.05), plastic, [0.95, 0, 0.8]);
	// the screen: a gently bulging pane, the picture on it
	const sg = new THREE.PlaneGeometry(1.6, 1.24, 24, 24);
	const p = sg.attributes.position;
	for (let i = 0; i < p.count; i++) p.setZ(i, 0.06 * (1 - (p.getX(i) / 0.8) ** 2) * (1 - (p.getY(i) / 0.62) ** 2));
	sg.computeVertexNormals();
	add(sg, face, [-0.3, 0, 0.84], false);
	// glass over it: the room's light in a faint sheen
	add(sg, new THREE.MeshPhysicalMaterial({ color: '#000000', transparent: true, opacity: 0.1, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.25, envMapIntensity: 0.8 }), [-0.3, 0, 0.845], false);
	for (let i = 0; i < 7; i++) add(new THREE.BoxGeometry(0.3, 0.018, 0.01), metal, [0.95, -0.15 - i * 0.07, 0.84]);
	for (const y of [0.5, 0.18]) add(new THREE.CylinderGeometry(0.1, 0.11, 0.09, 32), metal, [0.95, y, 0.87]).rotation.x = Math.PI / 2;
	// legs, splayed; rabbit ears on a little dome
	for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
		const leg = add(new THREE.CylinderGeometry(0.035, 0.025, 0.7, 12), plastic, [x * 1.1, -1.25, z * 0.58]);
		leg.rotation.z = -x * 0.18;
		leg.rotation.x = z * 0.18;
	}
	add(new THREE.SphereGeometry(0.16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), plastic, [0.2, 0.95, -0.1]);
	for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 8), metal, [0.2 + s * 0.38, 1.6, -0.1]).rotation.z = -s * 0.55;
	tv.position.y = 1.6;
	const group = new THREE.Group();
	group.add(tv);
	return { group, screen: [-0.3, 1.6, 0.84], width: 2.9, height: 2.9 };
}

/**
 * A flat TV on a foot: a thin panel with a narrow bezel, the picture behind dark glossy glass.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {typeof import('three/addons/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry} Rounded The rounded box.
 * @param {{ shell: import('three').Material, metal: import('three').Material, face: import('three').Material }} m The materials.
 * @returns {{ group: import('three').Group, screen: [number, number, number], width: number, height: number }} The set (standing on y = 0), the screen's centre, and its width and height.
 */
function flatSet(THREE, Rounded, { shell, metal, face }) {
	const group = new THREE.Group();
	const W = 3.2;
	const H = 1.84;
	const y = 0.32 + H / 2;
	const add = (geo, mat, [x, py, z]) => {
		const mesh = new THREE.Mesh(geo, mat);
		mesh.position.set(x, py, z);
		mesh.castShadow = true;
		group.add(mesh);
		return mesh;
	};
	add(new Rounded(W + 0.06, H + 0.06, 0.08, 3, 0.02), shell, [0, y, 0]);
	add(new THREE.PlaneGeometry(W - 0.04, H - 0.04), face, [0, y, 0.0405]).castShadow = false;
	add(new THREE.PlaneGeometry(W - 0.04, H - 0.04), new THREE.MeshPhysicalMaterial({ color: '#000000', transparent: true, opacity: 0.1, roughness: 0.04, clearcoat: 1, envMapIntensity: 4 }), [0, y, 0.0415]).castShadow = false;
	// the foot: a neck and a low plate
	add(new THREE.BoxGeometry(0.14, 0.34, 0.06), metal, [0, 0.17, -0.06]);
	add(new Rounded(0.9, 0.03, 0.42, 2, 0.012), metal, [0, 0.015, 0]);
	return { group, screen: [0, y, 0.04], width: W + 0.2, height: y + H / 2 + 0.1 };
}
