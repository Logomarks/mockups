/**
 * @module @arraypress/mockups/materials/splatter
 *
 * Splatter vinyl: blobs of colour dropped into the pressing, each a wobbly
 * round splash with droplets thrown out around it, edges a touch soft where
 * the colour bled. Seeded, so a record always splatters the same way.
 */

import { el } from '../render/svg.js';
import { rng } from '../util/rng.js';
import { n } from '../util/num.js';

/**
 * A closed, smooth blob through points round a centre (Catmull-Rom as cubic Béziers).
 *
 * @param {number} x Its centre, x.
 * @param {number} y Its centre, y.
 * @param {number} s Its radius.
 * @param {import('../util/rng.js').Rng} r The generator.
 * @param {number} [wobble=0.35] How far the edge strays from round.
 * @returns {string} Path data.
 */
export function blob(x, y, s, r, wobble = 0.35) {
	const k = 12;
	// a low-frequency wobble (a few lobes) plus a little jitter: a splash, not a rock
	const ph = r.range(0, Math.PI * 2);
	const lobes = 3 + Math.floor(r.next() * 3);
	const pts = Array.from({ length: k }, (_, i) => {
		const a = (i / k) * Math.PI * 2;
		const d = s * (1 + wobble * (0.6 * Math.sin(a * lobes + ph) + r.range(-0.4, 0.4)));
		return [x + Math.cos(a) * d, y + Math.sin(a) * d];
	});
	let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
	for (let i = 0; i < k; i++) {
		const [p0, p1, p2, p3] = [-1, 0, 1, 2].map((o) => pts[(i + o + k) % k]);
		d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
	}
	return d + 'Z';
}

/**
 * The splatter over a record's body, centred on the origin.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {readonly string[]} colors Its colours, used in turn.
 * @param {number} radius The record's radius.
 * @param {string} seed The seed.
 * @returns {string} The markup.
 */
export function splatter(sc, colors, radius, seed) {
	const r = rng(`${seed}:splatter`);
	const count = 34 + Math.floor(r.next() * 14);
	/** @type {string[]} */
	const paths = colors.map(() => '');
	for (let i = 0; i < count; i++) {
		const a = r.range(0, Math.PI * 2);
		const d = radius * Math.sqrt(r.range(0.1, 1.05));
		const x = Math.cos(a) * d;
		const y = Math.sin(a) * d;
		// mostly small splashes, now and then a big one
		const s = radius * (0.018 + 0.085 * r.next() ** 1.8);
		let drops = blob(x, y, s, r, 0.35);
		// spatter thrown out round it, thinning with distance
		for (let j = 0, m = 6 + Math.floor(r.next() * 14); j < m; j++) {
			const da = r.range(0, Math.PI * 2);
			const dd = s * (1.2 + 2.8 * r.next() ** 1.5);
			drops += blob(x + Math.cos(da) * dd, y + Math.sin(da) * dd, s * r.range(0.04, 0.16) * (1.6 - dd / (s * 4)), r, 0.15);
		}
		paths[i % colors.length] += drops;
	}
	const out = paths.map((d, i) => d && el('path', { d, fill: colors[i] })).join('');
	return el('g', { filter: sc.blur(radius * 0.004), opacity: 0.94 }, out);
}
