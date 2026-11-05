/**
 * @module @logomarks/mockups/util/pathpoints
 *
 * An SVG's outlines as points: every `<path>`'s `d` parsed (all of SVG's
 * path commands, absolute and relative), its curves and arcs flattened to
 * short straight runs, and each subpath returned as its own list. What a
 * scene that bends something along a mark's outline needs (a neon tube, a
 * routed edge), with no browser.
 */

/** How many straight runs a curve or arc is flattened into. */
const CURVE_STEPS = 16;

/**
 * A path's `d` as subpaths of points.
 *
 * @param {string} d The path data.
 * @returns {{ points: [number, number][], closed: boolean }[]} Each subpath's points, and whether it was closed.
 */
export function pathPoints(d) {
	const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
	/** @type {{ points: [number, number][], closed: boolean }[]} */
	const out = [];
	let i = 0;
	let cmd = '';
	let [x, y] = [0, 0];
	let [sx, sy] = [0, 0];
	/** @type {[number, number] | null} The last control point, for S and T. */
	let ctrl = null;
	/** @type {[number, number][] | null} */
	let cur = null;
	const num = () => parseFloat(tokens[i++]);
	const more = () => i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i]);
	const start = () => {
		if (cur && cur.length > 1) out.push({ points: cur, closed: false });
		cur = [[x, y]];
	};
	const to = (px, py) => {
		if (!cur) cur = [[x, y]];
		cur.push([px, py]);
		[x, y] = [px, py];
	};
	while (i < tokens.length) {
		if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++];
		const rel = cmd === cmd.toLowerCase();
		const ox = rel ? x : 0;
		const oy = rel ? y : 0;
		const C = cmd.toUpperCase();
		if (C === 'Z') {
			if (cur && cur.length > 1) out.push({ points: cur, closed: true });
			cur = null;
			[x, y] = [sx, sy];
			ctrl = null;
			continue;
		}
		if (!more()) break;
		if (C === 'M') {
			[x, y] = [ox + num(), oy + num()];
			[sx, sy] = [x, y];
			start();
			// further pairs after a move are lines
			cmd = rel ? 'l' : 'L';
			ctrl = null;
		} else if (C === 'L') to(ox + num(), oy + num());
		else if (C === 'H') to(ox + num(), y);
		else if (C === 'V') to(x, oy + num());
		else if (C === 'C' || C === 'S') {
			const [x1, y1] = C === 'C' ? [ox + num(), oy + num()] : ctrl ? [2 * x - ctrl[0], 2 * y - ctrl[1]] : [x, y];
			const [x2, y2, ex, ey] = [ox + num(), oy + num(), ox + num(), oy + num()];
			const [x0, y0] = [x, y];
			for (let k = 1; k <= CURVE_STEPS; k++) {
				const t = k / CURVE_STEPS;
				const m = 1 - t;
				to(m ** 3 * x0 + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t ** 3 * ex, m ** 3 * y0 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t ** 3 * ey);
			}
			ctrl = [x2, y2];
			continue;
		} else if (C === 'Q' || C === 'T') {
			const [x1, y1] = C === 'Q' ? [ox + num(), oy + num()] : ctrl ? [2 * x - ctrl[0], 2 * y - ctrl[1]] : [x, y];
			const [ex, ey] = [ox + num(), oy + num()];
			const [x0, y0] = [x, y];
			for (let k = 1; k <= CURVE_STEPS; k++) {
				const t = k / CURVE_STEPS;
				const m = 1 - t;
				to(m * m * x0 + 2 * m * t * x1 + t * t * ex, m * m * y0 + 2 * m * t * y1 + t * t * ey);
			}
			ctrl = [x1, y1];
			continue;
		} else if (C === 'A') {
			const [rx, ry, rot, large, sweep, ex, ey] = [num(), num(), num(), num(), num(), ox + num(), oy + num()];
			for (const p of arcPoints([x, y], [ex, ey], rx, ry, rot, !!large, !!sweep)) to(p[0], p[1]);
		} else {
			// an unknown command: skip its numbers
			while (more()) i++;
		}
		ctrl = null;
	}
	if (cur && /** @type {[number, number][]} */ (cur).length > 1) out.push({ points: cur, closed: false });
	return out;
}

/**
 * An elliptical arc flattened (SVG's endpoint parameterisation, converted to its centre's).
 *
 * @param {[number, number]} p0 Where it starts.
 * @param {[number, number]} p1 Where it ends.
 * @param {number} rx The x radius.
 * @param {number} ry The y radius.
 * @param {number} rot The ellipse's turn, degrees.
 * @param {boolean} large The large-arc flag.
 * @param {boolean} sweep The sweep flag.
 * @returns {[number, number][]} The points after the start, to the end.
 */
