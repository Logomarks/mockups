/**
 * @module @arraypress/mockups/objects/billboard
 *
 * A billboard: a roadside board on a mast against a soft drawn sky (a
 * field and distant trees below it, a catwalk and lamps under the panel),
 * or a framed poster on a city wall (brick, a downpipe, the pavement in
 * front). Seen from the street, straight on or at an angle; by day, at
 * dusk, or at night with its lamps on. The art is warped onto the panel
 * with a true perspective map. Dimensions are in metres.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { fitArt } from '../render/fit.js';
import { grainLayer } from '../materials/grain.js';
import { keyLight, lit } from '../materials/light.js';
import { sky, SKIES } from '../materials/sky.js';
import { nightVeil, lamp } from '../materials/night.js';
import { slab } from '../parts/slab.js';
import { pole } from '../parts/pole.js';
import { artFace } from '../parts/face.js';
import { land } from '../parts/land.js';
import { brickWall } from '../parts/brick.js';
import { street } from '../parts/pavement.js';
import { camera, frame, horizon, onPlane, seen } from '../util/camera.js';
import { polyPath } from '../util/shape.js';
import { resolveSize } from '../util/size.js';
import { clamp } from '../util/num.js';
import { isHex } from '../util/color.js';
import { num, oneOf, viewOf } from '../util/options.js';

/** Each setting's board: its height, how high its bottom is, its depth, the frame round the poster, the default proportions, and where the camera stands. */
export const BILLBOARD = Object.freeze({
	roadside: Object.freeze({ height: 4, bottom: 6.6, depth: 0.5, frame: 0.16, ratio: 3, distance: 34, eye: 1.7 }),
	wall: Object.freeze({ height: 3.05, bottom: 2.4, depth: 0.1, frame: 0.07, ratio: 2, distance: 14, eye: 1.6 }),
});

/** The named views: straight on, and from the left at an angle. `tilt` raises the camera's aim, in degrees. */
export const BILLBOARD_VIEWS = Object.freeze({ front: Object.freeze({ tilt: 0, turn: 0 }), angle: Object.freeze({ tilt: 0, turn: -38 }) });

/** The board's and the lamps' metal. */
const STEEL = '#6f747b';

