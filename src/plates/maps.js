/**
 * @module @arraypress/mockups/plates/maps
 *
 * The maps a screen is composited with, cut from the photo of its blank
 * sign over the screen's box:
 *
 * - shading: the sign's own light as a multiplier (white paper under the
 *   scene's light, so its falloff, colour cast, seams and grime carry over);
 *   a painted board has its paint's colour divided out first; behind glass,
 *   the bright reflections are taken out of it and kept apart;
 * - reflections: light laid over the surface, screened back over the art:
 *   behind glass, everything brighter than the sign's smooth light; on any
 *   sign, glare well above the light round it (a floodlight's flare);
 * - occluders: whatever stands in front of the sign, found as pixels much
 *   darker than the sign's smooth light round them;
 * - noise: the photo's grain, as a standard deviation, so the art can be
 *   given the same.
 */

import { inQuad } from './quad.js';
import { quantile } from './detect.js';

/** How far above the sign's smooth light a pixel is to count as glare (a floodlight's flare, a hot spot), as a factor. */
const GLARE = 1.12;

/**
 * A box blur, weighted (a normalised convolution: only weighted pixels count), run three times to approach a Gaussian.
 *
 * @param {Float32Array} v The values.
 * @param {Float32Array | null} weight Each value's weight (0 to leave it out), or `null` for all alike.
 * @param {number} w The grid's width.
 * @param {number} h Its height.
 * @param {number} r The box's radius, in pixels.
 * @returns {Float32Array} The blurred values (where no weight reached, 0).
 */
export function smooth(v, weight, w, h, r) {
	r = Math.max(1, Math.round(r));
	let num = new Float32Array(v.length);
	let den = new Float32Array(v.length);
	for (let i = 0; i < v.length; i++) {
		const k = weight ? weight[i] : 1;
		num[i] = v[i] * k;
		den[i] = k;
	}
	for (let pass = 0; pass < 3; pass++) {
		num = boxPass(boxPass(num, w, h, r, 1), w, h, r, w);
		den = boxPass(boxPass(den, w, h, r, 1), w, h, r, w);
	}
	const out = new Float32Array(v.length);
	for (let i = 0; i < v.length; i++) out[i] = den[i] > 1e-6 ? num[i] / den[i] : 0;
	return out;
}

/**
 * One running-sum box pass along rows (`step` 1) or columns (`step` = width), its ends held.
 *
 * @param {Float32Array} v The values.
 * @param {number} w The grid's width.
 * @param {number} h Its height.
 * @param {number} r The radius.
 * @param {number} step 1 along rows, `w` down columns.
 * @returns {Float32Array} The averaged values.
 */
function boxPass(v, w, h, r, step) {
	const out = new Float32Array(v.length);
	const [lines, len, stride] = step === 1 ? [h, w, w] : [w, h, 1];
	for (let l = 0; l < lines; l++) {
		const base = l * stride;
		const at = (k) => v[base + Math.min(len - 1, Math.max(0, k)) * step];
		let sum = 0;
		for (let k = -r; k <= r; k++) sum += at(k);
		for (let k = 0; k < len; k++) {
			out[base + k * step] = sum / (2 * r + 1);
			sum += at(k + r + 1) - at(k - r);
		}
	}
	return out;
}

/**
 * A binary mask grown (`max`) or shrunk (`min`) by a square of radius `r`, separably.
 *
 * @param {Uint8Array} m The mask, 0 or 1, row by row.
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @param {number} r The radius.
 * @param {'max' | 'min'} op Grow or shrink.
 * @returns {Uint8Array} The new mask.
 */
function morph(m, w, h, r, op) {
	const pick = op === 'max' ? Math.max : Math.min;
	const pass = (src, along) => {
		const out = new Uint8Array(src.length);
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				let v = src[y * w + x];
				for (let k = -r; k <= r; k++) {
					const [xx, yy] = along ? [x + k, y] : [x, y + k];
					if (xx >= 0 && xx < w && yy >= 0 && yy < h) v = pick(v, src[yy * w + xx]);
				}
				out[y * w + x] = v;
			}
		}
		return out;
	};
	return pass(pass(m, true), false);
}

