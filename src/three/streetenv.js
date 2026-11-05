/**
 * @module @logomarks/mockups/three/streetenv
 *
 * A street by day, at golden hour or at dusk, for glossy things to
 * reflect, painted as an equirectangular panorama: a sky warming to the
 * horizon with the sun low in it, soft clouds, a ring of buildings in
 * silhouette with lit and dark windows, the pavement, and the artwork as
 * a big poster on the buildings behind the camera, where a lens facing
 * the camera reflects it. The poster is painted mirrored, so its
 * reflection reads the right way round.
 */

import { canvas2d } from '../render/image.js';
import { rng } from '../util/rng.js';
import { mix } from '../util/color.js';

/** Where the poster hangs on the panorama: its centre (u round from −x, v up from the floor) and its height (a share of the panorama's). */
export const POSTER = Object.freeze({ u: 0.72, v: 0.5, h: 0.3 });

/** The times of day: the sky from its top to the horizon, the sun's colour, and the buildings' shade and lit side. */
export const STREET_TIMES = Object.freeze({
	day: Object.freeze({ top: '#3f78c4', horizon: '#cfe0ef', sun: '#fffaf0', shade: '#3b4048', lit: '#b7aa98', ground: '#4a4845' }),
	golden: Object.freeze({ top: '#4a6fa8', horizon: '#f4cf9e', sun: '#fff0d0', shade: '#2b2c33', lit: '#a9805e', ground: '#3a3532' }),
	dusk: Object.freeze({ top: '#1d2a52', horizon: '#e88b6a', sun: '#ffc79a', shade: '#16171f', lit: '#5b4a52', ground: '#1f1d22' }),
});

/**
 * The street painted on a canvas.
 *
 * @param {(CanvasImageSource & { width: number, height: number }) | null} poster The artwork, decoded (`null`: the bare street).
 * @param {{ time?: import('./streetenv.js').StreetTime, seed?: string, size?: number }} [o] The time of day (`'golden'`), the seed, and the panorama's width (2048).
 * @returns {HTMLCanvasElement} The panorama, twice as wide as it's tall.
 */
export function streetCanvas(poster, { time = 'golden', seed = 'street', size = 2048 } = {}) {
	const t = STREET_TIMES[time];
	const W = size;
	const H = size / 2;
	const [c, g] = canvas2d(W, H);
	const r = rng(`${seed}:street`);
	const horizon = H * 0.5;
	// the sky, and the sun low over the buildings
	const sky = g.createLinearGradient(0, 0, 0, horizon);
	sky.addColorStop(0, t.top);
	sky.addColorStop(0.7, mix(t.top, t.horizon, 0.6));
	sky.addColorStop(1, t.horizon);
	g.fillStyle = sky;
	g.fillRect(0, 0, W, horizon);
	const sx = W * 0.58;
	const sun = g.createRadialGradient(sx, horizon * 0.78, 0, sx, horizon * 0.78, H * 0.35);
	sun.addColorStop(0, t.sun);
	sun.addColorStop(0.04, t.sun);
	sun.addColorStop(0.2, `${t.sun}88`);
	sun.addColorStop(1, `${t.sun}00`);
	g.fillStyle = sun;
	g.fillRect(0, 0, W, horizon);
	// soft clouds
	g.filter = `blur(${W * 0.006}px)`;
	for (let i = 0; i < 14; i++) {
		g.fillStyle = `rgba(255,255,255,${r.range(0.12, 0.35)})`;
		g.beginPath();
		g.ellipse(r.range(0, W), r.range(H * 0.08, horizon * 0.62), r.range(W * 0.03, W * 0.08), r.range(H * 0.01, H * 0.03), 0, 0, Math.PI * 2);
		g.fill();
	}
	g.filter = 'none';
	// the pavement
	const ground = g.createLinearGradient(0, horizon, 0, H);
	ground.addColorStop(0, mix(t.ground, t.horizon, 0.25));
	ground.addColorStop(0.25, t.ground);
	ground.addColorStop(1, mix(t.ground, '#000000', 0.5));
	g.fillStyle = ground;
	g.fillRect(0, horizon, W, H - horizon);
	// the buildings: blocks round the horizon, their sunlit faces warm, rows of windows
	let x = 0;
	while (x < W) {
		const w = r.range(W * 0.025, W * 0.07);
		const top = horizon - r.range(H * 0.06, H * 0.26);
		const litSide = Math.abs(x + w / 2 - sx) < W * 0.25;
		const face = litSide ? mix(t.shade, t.lit, r.range(0.35, 0.8)) : mix(t.shade, t.lit, r.range(0, 0.25));
		g.fillStyle = face;
		g.fillRect(x, top, w + 1, horizon - top + H * 0.012);
		const cols = Math.max(2, Math.round(w / (W * 0.007)));
		const rows = Math.max(2, Math.round((horizon - top) / (H * 0.022)));
		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				const lit = r.next() < (time === 'dusk' ? 0.35 : 0.12);
				g.fillStyle = lit ? mix(face, '#ffe2b0', 0.55) : mix(face, '#000000', 0.35);
				g.fillRect(x + ((i + 0.25) * w) / cols, top + H * 0.008 + j * H * 0.022, (w / cols) * 0.5, H * 0.011);
			}
		}
		x += w;
	}
	// no poster: the bare street (a shop window's reflection)
	if (!poster) return c;
	// the poster, mirrored: on a dark board fixed to the building behind the camera
	const ph = H * POSTER.h;
	const aspect = poster.width / poster.height || 1;
	// an equirectangular panorama stretches widths by 1 / cos(latitude); the poster sits on the horizon, level with the lens
	const pw = (ph * aspect) / Math.cos((POSTER.v - 0.5) * Math.PI);
	const px = POSTER.u * W;
	const py = (1 - POSTER.v) * H;
	g.fillStyle = '#141414';
	g.fillRect(px - pw / 2 - ph * 0.03, py - ph / 2 - ph * 0.03, pw + ph * 0.06, ph * 1.06);
	g.save();
	g.translate(px, py);
	g.scale(-1, 1);
	g.drawImage(poster, -pw / 2, -ph / 2, pw, ph);
	g.restore();
	return c;
}
