/**
 * @module @logomarks/mockups/three/lens
 *
 * A camera's lens, by accumulation: the frame is drawn many times, the
 * camera moved each time to a point on its aperture and its frustum
 * sheared so the plane of focus stays put, and the frames averaged. What's
 * on the plane of focus stays sharp, and everything nearer or further
 * blurs as much as a real lens would blur it, with its own bokeh. Each
 * frame is also nudged by a fraction of a pixel, so edges are smoothed as
 * a camera's sensor smooths them. The frames are added up in linear light
 * (a half-float target), so highlights bloom into their blur as they do
 * through glass; tone mapping happens once, on the sum.
 */

/** The default number of frames a shot averages. */
export const LENS_SAMPLES = 24;

/**
 * A scene's lens from its options: `blur` (how far out of focus the foreground and background go, 0–1) scales the
 * scene's own widest aperture, and `samples` sets how many frames are averaged.
 *
 * @param {import('../util/reader.js').Reader} o The scene's options.
 * @param {{ aperture: number, blur?: number, samples?: number }} d The scene's widest aperture (a share of the distance to the point of focus), and its default blur and frames.
 * @returns {{ aperture: number, samples: number }} The lens, for `shoot`.
 * @throws {TypeError} When `blur` or `samples` isn't a number.
 */
export function lensOf(o, { aperture, blur = 0.5, samples = LENS_SAMPLES }) {
	return { aperture: aperture * o.num('blur', blur, 0, 1), samples: Math.round(o.num('samples', samples, 1, 256)) };
}

/**
 * Where each frame's camera sits on the aperture, and how far it's nudged: a sunflower spiral over the disc (evenly
 * spread, the same every time), and a Halton sequence for the sub-pixel nudge.
 *
 * @param {number} n How many frames.
 * @returns {{ x: number, y: number, jx: number, jy: number }[]} Each frame's point on the unit disc and its nudge (−0.5–0.5 px).
 */
export function lensSamples(n) {
	const golden = Math.PI * (3 - Math.sqrt(5));
	return Array.from({ length: n }, (_, i) => {
		const r = Math.sqrt((i + 0.5) / n);
		const a = i * golden;
		return { x: r * Math.cos(a), y: r * Math.sin(a), jx: halton(i + 1, 2) - 0.5, jy: halton(i + 1, 3) - 0.5 };
	});
}

/**
 * The Halton sequence.
 *
 * @param {number} i The index (from 1).
 * @param {number} base Its base.
 * @returns {number} The value, 0–1.
 */
function halton(i, base) {
	let f = 1;
	let r = 0;
	for (let k = i; k > 0; k = Math.floor(k / base)) {
		f /= base;
		r += f * (k % base);
	}
	return r;
}

/**
 * A lens for a renderer.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('three').WebGLRenderer} renderer The renderer.
 * @param {{ samples?: number }} [o] How many frames to average (24).
 * @returns {import('./lens.js').Lens} The lens.
 */
export function makeLens(THREE, renderer, { samples = LENS_SAMPLES } = {}) {
	const size = renderer.getDrawingBufferSize(new THREE.Vector2());
	const opts = { type: THREE.HalfFloatType, depthBuffer: true };
	const frame = new THREE.WebGLRenderTarget(size.x, size.y, opts);
	const sum = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, depthBuffer: false });
	const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
	const plane = new THREE.PlaneGeometry(2, 2);
	// each frame added in at its share
	const add = new THREE.ShaderMaterial({
		uniforms: { map: { value: frame.texture }, weight: { value: 1 } },
		vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
		fragmentShader: 'uniform sampler2D map; uniform float weight; varying vec2 vUv; void main() { gl_FragColor = texture2D(map, vUv) * weight; }',
		// added as they are (three's additive blending would weight them by alpha again)
		blending: THREE.CustomBlending,
		blendSrc: THREE.OneFactor,
		blendDst: THREE.OneFactor,
		blendSrcAlpha: THREE.OneFactor,
		blendDstAlpha: THREE.OneFactor,
		depthTest: false,
		depthWrite: false,
		toneMapped: false,
	});
	const adder = new THREE.Mesh(plane, add);
	// the sum, tone mapped and encoded on the way to the canvas
	const out = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ map: sum.texture, depthTest: false, depthWrite: false }));
	const points = lensSamples(Math.max(1, Math.round(samples)));
	const right = new THREE.Vector3();
	const up = new THREE.Vector3();
	const home = new THREE.Vector3();
	const forward = new THREE.Vector3();
	const toFocus = new THREE.Vector3();

	return {
		draw(scene, camera, { aperture = 0, focus = null } = {}) {
			camera.updateMatrixWorld();
			camera.updateProjectionMatrix();
			home.copy(camera.position);
			right.setFromMatrixColumn(camera.matrixWorld, 0);
			up.setFromMatrixColumn(camera.matrixWorld, 1);
			camera.getWorldDirection(forward);
			// the plane of focus: through the point asked for, square to the lens
			const F = focus ? Math.max(camera.near * 2, toFocus.set(...focus).sub(home).dot(forward)) : 1;
			const base = camera.projectionMatrix.clone();
			const e = camera.projectionMatrix.elements;
			const clear = renderer.getClearColor(new THREE.Color());
			const alpha = renderer.getClearAlpha();
			const autoClear = renderer.autoClear;
			// each frame clears its own target; the sum is cleared once
			renderer.autoClear = false;
			renderer.setRenderTarget(sum);
			renderer.setClearColor(0x000000, 0);
			renderer.clear();
			add.uniforms.weight.value = 1 / points.length;
			for (const p of points) {
				const dx = p.x * aperture;
				const dy = p.y * aperture;
				camera.position.copy(home).addScaledVector(right, dx).addScaledVector(up, dy);
				camera.updateMatrixWorld();
				camera.projectionMatrix.copy(base);
				// shear the frustum back onto the plane of focus, and nudge by a fraction of a pixel
				e[8] -= (e[0] * dx) / F - (2 * p.jx) / size.x;
				e[9] -= (e[5] * dy) / F - (2 * p.jy) / size.y;
				camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
				renderer.setRenderTarget(frame);
				renderer.setClearColor(clear, alpha);
				renderer.clear();
				renderer.render(scene, camera);
				renderer.setRenderTarget(sum);
				renderer.render(adder, flat);
			}
			camera.position.copy(home);
			camera.projectionMatrix.copy(base);
			camera.projectionMatrixInverse.copy(base).invert();
			camera.updateMatrixWorld();
			renderer.setRenderTarget(null);
			renderer.setClearColor(clear, alpha);
			renderer.autoClear = autoClear;
			renderer.render(out, flat);
		},
		dispose() {
			frame.dispose();
			sum.dispose();
			plane.dispose();
			add.dispose();
			out.material.dispose();
		},
	};
}
