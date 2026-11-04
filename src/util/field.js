/**
 * @module @arraypress/mockups/util/field
 *
 * Scalar fields: a small grid of heights, drawn procedurally (seeded value
 * noise, soft ridges for folds and creases, blurs), then turned into a PNG
 * an SVG can stretch over an object. A height map drives a displacement
 * (the print follows the folds); a shade map is the same heights lit from
 * the mockup's light, black where a slope turns away and white where it
 * faces the light, laid over the object. Fields are low resolution on
 * purpose: folds are smooth, and the browser or librsvg interpolates them.
 */

import { encodePng } from '../render/png.js';
import { base64 } from '../render/art.js';
import { hash } from './rng.js';
import { clamp } from './num.js';

/**
 * A field of zeros.
 *
 * @param {number} w Its width, in cells.
 * @param {number} h Its height, in cells.
 * @returns {import('./field.js').Field} The field.
 */
export function field(w, h) {
	return { w: Math.max(2, Math.round(w)), h: Math.max(2, Math.round(h)), v: new Float32Array(Math.max(2, Math.round(w)) * Math.max(2, Math.round(h))) };
}

/**
 * Seeded lattice noise at a point, smoothly interpolated: -1 to 1.
 *
 * @param {number} x Across, in lattice cells.
 * @param {number} y Down, in lattice cells.
 * @param {number} seed A seed number.
 * @returns {number} The noise.
 */
export function noise2(x, y, seed) {
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const fx = x - x0;
	const fy = y - y0;
	const sx = fx * fx * (3 - 2 * fx);
	const sy = fy * fy * (3 - 2 * fy);
	const at = (i, j) => {
		let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ seed;
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 2147483648 - 1;
	};
	const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
	const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
	return a + (b - a) * sy;
}

/**
 * Adds fractal noise to a field.
 *
 * @param {import('./field.js').Field} f The field.
 * @param {import('./field.js').NoiseOptions} o The seed, how many lattice cells span the field's width, octaves, amplitude, and a stretch (2 makes features twice as long across).
 * @returns {import('./field.js').Field} The field.
 */
export function fbm(f, { seed, scale = 4, octaves = 3, amp = 1, stretch = [1, 1], gain = 0.5 }) {
	const s = hash(seed);
	const k = scale / f.w;
	for (let y = 0; y < f.h; y++) {
		for (let x = 0; x < f.w; x++) {
			let sum = 0;
			let a = amp;
			let q = k;
			for (let o = 0; o < octaves; o++) {
				sum += a * noise2((x * q) / stretch[0], (y * q) / stretch[1], s + o * 1013);
				a *= gain;
				q *= 2;
			}
			f.v[y * f.w + x] += sum;
		}
	}
	return f;
}

/**
 * Adds a soft ridge (a fold, a crease, a pleat) along a segment: a smooth bump across it, tapering to nothing at its ends.
 *
 * @param {import('./field.js').Field} f The field.
 * @param {[number, number]} a One end, as fractions of the field's width and height.
 * @param {[number, number]} b The other end.
 * @param {number} width Its half-width, as a fraction of the field's width.
 * @param {number} height Its height (negative for a groove).
 * @param {number} [taper=0.35] How much of each end fades out (0 for none, 0.5 to fade all the way to the middle).
 * @returns {import('./field.js').Field} The field.
 */
export function ridge(f, a, b, width, height, taper = 0.35) {
	const ax = a[0] * f.w;
	const ay = a[1] * f.h;
	const dx = b[0] * f.w - ax;
	const dy = b[1] * f.h - ay;
	const len2 = dx * dx + dy * dy || 1;
	const r = width * f.w;
	const pad = Math.ceil(r * 3);
	const x0 = Math.max(0, Math.floor(Math.min(ax, ax + dx) - pad));
	const x1 = Math.min(f.w - 1, Math.ceil(Math.max(ax, ax + dx) + pad));
	const y0 = Math.max(0, Math.floor(Math.min(ay, ay + dy) - pad));
	const y1 = Math.min(f.h - 1, Math.ceil(Math.max(ay, ay + dy) + pad));
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			const t = ((x - ax) * dx + (y - ay) * dy) / len2;
			if (t < 0 || t > 1) continue;
			const px = ax + t * dx - x;
			const py = ay + t * dy - y;
			const d2 = (px * px + py * py) / (r * r);
			if (d2 > 9) continue;
			const end = taper > 0 ? Math.min(1, Math.min(t, 1 - t) / taper) : 1;
			f.v[y * f.w + x] += height * Math.exp(-d2) * end * end * (3 - 2 * end);
		}
	}
	return f;
}

