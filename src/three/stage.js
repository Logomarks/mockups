/**
 * @module @arraypress/mockups/three/stage
 *
 * The studio: a renderer with soft shadows and neutral tone mapping (the
 * ground keeps the colour asked for), a room for glossy things to reflect,
 * the seamless ground, and the light: a soft key from above the light's
 * side, so shadows fall away from it as in the 2D mockup, and a dim fill.
 * Things standing get a paper sweep instead of a floor, lit from the front.
 * `expose` then sets the exposure so the ground comes out the colour it was
 * asked to be, whatever the lights add up to. Two other lightings: a phone's
 * flash (a hard light beside the lens, following the camera, crisp
 * shadows, a low window light raking across from the side, the room for
 * gloss to reflect) and a dark room (a floor fading into the dark, almost
 * no light of its own: the objects light it).
 */

import { sweepMesh } from './sweep.js';
import { mix } from '../util/color.js';

/**
 * A renderer on a canvas.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {{ width: number, height: number, pixelRatio: number, exposure: number }} o Its size and pixel ratio, and the exposure.
 * @returns {import('three').WebGLRenderer} The renderer.
 */
export function makeRenderer(THREE, canvas, { width, height, pixelRatio, exposure }) {
	const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
	r.setPixelRatio(pixelRatio);
	r.setSize(width, height, false);
	r.outputColorSpace = THREE.SRGBColorSpace;
	r.toneMapping = THREE.NeutralToneMapping;
	r.toneMappingExposure = exposure;
	r.shadowMap.enabled = true;
	r.shadowMap.type = THREE.VSMShadowMap;
	return r;
}

/** How bright the flash is, for its distance squared (it falls off as a real one does). */
const FLASH = 2.8;

/**
 * The scene: its environment, ground and lights.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('three').WebGLRenderer} renderer The renderer (for the environment).
 * @param {typeof import('three/addons/environments/RoomEnvironment.js').RoomEnvironment} Room The room environment.
 * @param {import('./stage.js').StageOptions} o The ground's colour, where the light is, how things stand, the lighting, and a drawn surface for the sweep.
 * @returns {import('./stage.js').Stage} The scene, how to keep the flash with the camera, and how to free its environment.
 */
