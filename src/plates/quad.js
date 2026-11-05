/**
 * @module @logomarks/mockups/plates/quad
 *
 * A sign in a photo is a quadrilateral: its four corners where the camera
 * saw them. These carry a flat rectangle onto it (the projective map that
 * fits all four corners, as a camera would), and give its bounds.
 */

/**
 * A point in a photo, in pixels.
 *
 * @typedef {[number, number]} Point
 */

/**
 * The homography carrying the unit square onto a quadrilateral (Heckbert's square-to-quad map).
 *
 * A point `(u, v)` of the square lands at `((a u + b v + c) / w, (d u + e v + f) / w)`,
 * with `w = g u + h v + 1`; the square's corners `(0, 0)`, `(1, 0)`, `(1, 1)` and
 * `(0, 1)` land on the quadrilateral's, in order.
 *
 * @param {readonly Point[]} corners The quadrilateral, clockwise from the top-left.
 * @returns {[number, number, number, number, number, number, number, number]} `[a, b, c, d, e, f, g, h]`.
 */
export function homography(corners) {
	const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = corners;
	const [sx, sy] = [x0 - x1 + x2 - x3, y0 - y1 + y2 - y3];
	let g = 0;
	let h = 0;
	if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
		const [dx1, dx2, dy1, dy2] = [x1 - x2, x3 - x2, y1 - y2, y3 - y2];
		const det = dx1 * dy2 - dx2 * dy1;
		g = (sx * dy2 - dx2 * sy) / det;
		h = (dx1 * sy - sx * dy1) / det;
	}
	return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h];
}

/**
 * The projective map from a `width` × `height` rectangle onto a quadrilateral.
 *
 * @param {readonly Point[]} corners The quadrilateral, clockwise from the top-left (the rectangle's top-left lands on the first).
 * @param {number} width The rectangle's width.
 * @param {number} height Its height.
 * @returns {(x: number, y: number) => Point} Where each point of the rectangle lands.
 */
export function quadMap(corners, width, height) {
	const [a, b, c, d, e, f, g, h] = homography(corners);
	return (x, y) => {
		const [u, v] = [x / width, y / height];
		const w = g * u + h * v + 1;
		return [(a * u + b * v + c) / w, (d * u + e * v + f) / w];
	};
}

/**
 * The box round a quadrilateral, grown by a margin and held inside the photo, in whole pixels.
 *
 * @param {readonly Point[]} corners The quadrilateral.
 * @param {number} width The photo's width.
 * @param {number} height Its height.
 * @param {number} [margin=2] How far to grow it, in pixels.
 * @returns {[number, number, number, number]} Its left, top, width and height.
 */
export function quadBox(corners, width, height, margin = 2) {
	const xs = corners.map((p) => p[0]);
	const ys = corners.map((p) => p[1]);
	const x = Math.max(0, Math.floor(Math.min(...xs) - margin));
	const y = Math.max(0, Math.floor(Math.min(...ys) - margin));
	const r = Math.min(width, Math.ceil(Math.max(...xs) + margin));
	const b = Math.min(height, Math.ceil(Math.max(...ys) + margin));
	return [x, y, r - x, b - y];
}

/**
 * Whether a point is inside a convex quadrilateral (either winding).
 *
 * @param {readonly Point[]} q The quadrilateral.
 * @param {number} x The point's x.
 * @param {number} y Its y.
 * @returns {boolean}
 */
export function inQuad(q, x, y) {
	let sign = 0;
	for (let i = 0; i < 4; i++) {
		const [ax, ay] = q[i];
		const [bx, by] = q[(i + 1) % 4];
		const c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
		if (c !== 0) {
			if (sign && Math.sign(c) !== sign) return false;
			sign = Math.sign(c);
		}
	}
	return true;
}