/**
 * Adds a smooth round bump (or dip).
 *
 * @param {import('./field.js').Field} f The field.
 * @param {[number, number]} c Its centre, as fractions.
 * @param {number} radius Its radius, as a fraction of the field's width.
 * @param {number} height Its height.
 * @returns {import('./field.js').Field} The field.
 */
export function bump(f, c, radius, height) {
	return ridge(f, c, [c[0] + 1e-4, c[1]], radius, height, 0);
}

/**
 * Blurs a field in place (three box passes each way, close to a Gaussian).
 *
 * @param {import('./field.js').Field} f The field.
 * @param {number} r The radius, in cells.
 * @returns {import('./field.js').Field} The field.
 */
export function blur(f, r) {
	const k = Math.max(0, Math.round(r));
	if (!k) return f;
	const tmp = new Float32Array(Math.max(f.w, f.h));
	const pass = (n, get, set) => {
		for (let i = 0; i < n; i++) tmp[i] = get(i);
		let acc = 0;
		for (let i = -k; i <= k; i++) acc += tmp[clamp(i, 0, n - 1)];
		for (let i = 0; i < n; i++) {
			set(i, acc / (2 * k + 1));
			acc += tmp[Math.min(n - 1, i + k + 1)] - tmp[Math.max(0, i - k)];
		}
	};
	for (let p = 0; p < 3; p++) {
		for (let y = 0; y < f.h; y++) pass(f.w, (i) => f.v[y * f.w + i], (i, v) => (f.v[y * f.w + i] = v));
		for (let x = 0; x < f.w; x++) pass(f.h, (i) => f.v[i * f.w + x], (i, v) => (f.v[i * f.w + x] = v));
	}
	return f;
}

/**
 * A field as a grey PNG `data:` URI: heights mapped round mid-grey, for a displacement map.
 *
 * @param {import('./field.js').Field} f The field.
 * @param {number} [gain=1] Grey levels per unit of height, as a fraction of 127.
 * @returns {string} The PNG.
 */
export function heightPng(f, gain = 1) {
	const px = new Uint8Array(f.w * f.h * 2);
	for (let i = 0; i < f.v.length; i++) {
		px[i * 2] = Math.round(clamp(128 + f.v[i] * gain * 127, 0, 255));
		px[i * 2 + 1] = 255;
	}
	return `data:image/png;base64,${base64(encodePng(f.w, f.h, px))}`;
}

/**
 * A field lit from the mockup's light, as a PNG `data:` URI to lay over the object: black where a slope turns away from the light, white where it faces it, clear where it's flat.
 *
 * @param {import('./field.js').Field} f The field.
 * @param {import('./field.js').ShadeOptions} o Where the light is (-1 left to 1 right; it's always up the frame), how steep the heights are, and how dark and bright the shading may go.
 * @returns {string} The PNG.
 */
export function shadePng(f, { light = 0.35, relief = 1, dark = 0.5, bright = 0.3, gamma = 1 }) {
	// the light in the image plane, up the frame and to its side, 40° above the surface
	const lx = clamp(light, -1, 1) * 0.75;
	const ly = -0.9;
	const l = Math.hypot(lx, ly, 1);
	const L = [lx / l, ly / l, 1 / l];
	const flat = L[2];
	const px = new Uint8Array(f.w * f.h * 2);
	const at = (x, y) => f.v[clamp(y, 0, f.h - 1) * f.w + clamp(x, 0, f.w - 1)];
	for (let y = 0; y < f.h; y++) {
		for (let x = 0; x < f.w; x++) {
			const gx = (at(x + 1, y) - at(x - 1, y)) * relief;
			const gy = (at(x, y + 1) - at(x, y - 1)) * relief;
			const n = Math.hypot(gx, gy, 1);
			const d = (-gx * L[0] - gy * L[1] + L[2]) / n - flat;
			const i = (y * f.w + x) * 2;
			const a = d < 0 ? Math.min(1, (-d / flat) ** gamma * dark * 2) : Math.min(1, (d / (1 - flat)) ** gamma * bright * 2);
			px[i] = d < 0 ? 0 : 255;
			px[i + 1] = Math.round(a * 255);
		}
	}
	return `data:image/png;base64,${base64(encodePng(f.w, f.h, px))}`;
}

/**
 * A grey-and-alpha PNG from a function of each cell.
 *
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @param {(x: number, y: number) => [number, number]} fn Grey and alpha (0–1) at a cell.
 * @returns {string} The PNG as a `data:` URI.
 */
export function greyPng(w, h, fn) {
	const px = new Uint8Array(w * h * 2);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const [g, a] = fn(x, y);
			px[(y * w + x) * 2] = Math.round(clamp(g) * 255);
			px[(y * w + x) * 2 + 1] = Math.round(clamp(a) * 255);
		}
	}
	return `data:image/png;base64,${base64(encodePng(w, h, px))}`;
}
