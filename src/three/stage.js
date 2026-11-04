/**
 * @module @arraypress/mockups/three/stage
 *
 * The studio: a renderer with soft shadows and neutral tone mapping (the
 * ground keeps the colour asked for), a room for glossy things to reflect,
 * the seamless ground, and the light: a soft key from above the light's
 * side, so shadows fall away from it as in the 2D mockup, and a dim fill.
 * `expose` then sets the exposure so the ground comes out the colour it was
 * asked to be, whatever the lights add up to.
 */

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

/**
 * The scene: its environment, ground and lights.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('three').WebGLRenderer} renderer The renderer (for the environment).
 * @param {typeof import('three/addons/environments/RoomEnvironment.js').RoomEnvironment} Room The room environment.
 * @param {{ ground: string, light: number }} o The ground's colour and where the light is, left (-1) to right (1).
 * @returns {{ scene: import('three').Scene, dispose: () => void }} The scene, and how to free its environment.
 */
export function makeStage(THREE, renderer, Room, { ground, light }) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(ground);
	const pmrem = new THREE.PMREMGenerator(renderer);
	const env = pmrem.fromScene(new Room(), 0.04).texture;
	scene.environment = env;
	scene.environmentIntensity = 0.32;

	// matte paper: no sheen at grazing angles, so a dark ground stays dark across the frame
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: ground }));
	floor.rotation.x = -Math.PI / 2;
	floor.receiveShadow = true;
	scene.add(floor);

	// the key: high, a little to the light's side and beyond the top of the frame
	const key = new THREE.DirectionalLight('#ffffff', 1);
	key.position.set(light * 2.2, 6, -1.6);
	key.castShadow = true;
	key.shadow.mapSize.set(2048, 2048);
	key.shadow.camera.left = key.shadow.camera.bottom = -2.2;
	key.shadow.camera.right = key.shadow.camera.top = 2.2;
	key.shadow.camera.near = 1;
	key.shadow.camera.far = 14;
	key.shadow.radius = 9;
	key.shadow.blurSamples = 24;
	key.shadow.bias = -0.0004;
	scene.add(key, key.target);
	scene.add(new THREE.HemisphereLight('#ffffff', '#d8d8d8', 0.22));
	return {
		scene,
		dispose() {
			env.dispose();
			pmrem.dispose();
		},
	};
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
