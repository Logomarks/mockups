/**
 * @module @arraypress/mockups/three/crt
 *
 * A cathode-ray tube's face as a shader over a live picture: the tube's
 * curve (the picture bowed out, its corners dark), scanlines, the
 * shadow mask's RGB stripes, the phosphor's bloom round bright parts, the
 * glass faintly lit, a little noise and jitter, a bar rolling slowly up
 * the screen, and the faint 60 Hz flicker. Each can be turned down.
 */

/** The fragment shader. */
const FRAGMENT = /* glsl */ `
uniform sampler2D uPic;
uniform float uTime;
uniform float uCurve;
uniform float uScan;
uniform float uBloom;
uniform float uRoll;
uniform float uNoise;
uniform float uLines;
uniform vec3 uGlass;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
	vec2 c = vUv * 2.0 - 1.0;
	c *= 1.0 + dot(c, c) * 0.08 * uCurve;
	vec2 s = c * 0.5 + 0.5;
	if (any(lessThan(s, vec2(0.0))) || any(greaterThan(s, vec2(1.0)))) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
	float t = uTime;
	// a little horizontal jitter, now and then a tear
	s.x += (hash(vec2(floor(s.y * uLines), floor(t * 24.0))) - 0.5) * 0.003 * uNoise * step(0.92, hash(vec2(floor(t * 3.0), 7.0)));
	vec3 pic = texture2D(uPic, s).rgb;
	// the phosphor's bloom round the bright parts
	vec3 bloom = vec3(0.0);
	for (int i = 0; i < 8; i++) {
		float a = float(i) * 0.785;
		bloom += texture2D(uPic, s + vec2(cos(a), sin(a)) * 0.012).rgb;
	}
	pic += bloom / 8.0 * 0.6 * uBloom;
	pic += uGlass * (0.6 + 0.4 * s.y);
	pic += (hash(s * vec2(320.0, 240.0) + fract(t) * 9.0) - 0.5) * 0.06 * uNoise;
	float roll = fract(s.y - t * 0.15);
	pic *= 1.0 + 0.3 * uRoll * exp(-pow((roll - 0.5) * 14.0, 2.0));
	float scan = mix(1.0, 0.65 + 0.35 * sin(s.y * uLines * 3.14159), uScan);
	float sub = mod(gl_FragCoord.x, 3.0);
	vec3 grille = mix(vec3(1.0), vec3(step(sub, 1.0), step(1.0, sub) * step(sub, 2.0), step(2.0, sub)) * 0.55 + 0.6, uScan);
	vec3 col = pic * scan * grille;
	col *= mix(1.0, smoothstep(1.3, 0.55, length(c)), uCurve);
	col *= 0.96 + 0.04 * sin(t * 60.0) * uNoise;
	gl_FragColor = vec4(col * 1.25, 1.0);
}`;

/** The vertex shader: the screen's UVs through. */
const VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

/** The looks a CRT takes, and their defaults. */
export const CRT_LOOK = Object.freeze({ curve: 1, scanlines: 1, bloom: 1, roll: 1, noise: 1 });

/**
 * A CRT's look from its option.
 *
 * @param {unknown} v `true` or nothing (all of it), `false` (none: the picture as it is), or `{ curve, scanlines, bloom, roll, noise }` (each 0–1).
 * @returns {Required<import('./crt.js').CrtLook>} The look.
 * @throws {TypeError} For anything else.
 */
export function resolveCrt(v) {
	if (v === undefined || v === true) return { ...CRT_LOOK };
	if (v === false) return { curve: 0, scanlines: 0, bloom: 0, roll: 0, noise: 0 };
	if (!v || typeof v !== 'object') throw new TypeError(`tvScene: crt is true, false or { curve, scanlines, bloom, roll, noise } (got ${JSON.stringify(v)})`);
	const o = /** @type {Record<string, unknown>} */ (v);
	const out = { ...CRT_LOOK };
	for (const k of /** @type {(keyof typeof CRT_LOOK)[]} */ (Object.keys(CRT_LOOK))) {
		if (o[k] === undefined) continue;
		if (typeof o[k] !== 'number' || !Number.isFinite(o[k])) throw new TypeError(`tvScene: crt.${k} is a number from 0 to 1 (got ${JSON.stringify(o[k])})`);
		out[k] = Math.min(1, Math.max(0, /** @type {number} */ (o[k])));
	}
	return out;
}

/**
 * The CRT's face material.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('three').Texture} picture What's on screen.
 * @param {Required<import('./crt.js').CrtLook>} look How much of each effect.
 * @param {number} [lines=240] Scanlines down the screen.
 * @returns {import('three').ShaderMaterial} The material; set `uniforms.uTime` each frame and `uniforms.uGlass` to the screen's light.
 */
export function crtMaterial(THREE, picture, look, lines = 240) {
	return new THREE.ShaderMaterial({
		uniforms: {
			uPic: { value: picture },
			uTime: { value: 0 },
			uCurve: { value: look.curve },
			uScan: { value: look.scanlines },
			uBloom: { value: look.bloom },
			uRoll: { value: look.roll },
			uNoise: { value: look.noise },
			uLines: { value: lines },
			uGlass: { value: new THREE.Color(0.02, 0.09, 0.05) },
		},
		vertexShader: VERTEX,
		fragmentShader: FRAGMENT,
	});
}