/**
 * A billboard mockup.
 *
 * @param {import('./billboard.js').BillboardOptions} options The art, the setting and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function billboard(options) {
	if (!options || typeof options !== 'object') throw new TypeError('billboard: pass { art, … }');
	const { art, seed = 'billboard' } = options;
	if (art === undefined || art === null) throw new TypeError('billboard: art is required');
	const setting = oneOf('billboard', 'setting', options.setting, ['roadside', 'wall'], 'roadside');
	const time = oneOf('billboard', 'time', options.time, ['day', 'dusk', 'night'], 'day');
	const view = viewOf('billboard', options.view, BILLBOARD_VIEWS, 'front');
	const B = BILLBOARD[setting];
	const ratio = clamp(num('billboard', options.ratio, B.ratio, 'ratio'), 0.5, 5);
	const light = clamp(num('billboard', options.light, 0.4, 'light'), -1, 1);
	const fit = clamp(num('billboard', options.fit, setting === 'wall' ? 0.6 : 0.78, 'fit'), 0.2, 1);
	const fill = oneOf('billboard', 'fill', options.fill, ['cover', 'contain'], 'cover');
	const paper = options.background ?? '#ffffff';
	if (!isHex(paper)) throw new TypeError(`billboard: background is a hex colour (got ${JSON.stringify(paper)})`);
	const { width, height } = resolveSize(options.size);
	const H = B.height;
	const Wd = H * ratio;
	const y0 = B.bottom;
	const zf = setting === 'wall' ? B.depth : B.depth / 2;

	const target = /** @type {import('../util/vec.js').Vec3} */ ([0, y0 + H * (setting === 'wall' ? 0.3 : 0.25), 0]);
	const pitch = (Math.asin(clamp((B.eye - target[1]) / B.distance, -1, 1)) * 180) / Math.PI + view.tilt;
	const cam = camera({ target, pitch, turn: view.turn, distance: B.distance, fov: 32 });
	const pts = /** @type {import('../util/vec.js').Vec3[]} */ ([[-Wd / 2, y0, zf], [Wd / 2, y0, zf], [-Wd / 2, y0 + H, zf], [Wd / 2, y0 + H, zf], ...(setting === 'roadside' ? [[0, 0, -0.9]] : [])]);
	const vw = frame(cam, { width, height, points: pts, fit, shift: [0, setting === 'roadside' ? -0.02 : -0.06] });
	const key = keyLight(light, 1.6);
	const sc = scene({ width, height, key: JSON.stringify({ o: 'billboard', setting, view, time, seed }) });
	const hz = horizon(vw);
	const night = time === 'night';

	// the panel: a box whose front carries the frame and the poster
	const panel = slab(vw, { frame: { o: [0, y0 + H / 2, zf], u: [1, 0, 0], v: [0, -1, 0], n: [0, 0, 1] }, width: Wd, height: H, radius: 0.02, depth: B.depth, color: STEEL, finish: { specular: 0.2, shine: 12 }, light: key, bevel: Math.max(0.6, width / 1600), profile: [[0, 1, 0]] });
	const f = B.frame;
	const lamps = setting === 'roadside' ? Math.max(2, Math.round(Wd / 3.5)) : Math.max(2, Math.round(Wd / 2.5));
	/** The poster on the panel's face, lit by day or by its lamps (from below on a mast, from above on a wall). */
	const poster = (lamp) =>
		artFace(sc, {
			map: panel.map,
			width: Wd,
			height: H,
			draw: (w, h) => {
				const k = w / Wd;
				const clip = sc.id('poster');
				const [px, py, pw, ph] = [f * k, f * k, w - 2 * f * k, h - 2 * f * k];
				sc.def(el('clipPath', { id: clip }, el('rect', { x: px, y: py, width: pw, height: ph })));
				const ids = { lip: sc.id('lip'), lamp: sc.id('lamp') };
				sc.def(el('linearGradient', { id: ids.lip, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.28 }), el('stop', { offset: 0.06, 'stop-color': '#000', 'stop-opacity': 0.06 }), el('stop', { offset: 0.2, 'stop-color': '#000', 'stop-opacity': 0 })));
				const from = setting === 'roadside' ? 1 : 0;
				sc.def(el('linearGradient', { id: ids.lamp, x1: 0, y1: from, x2: 0, y2: 1 - from }, el('stop', { offset: 0, 'stop-color': '#fff1d6', 'stop-opacity': 0.12 }), el('stop', { offset: 0.5, 'stop-color': '#000', 'stop-opacity': 0.12 }), el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.42 })));
				return (
					el('rect', { width: w, height: h, fill: setting === 'wall' ? '#d8d9db' : '#3a3d42' }) +
					el('g', { 'clip-path': `url(#${clip})` }, fill === 'contain' ? el('rect', { x: px, y: py, width: pw, height: ph, fill: paper }) : '', fitArt(sc, art, { x: px, y: py, width: pw, height: ph }, fill)) +
					el('rect', { x: px, y: py, width: pw, height: ph, fill: `url(#${lamp ? ids.lamp : ids.lip})` })
				);
			},
		});

	sc.add(sky(sc, { time, horizon: hz, sun: light, seed }));
	if (setting === 'roadside') {
		const skyLook = SKIES[time];
		sc.add(land(sc, { horizon: hz, haze: skyLook.stops[3], seed }));
		const top = y0 + H * 0.5;
		sc.add(pole(sc, vw, { from: [0, -0.5, -0.9], to: [0, top, -0.9], radius: 0.42, color: '#8a8f96', light: key }));
		sc.add(el('path', { d: polyPath([[-0.7, 0, -0.2], [0.7, 0, -0.2], [0.7, 0, -1.6], [-0.7, 0, -1.6]].map((p) => vw.at(/** @type {import('../util/vec.js').Vec3} */ (p)))), fill: '#000', opacity: 0.25, filter: sc.blur(width * 0.004) }));
	} else {
		// the wall, and the frame's soft shadow on it (offset on the wall's plane, blurred in the picture)
		// only as much wall as the view sees: up to the frame's top, and along its foot and its top
		let tall = 30;
		while (tall > y0 + H + 1 && vw.at([0, tall - 1, 0])[1] < -height * 0.1) tall -= 1;
		// along as the view sees, along its foot and its top
		const [a0, a1] = seen(vw, 0, 0, [-30, 30]);
		const [b0, b1] = seen(vw, tall, 0, [-30, 30]);
		const [xa, xb] = [Math.min(a0, b0), Math.max(a1, b1)];
		const span = xb - xa;
		const k = 1000 / span;
		const wallMap = onPlane(vw, [xa, tall, 0], [1, 0, 0], [0, -1, 0]);
		const [dx, dy] = [-light * 0.14, -0.18];
		const shade = [[-Wd / 2, y0], [Wd / 2, y0], [Wd / 2, y0 + H], [-Wd / 2, y0 + H]].map(([x, y]) => vw.at([x + dx, y + dy, 0]));
		sc.add(
			artFace(sc, {
				map: (x, y) => wallMap((x / 1000) * span, (y / 1000) * span),
				width: 1000,
				height: (1000 * tall) / span,
				tolerance: 1.5,
				max: 12,
				draw: (w, h) => brickWall(sc, { width: w, height: h, scale: k, light, seed, coping: vw.at([0, tall, 0])[1] > 0 }),
			}),
			el('path', { d: polyPath(shade), fill: '#000', opacity: 0.38, filter: sc.blur(vw.scale * 0.0006 * 3) }),
			street(sc, vw, { x: [xa - 10, xb + 10], back: 0, kerb: 3.4, light }),
			pole(sc, vw, { from: [-Wd / 2 - 2.6, 0.13, 0.09], to: [-Wd / 2 - 2.6, tall, 0.09], radius: 0.055, color: '#3b3e43', light: key }),
		);
	}
	sc.add(panel.sides, el('path', { d: panel.path, fill: '#2c2f34' }));
	if (!night) sc.add(poster(false));

	// the lamps: arms reaching out from the catwalk (on a mast) or over the top (on a wall)
	const arms = [];
	const heads = [];
	for (let i = 0; i < lamps; i++) {
		const x = -Wd / 2 + (Wd * (i + 0.5)) / lamps;
		const [ya, yb] = setting === 'roadside' ? [y0 - 0.1, y0 - 0.05] : [y0 + H + 0.05, y0 + H + 0.35];
		const reach = setting === 'roadside' ? 1.5 : 0.75;
		arms.push(pole(sc, vw, { from: [x, ya, zf], to: [x, yb, zf + reach], radius: setting === 'roadside' ? 0.05 : 0.025, color: STEEL, light: key }));
		const head = slab(vw, { frame: { o: [x, yb + 0.02, zf + reach + 0.02], u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0] }, width: setting === 'roadside' ? 0.7 : 0.4, height: 0.22, radius: 0.03, depth: 0.12, color: '#2b2e33', light: key, bevel: 0, profile: [[0, 1, 0]] });
		heads.push({ markup: head.sides + el('path', { d: head.path, fill: lit('#2b2e33', [0, 1, 0], { light: key, point: [x, yb, zf + reach], eye: cam.eye }) }), at: vw.at([x, yb - 0.05, zf + reach]) });
	}
	if (setting === 'roadside') {
		// the catwalk under the panel
		const walk = slab(vw, { frame: { o: [0, y0 - 0.1, zf + 0.5], u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0] }, width: Wd + 0.4, height: 1, radius: 0.02, depth: 0.08, color: STEEL, light: key, bevel: 0, profile: [[0, 1, 0]] });
		sc.add(walk.sides, el('path', { d: walk.path, fill: lit('#5a5e64', [0, walk.frontFaces ? 1 : -1, 0], { light: key, point: [0, y0, 1], eye: cam.eye }) }));
	}
	sc.add(...arms, ...heads.map((h) => h.markup));
	if (night) {
		sc.add(nightVeil(sc, 0.74), poster(true), ...heads.map((h) => lamp(sc, h.at[0], h.at[1], width * 0.03)));
	} else if (time === 'dusk') sc.add(el('rect', { width, height, fill: '#2a1a40', opacity: 0.18 }));
	sc.add(grainLayer(sc, clamp(num('billboard', options.grain, 0.5, 'grain'), 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'billboard' };
}
