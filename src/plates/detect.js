/**
 * @module @arraypress/mockups/plates/detect
 *
 * Finding a blank sign in a photo: the bright, even region whose outline is
 * most nearly a quadrilateral, its four corners fitted to its edges with
 * sub-pixel lines, and the sign's true proportions recovered from the
 * perspective (the camera's focal length solved from the corners being a
 * rectangle's).
 */

import { homography } from './quad.js';

/**
 * A photo's pixels: RGB, row by row.
 *
 * @typedef {{ data: Uint8Array, width: number, height: number }} Pixels
 */

/**
 * Luminance (Rec. 709 weights, 0–255) of each pixel.
 *
 * @param {Pixels} px The pixels.
 * @returns {Float32Array} One value per pixel.
 */
export function luminance({ data, width, height }) {
	const L = new Float32Array(width * height);
	for (let i = 0; i < L.length; i++) L[i] = 0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2];
	return L;
}

/**
 * The value below which a fraction of some values fall.
 *
 * @param {ArrayLike<number>} values The values.
 * @param {number} q The fraction, 0–1.
 * @returns {number} The quantile.
 */
export function quantile(values, q) {
	const s = Float32Array.from(values).sort();
	return s.length ? s[Math.min(s.length - 1, Math.max(0, Math.floor(q * (s.length - 1))))] : 0;
}

/**
 * The connected regions of a mask (4-neighbour), largest first.
 *
 * @param {Uint8Array} mask 1 where a pixel is in, row by row.
 * @param {number} width The mask's width.
 * @param {number} height Its height.
 * @param {number} minArea The smallest region kept, in pixels.
 * @returns {Int32Array[]} Each region's pixel indices.
 */
export function regions(mask, width, height, minArea) {
	const seen = new Uint8Array(mask.length);
	const stack = new Int32Array(mask.length);
	/** @type {Int32Array[]} */
	const out = [];
	for (let start = 0; start < mask.length; start++) {
		if (!mask[start] || seen[start]) continue;
		let top = 0;
		let n = 0;
		const members = [];
		stack[top++] = start;
		seen[start] = 1;
		while (top) {
			const i = stack[--top];
			members.push(i);
			n++;
			const x = i % width;
			for (const j of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]) {
				if (j >= 0 && j < mask.length && mask[j] && !seen[j]) {
					seen[j] = 1;
					stack[top++] = j;
				}
			}
		}
		if (n >= minArea) out.push(Int32Array.from(members));
	}
	return out.sort((a, b) => b.length - a.length);
}

/**
 * The line through some points, by total least squares.
 *
 * @param {readonly [number, number][]} pts The points (two or more).
 * @returns {{ point: [number, number], dir: [number, number] }} A point on it and its direction.
 */
export function fitLine(pts) {
	const n = pts.length;
	const [mx, my] = pts.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]);
	let [sxx, sxy, syy] = [0, 0, 0];
	for (const [x, y] of pts) {
		sxx += (x - mx) ** 2;
		sxy += (x - mx) * (y - my);
		syy += (y - my) ** 2;
	}
	const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
	return { point: [mx, my], dir: [Math.cos(angle), Math.sin(angle)] };
}

/**
 * Where two lines cross.
 *
 * @param {{ point: [number, number], dir: [number, number] }} a One line.
 * @param {{ point: [number, number], dir: [number, number] }} b The other.
 * @returns {[number, number] | null} The point, or `null` when they're parallel.
 */
export function cross(a, b) {
	const det = a.dir[0] * b.dir[1] - a.dir[1] * b.dir[0];
	if (Math.abs(det) < 1e-9) return null;
	const t = ((b.point[0] - a.point[0]) * b.dir[1] - (b.point[1] - a.point[1]) * b.dir[0]) / det;
	return [a.point[0] + a.dir[0] * t, a.point[1] + a.dir[1] * t];
}

/**
 * The area of a polygon (shoelace), positive either way round.
 *
 * @param {readonly [number, number][]} q The polygon.
 * @returns {number} Its area.
 */
export function area(q) {
	let s = 0;
	for (let i = 0; i < q.length; i++) s += q[i][0] * q[(i + 1) % q.length][1] - q[(i + 1) % q.length][0] * q[i][1];
	return Math.abs(s) / 2;
}

/**
 * A region's outline as a quadrilateral: its extreme points along the diagonals,
 * then each side refitted as a line through the boundary between them.
 *
 * @param {Int32Array} region The region's pixel indices.
 * @param {Uint8Array} mask The mask it came from.
 * @param {number} width The mask's width.
 * @returns {[number, number][] | null} Its corners, clockwise from the top-left, or `null` when it has no four sides.
 */
