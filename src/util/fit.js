/**
 * @module @arraypress/mockups/util/fit
 *
 * Fitting a layout drawn in millimetres into a frame drawn in pixels: the
 * scale that fills a share of the frame, and the offset that centres it.
 */

/**
 * The scale and offset that fit a box in millimetres into a frame.
 *
 * @param {{ x0: number, y0: number, x1: number, y1: number }} box The layout's extent, in mm.
 * @param {{ width: number, height: number }} frame The frame, in pixels.
 * @param {number} fit How much of the frame the box may fill, 0–1.
 * @returns {import('./fit.js').Fitted} Pixels per mm, and where a point in mm lands.
 */
export function fitBox(box, frame, fit) {
	const bw = Math.max(1e-6, box.x1 - box.x0);
	const bh = Math.max(1e-6, box.y1 - box.y0);
	const mm = Math.min((frame.width * fit) / bw, (frame.height * fit) / bh);
	const ox = frame.width / 2 - ((box.x0 + box.x1) / 2) * mm;
	const oy = frame.height / 2 - ((box.y0 + box.y1) / 2) * mm;
	return { mm, at: (x, y) => [ox + x * mm, oy + y * mm] };
}

/**
 * The extent of a rectangle turned about its centre.
 *
 * @param {number} cx Its centre, x.
 * @param {number} cy Its centre, y.
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @param {number} angle Its turn, in degrees.
 * @returns {{ x0: number, y0: number, x1: number, y1: number }} The box round it.
 */
export function turnedBox(cx, cy, w, h, angle) {
	const a = (angle * Math.PI) / 180;
	const ex = (Math.abs(Math.cos(a)) * w + Math.abs(Math.sin(a)) * h) / 2;
	const ey = (Math.abs(Math.sin(a)) * w + Math.abs(Math.cos(a)) * h) / 2;
	return { x0: cx - ex, y0: cy - ey, x1: cx + ex, y1: cy + ey };
}

/**
 * The box round several boxes.
 *
 * @param {{ x0: number, y0: number, x1: number, y1: number }[]} boxes The boxes.
 * @returns {{ x0: number, y0: number, x1: number, y1: number }} Their union.
 */
export function union(boxes) {
	return boxes.reduce((u, b) => ({ x0: Math.min(u.x0, b.x0), y0: Math.min(u.y0, b.y0), x1: Math.max(u.x1, b.x1), y1: Math.max(u.y1, b.y1) }), {
		x0: Infinity,
		y0: Infinity,
		x1: -Infinity,
		y1: -Infinity,
	});
}