/**
 * A mask closed (grown, then shrunk back): speckled finds on one object join into a solid one.
 *
 * @param {Uint8Array} m The mask, 0 or 1.
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @param {number} r How large a gap to close, in pixels.
 * @returns {Uint8Array} The closed mask.
 */
export function close(m, w, h, r) {
	return morph(morph(m, w, h, r, 'max'), w, h, r, 'min');
}

/**
 * The photo's grain, from its flattest patches: the spread of each pixel from its 3 × 3 mean, per 16 × 16 block, at the
 * tenth percentile of the blocks (where nothing but grain varies). For a sign clipped to white, whose own grain is lost.
 *
 * @param {import('./detect.js').Pixels} px The photo.
 * @returns {number} The grain, as a standard deviation (0–255).
 */
export function photoNoise(px) {
	const { width: w, height: h } = px;
	const L = (x, y) => {
		const j = (y * w + x) * 3;
		return 0.2126 * px.data[j] + 0.7152 * px.data[j + 1] + 0.0722 * px.data[j + 2];
	};
	const B = 16;
	const spreads = [];
	for (let by = 1; by + B < h - 1; by += B) {
		for (let bx = 1; bx + B < w - 1; bx += B) {
			let [sum, sq, n, top] = [0, 0, 0, 0];
			for (let y = by; y < by + B; y++) {
				for (let x = bx; x < bx + B; x++) {
					const v = L(x, y);
					top = Math.max(top, v);
					let m = 0;
					for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) m += L(x + dx, y + dy) / 9;
					sum += v - m;
					sq += (v - m) ** 2;
					n++;
				}
			}
			// a block at either end of the range has had its grain clipped away
			if (top < 250 && sum / n > -40) spreads.push(Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2)));
		}
	}
	return spreads.length ? Math.round((quantile(spreads, 0.1) / Math.sqrt(8 / 9)) * 100) / 100 : 0;
}

/**
 * The maps for one screen, over its box.
 *
 * @param {import('./detect.js').Pixels} px The photo, with the sign blank.
 * @param {readonly import('./quad.js').Point[]} corners The sign's corners.
 * @param {readonly [number, number, number, number]} box The screen's box: left, top, width, height.
 * @param {import('./format.js').PlateKind} kind The kind of surface.
 * @param {object} [o] Tuning.
 * @param {boolean} [o.occluders=true] Whether to look for things in front of the sign.
 * @param {number} [o.dark=0.55] How much darker than the sign round it a pixel is to count as in front of it.
 * @returns {{ shading: Uint8Array, reflection: Uint8Array | null, mask: Uint8Array | null, noise: number }} RGB shading and reflections and a grey occluder mask (each the box's size, row by row), and the grain.
 */