export function quadOf(region, mask, width) {
	const height = mask.length / width;
	/** @type {[number, number][]} */
	const edge = [];
	for (const i of region) {
		const x = i % width;
		const y = (i - x) / width;
		if (x === 0 || y === 0 || x === width - 1 || y === height - 1 || !mask[i - 1] || !mask[i + 1] || !mask[i - width] || !mask[i + width]) edge.push([x + 0.5, y + 0.5]);
	}
	if (edge.length < 8) return null;
	// the extremes along each diagonal: top-left, top-right, bottom-right, bottom-left
	const pick = (f) => edge.reduce((best, p) => (f(p) > f(best) ? p : best), edge[0]);
	const rough = [pick((p) => -p[0] - p[1]), pick((p) => p[0] - p[1]), pick((p) => p[0] + p[1]), pick((p) => p[1] - p[0])];
	// each side: the boundary points near the segment between its corners, away from the corners themselves
	const lines = rough.map((a, k) => {
		const b = rough[(k + 1) % 4];
		const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
		const len = Math.hypot(dx, dy) || 1;
		const band = Math.max(2, len * 0.02);
		const on = edge.filter((p) => {
			const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (len * len);
			const d = Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len;
			return t > 0.08 && t < 0.92 && d < band;
		});
		return on.length >= 4 ? fitLine(on) : { point: a, dir: /** @type {[number, number]} */ ([dx / len, dy / len]) };
	});
	const q = lines.map((l, k) => cross(lines[(k + 3) % 4], l));
	if (q.some((p) => !p)) return null;
	return /** @type {[number, number][]} */ (q);
}

/**
 * The blank signs in a photo, best first: bright, even regions shaped like quadrilaterals.
 *
 * @param {Pixels} px The photo.
 * @param {object} [o] Where to look.
 * @param {[number, number]} [o.near] A point on the sign: only the region holding it.
 * @param {number} [o.minArea=0.004] The smallest sign, as a fraction of the photo.
 * @returns {{ corners: [number, number][], fill: number, area: number }[]} Each sign's corners, how fully its region fills them (0–1), and its area in pixels.
 */
export function findSigns(px, { near, minArea = 0.004 } = {}) {
	const { width, height } = px;
	const L = luminance(px);
	const top = quantile(L, 0.995);
	/** @type {{ corners: [number, number][], fill: number, area: number }[]} */
	const found = [];
	for (const k of [0.92, 0.85, 0.78, 0.7, 0.6, 0.5]) {
		const mask = new Uint8Array(L.length);
		for (let i = 0; i < L.length; i++) mask[i] = L[i] >= top * k ? 1 : 0;
		for (const region of regions(mask, width, height, minArea * width * height).slice(0, 8)) {
			if (near) {
				const at = Math.round(near[1]) * width + Math.round(near[0]);
				if (!region.includes(at)) continue;
			}
			const corners = quadOf(region, mask, width);
			if (!corners) continue;
			const a = area(corners);
			const fill = Math.min(region.length / a, a / region.length);
			if (fill > 0.85) found.push({ corners, fill, area: a });
		}
	}
	// the same sign turns up at several thresholds: keep each one's best fit
	const best = [];
	for (const s of found.sort((a, b) => b.fill * Math.sqrt(b.area) - a.fill * Math.sqrt(a.area))) {
		const [cx, cy] = s.corners.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]);
		if (!best.some((b) => Math.hypot(cx - b.c[0], cy - b.c[1]) < Math.sqrt(b.s.area) * 0.3)) best.push({ s, c: [cx, cy] });
	}
	return best.map((b) => b.s);
}

/**
 * A rectangle's true width over its height, from the quadrilateral a camera saw it as.
 *
 * The focal length is solved from the rectangle's sides being square to each
 * other (with the principal point at the photo's centre). That needs both
 * pairs of sides to converge; when one pair is parallel in the photo (a sign
 * turned but not tilted, or seen straight on) the focal length can't be
 * known, and a 35 mm lens's is assumed (about the photo's longer side).
 *
 * @param {readonly [number, number][]} corners The quadrilateral, clockwise from the top-left.
 * @param {number} width The photo's width.
 * @param {number} height Its height.
 * @returns {number} The aspect.
 */
export function quadAspect(corners, width, height) {
	const [a, b, , d, e, , g, h] = homography(corners);
	const [cx, cy] = [width / 2, height / 2];
	// the square's sides as directions in the camera, before dividing by the focal length
	const u = [a - cx * g, d - cy * g, g];
	const v = [b - cx * h, e - cy * h, h];
	const big = Math.max(width, height);
	let focal = big;
	if (Math.abs(g * h) > 1e-12) {
		const f2 = -(u[0] * v[0] + u[1] * v[1]) / (g * h);
		if (f2 > 0) focal = Math.min(big * 4, Math.max(big * 0.5, Math.sqrt(f2)));
	}
	const size = (w) => Math.hypot(w[0] / focal, w[1] / focal, w[2]);
	return size(u) / size(v);
}