export function makeStage(THREE, renderer, Room, { ground, light, layout = 'flat', lighting = 'studio', backdrop = null }) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(ground);
	const pmrem = new THREE.PMREMGenerator(renderer);
	const env = pmrem.fromScene(new Room(), 0.04).texture;
	scene.environment = env;
	scene.environmentIntensity = lighting === 'flash' ? 0.6 : lighting === 'dark' ? 0.06 : 0.32;
	const upright = layout === 'upright';
	/** @type {import('three').Texture[]} */
	const owned = [];
	const dispose = () => {
		env.dispose();
		pmrem.dispose();
		owned.forEach((t) => t.dispose());
	};

	if (lighting === 'dark') {
		// a floor fading into the dark: what's on it lights it
		scene.fog = new THREE.Fog(ground, 6, 14);
		const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: mix(ground, '#ffffff', 0.05), roughness: 0.85 }));
		floor.rotation.x = -Math.PI / 2;
		floor.receiveShadow = true;
		scene.add(floor);
		renderer.shadowMap.type = THREE.PCFShadowMap;
		return { scene, follow() {}, dispose };
	}
	if (upright) {
		// a drawn surface as the sweep's paper: mirrored round, so it never shows a seam, at its true scale
		const map = backdrop ? new THREE.CanvasTexture(backdrop.canvas) : null;
		if (map && backdrop) {
			map.colorSpace = THREE.SRGBColorSpace;
			map.wrapS = map.wrapT = THREE.MirroredRepeatWrapping;
			map.repeat.set(1 / backdrop.span, 1 / backdrop.span);
			map.anisotropy = 8;
			owned.push(map);
		}
		scene.add(sweepMesh(THREE, { color: ground, back: 2.4, cove: 0.8, map }));
	}
	else {
		// matte paper: no sheen at grazing angles, so a dark ground stays dark across the frame
		const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: ground }));
		floor.rotation.x = -Math.PI / 2;
		floor.receiveShadow = true;
		scene.add(floor);
	}

	if (lighting === 'flash') {
		// the flash beside the lens: hard, its shadows crisp and just behind what casts them
		renderer.shadowMap.type = THREE.PCFShadowMap;
		const flash = new THREE.SpotLight('#fff6ee', 1, 0, 0.75, 0.45, 2);
		flash.castShadow = true;
		flash.shadow.mapSize.set(2048, 2048);
		flash.shadow.bias = -0.0004;
		flash.shadow.normalBias = 0.002;
		flash.shadow.radius = 2;
		// a low window light from the side, raking across the ground and the grooves so their relief reads
		const sun = new THREE.DirectionalLight('#fff0e0', 1.1);
		sun.position.set(-Math.sign(light || 1) * 4, 1.7, 1.2);
		sun.castShadow = true;
		sun.shadow.mapSize.set(2048, 2048);
		sun.shadow.camera.left = sun.shadow.camera.bottom = -2.4;
		sun.shadow.camera.right = sun.shadow.camera.top = 2.4;
		sun.shadow.bias = -0.0005;
		sun.shadow.radius = 4;
		scene.add(flash, flash.target, sun, new THREE.HemisphereLight('#fff4ec', '#6a5a50', 0.3));
		const side = new THREE.Vector3();
		return {
			scene,
			follow(camera, target) {
				side.setFromMatrixColumn(camera.matrixWorld, 0);
				const d = camera.position.distanceTo(new THREE.Vector3(...target));
				flash.position.copy(camera.position).addScaledVector(side, d * 0.1);
				flash.target.position.set(...target);
				flash.intensity = FLASH * d * d;
				flash.shadow.camera.near = d * 0.3;
				flash.shadow.camera.far = d * 3;
			},
			dispose,
		};
	}

	// the key: over a flat lay, high, to the light's side and beyond the top of the frame; for things standing, in front and
	// halfway up, so floor and wall take the same light and shadows fall back and down
	const key = new THREE.DirectionalLight('#ffffff', upright ? 0.7 : 1);
	if (upright) key.position.set(light * 3.2, 4.4, 4.4);
	else key.position.set(light * 2.2, 6, -1.6);
	key.castShadow = true;
	key.shadow.mapSize.set(2048, 2048);
	key.shadow.camera.left = key.shadow.camera.bottom = -2.2;
	key.shadow.camera.right = key.shadow.camera.top = 2.2;
	key.shadow.camera.near = 1;
	key.shadow.camera.far = 14;
	key.shadow.radius = 9;
	key.shadow.blurSamples = 24;
	key.shadow.bias = -0.0004;
	if (upright) {
		// the sweep's cove curves through the light's depth, where VSM bands and bleeds: filtered PCF (soft by its radius), pushed off the surface
		renderer.shadowMap.type = THREE.PCFShadowMap;
		key.shadow.mapSize.set(1024, 1024);
		key.shadow.normalBias = 0.01;
	}
	scene.add(key, key.target);
	// the fill: from above over a flat lay; all round in the sweep (the paper bounces it), so shadows stay soft
	scene.add(upright ? new THREE.HemisphereLight('#ffffff', '#f2f2f2', 0.9) : new THREE.HemisphereLight('#ffffff', '#d8d8d8', 0.22));
	return { scene, follow() {}, dispose };
}

/**
 * Sets the exposure so a point of bare ground comes out its own colour: renders, reads the pixel, scales, twice.
 *
 * @param {import('three').WebGLRenderer} renderer The renderer (its drawing kept).
 * @param {() => void} render Draws the frame.
 * @param {string} ground The ground's colour, hex.
 * @param {[number, number]} at A point of bare ground, as fractions of the frame.
 */
export function expose(renderer, render, ground, at) {
	const gl = renderer.getContext();
	const want = luminance(parseInt(ground.slice(1, 3), 16), parseInt(ground.slice(3, 5), 16), parseInt(ground.slice(5, 7), 16));
	const px = new Uint8Array(4);
	for (let i = 0; i < 3; i++) {
		render();
		gl.readPixels(Math.round(at[0] * (gl.drawingBufferWidth - 1)), Math.round((1 - at[1]) * (gl.drawingBufferHeight - 1)), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
		const got = luminance(px[0], px[1], px[2]);
		if (got <= 0 || Math.abs(got - want) / want < 0.004) break;
		renderer.toneMappingExposure *= Math.min(4, Math.max(0.25, want / got));
	}
}

/**
 * Linear luminance of an sRGB colour.
 *
 * @param {number} r Red, 0–255.
 * @param {number} g Green, 0–255.
 * @param {number} b Blue, 0–255.
 * @returns {number} Its luminance, 0–1.
 */
function luminance(r, g, b) {
	const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