export function signMaps(px, corners, box, kind, { occluders = true, dark = 0.55 } = {}) {
	const [bx, by, w, h] = box;
	const n = w * h;
	const rgb = new Float32Array(n * 3);
	const L = new Float32Array(n);
	const sign = new Float32Array(n);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			const j = ((by + y) * px.width + bx + x) * 3;
			for (let c = 0; c < 3; c++) rgb[i * 3 + c] = px.data[j + c];
			L[i] = 0.2126 * rgb[i * 3] + 0.7152 * rgb[i * 3 + 1] + 0.0722 * rgb[i * 3 + 2];
			// a pixel's centre inside the sign, away from its anti-aliased edge
			sign[i] = inQuad(corners, bx + x + 0.5, by + y + 0.5) ? 1 : 0;
		}
	}
	const diag = Math.hypot(w, h);

	// occluders: much darker than the sign's smooth light round them (twice, so the first pass's finds don't drag the light down)
	let mask = null;
	if (occluders) {
		const keep = Float32Array.from(sign);
		let hit = new Uint8Array(n);
		for (let pass = 0; pass < 2; pass++) {
			const light = smooth(L, keep, w, h, diag * 0.02);
			hit = new Uint8Array(n);
			for (let i = 0; i < n; i++) if (sign[i] && L[i] < light[i] * dark) hit[i] = 1;
			for (let i = 0; i < n; i++) keep[i] = sign[i] && !hit[i] ? 1 : 0;
		}
		hit = close(hit, w, h, 3);
		for (let i = 0; i < n; i++) hit[i] &= sign[i];
		const count = hit.reduce((a, v) => a + v, 0);
		if (count > n * 0.0005) {
			const soft = smooth(Float32Array.from(hit, (v) => v * 255), null, w, h, 1);
			mask = new Uint8Array(n);
			for (let i = 0; i < n; i++) mask[i] = Math.min(255, Math.round(Math.max(hit[i] * 255, soft[i] * 1.6)));
		}
	}
	const clear = (i) => sign[i] && (!mask || mask[i] < 16);

	// the reference white: the sign's brightest (a high quantile, so a stray hot pixel doesn't set it), per channel for paint
	const ref = [0, 1, 2].map((c) => quantile(Float32Array.from({ length: n }, (_, i) => (clear(i) ? rgb[i * 3 + c] : NaN)).filter((v) => !Number.isNaN(v)), 0.99));
	const white = kind === 'paint' ? ref : Array(3).fill(Math.max(...ref));

	// light laid over the surface, kept apart and screened back over the art: behind glass, everything brighter than the
	// sign's smooth light (its reflections); on any sign, glare well above the light round it (a floodlight, a hot spot)
	let reflection = null;
	const base = Float32Array.from(rgb);
	if (kind === 'glass') {
		reflection = new Uint8Array(n * 3);
		for (let c = 0; c < 3; c++) {
			const ch = Float32Array.from({ length: n }, (_, i) => rgb[i * 3 + c]);
			const low = smooth(ch, sign, w, h, diag * 0.01);
			for (let i = 0; i < n; i++) {
				const over = sign[i] ? Math.max(0, ch[i] - low[i]) : 0;
				base[i * 3 + c] = ch[i] - over;
				reflection[i * 3 + c] = Math.min(255, Math.round(over * 1.5));
			}
		}
	} else {
		const low = smooth(L, Float32Array.from({ length: n }, (_, i) => (clear(i) ? 1 : 0)), w, h, diag * 0.04);
		const glare = new Uint8Array(n * 3);
		let count = 0;
		for (let i = 0; i < n; i++) {
			const over = sign[i] ? Math.max(0, L[i] - low[i] * GLARE - 6) : 0;
			if (over <= 0) continue;
			count++;
			for (let c = 0; c < 3; c++) {
				const v = (rgb[i * 3 + c] * over) / Math.max(1, L[i]);
				base[i * 3 + c] -= v;
				glare[i * 3 + c] = Math.min(255, Math.round(v));
			}
		}
		if (count > n * 0.0002) reflection = glare;
	}
	const shading = new Uint8Array(n * 3);
	for (let i = 0; i < n * 3; i++) shading[i] = Math.min(255, Math.round((base[i] / white[i % 3]) * 255));

	// the grain: the spread of each clear pixel from its 3 × 3 mean, robustly (a median absolute deviation)
	const resid = [];
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const i = y * w + x;
			if (!clear(i)) continue;
			let m = 0;
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) m += L[i + dy * w + dx] / 9;
			resid.push(Math.abs(L[i] - m));
		}
	}
	const noise = resid.length ? (quantile(resid, 0.5) * 1.4826) / Math.sqrt(8 / 9) : 0;
	return { shading, reflection, mask, noise: Math.round(noise * 100) / 100 };
}