export function arcPoints(p0, p1, rx, ry, rot, large, sweep) {
	if (!rx || !ry || (p0[0] === p1[0] && p0[1] === p1[1])) return [p1];
	const phi = (rot * Math.PI) / 180;
	const [cos, sin] = [Math.cos(phi), Math.sin(phi)];
	const dx = (p0[0] - p1[0]) / 2;
	const dy = (p0[1] - p1[1]) / 2;
	const x1 = cos * dx + sin * dy;
	const y1 = -sin * dx + cos * dy;
	rx = Math.abs(rx);
	ry = Math.abs(ry);
	const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
	if (lambda > 1) {
		rx *= Math.sqrt(lambda);
		ry *= Math.sqrt(lambda);
	}
	const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
	const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
	const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
	const cx1 = (k * rx * y1) / ry;
	const cy1 = (-k * ry * x1) / rx;
	const cx = cos * cx1 - sin * cy1 + (p0[0] + p1[0]) / 2;
	const cy = sin * cx1 + cos * cy1 + (p0[1] + p1[1]) / 2;
	const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
	const t0 = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
	let dt = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
	if (!sweep && dt > 0) dt -= 2 * Math.PI;
	if (sweep && dt < 0) dt += 2 * Math.PI;
	const steps = Math.max(2, Math.ceil((Math.abs(dt) / (Math.PI / 2)) * (CURVE_STEPS / 2)));
	const out = [];
	for (let s = 1; s <= steps; s++) {
		const t = t0 + (dt * s) / steps;
		const ex = rx * Math.cos(t);
		const ey = ry * Math.sin(t);
		out.push(/** @type {[number, number]} */ ([cos * ex - sin * ey + cx, sin * ex + cos * ey + cy]));
	}
	out[out.length - 1] = p1;
	return out;
}

/**
 * Every outline in an SVG document, with its viewBox.
 *
 * @param {string} svg The markup.
 * @returns {{ box: [number, number, number, number], outlines: { points: [number, number][], closed: boolean }[] }} The viewBox (x, y, width, height), and the subpaths of every path.
 * @throws {TypeError} When it has no paths.
 */
export function svgOutlines(svg) {
	const vb = /viewBox\s*=\s*["']([^"']+)["']/i.exec(svg);
	const w = /\bwidth\s*=\s*["']([\d.]+)/i.exec(svg);
	const h = /\bheight\s*=\s*["']([\d.]+)/i.exec(svg);
	const nums = vb ? vb[1].trim().split(/[\s,]+/).map(Number) : [0, 0, Number(w?.[1] ?? 100), Number(h?.[1] ?? 100)];
	const box = /** @type {[number, number, number, number]} */ (nums);
	const outlines = [...svg.matchAll(/<path\b[^>]*\sd\s*=\s*["']([^"']+)["']/gi)].flatMap((m) => pathPoints(m[1]));
	if (!outlines.length) throw new TypeError('the art has no <path> outlines to follow');
	return { box, outlines };
}

/**
 * A run of points resampled at an even spacing.
 *
 * @param {[number, number][]} points The points.
 * @param {number} step The spacing.
 * @param {boolean} closed Whether it loops back to its start.
 * @returns {[number, number][]} The resampled points (at least three for a loop).
 */
export function resample(points, step, closed) {
	const pts = closed ? [...points, points[0]] : points;
	const out = [pts[0]];
	let carry = 0;
	for (let i = 1; i < pts.length; i++) {
		const [ax, ay] = pts[i - 1];
		const [bx, by] = pts[i];
		const len = Math.hypot(bx - ax, by - ay);
		let t = step - carry;
		while (t <= len) {
			out.push([ax + ((bx - ax) * t) / len, ay + ((by - ay) * t) / len]);
			t += step;
		}
		carry = len - (t - step);
	}
	if (closed && out.length > 1) {
		const [fx, fy] = out[0];
		const [lx, ly] = out[out.length - 1];
		if (Math.hypot(fx - lx, fy - ly) < step * 0.5) out.pop();
	} else if (!closed) out.push(pts[pts.length - 1]);
	return out;
}

/**
 * How long a run of points is.
 *
 * @param {[number, number][]} points The points.
 * @param {boolean} closed Whether it loops back.
 * @returns {number} Its length.
 */
export function runLength(points, closed) {
	let len = 0;
	for (let i = 1; i < points.length; i++) len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
	if (closed && points.length > 1) len += Math.hypot(points[0][0] - points[points.length - 1][0], points[0][1] - points[points.length - 1][1]);
	return len;
}
