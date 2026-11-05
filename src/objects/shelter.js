/**
 * @module @logomarks/mockups/objects/shelter
 *
 * A bus shelter: a glass shelter (a steel roof, a glazed back and end, a
 * bench) on the pavement, with a backlit poster in a lightbox at its end,
 * seen from the street at an angle or square to the poster. By day the
 * poster sits in a soft sky over out-of-focus buildings; at night the
 * street goes dark blue and the lightbox glows, lighting the pavement
 * and the glass round it. The poster is warped onto the lightbox with a
 * true perspective map. Dimensions are in metres.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { fitArt } from '../render/fit.js';
import { grainLayer } from '../materials/grain.js';
import { keyLight, lit } from '../materials/light.js';
import { sky, SKIES } from '../materials/sky.js';
import { glass } from '../materials/glass.js';
import { nightVeil, glow } from '../materials/night.js';
import { slab } from '../parts/slab.js';
import { pole } from '../parts/pole.js';
import { artFace } from '../parts/face.js';
import { street, patch } from '../parts/pavement.js';
import { skyline } from '../parts/skyline.js';
import { camera, frame, horizon } from '../util/camera.js';
import { polyPath } from '../util/shape.js';
import { resolveSize } from '../util/size.js';
import { isHex } from '../util/color.js';
import { clamp } from '../util/num.js';
import { num, oneOf, viewOf } from '../util/options.js';

/** The shelter: its length, depth and height, and the lightbox (outer width and height, depth, the frame round the poster, how high it stands). */
export const SHELTER = Object.freeze({ length: 3.6, depth: 1.3, height: 2.45, box: Object.freeze({ width: 1.3, height: 1.95, depth: 0.18, frame: 0.065, foot: 0.22 }) });

/** The named views: from the street at an angle, and square to the poster. */
export const SHELTER_VIEWS = Object.freeze({ angle: Object.freeze({ tilt: 0, turn: 42 }), front: Object.freeze({ tilt: 0, turn: 64 }) });

/** The shelter's steel. */
const STEEL = '#5d636b';

/**
 * A bus-shelter mockup.
 *
 * @param {import('./shelter.js').ShelterOptions} options The poster and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function shelter(options) {
	if (!options || typeof options !== 'object') throw new TypeError('shelter: pass { art, … }');
	const { art, seed = 'shelter' } = options;
	if (art === undefined || art === null) throw new TypeError('shelter: art is required');
	const time = oneOf('shelter', 'time', options.time, ['day', 'night'], 'day');
	const view = viewOf('shelter', options.view, SHELTER_VIEWS, 'angle');
	const fill = oneOf('shelter', 'fill', options.fill, ['cover', 'contain'], 'cover');
	const paper = options.background ?? '#ffffff';
	if (!isHex(paper)) throw new TypeError(`shelter: background is a hex colour (got ${JSON.stringify(paper)})`);
	const light = clamp(num('shelter', options.light, -0.4, 'light'), -1, 1);
	const fit = clamp(num('shelter', options.fit, 0.8, 'fit'), 0.2, 1);
	const { width, height } = resolveSize(options.size);
	const night = time === 'night';
	const S = SHELTER;
	const B = S.box;
	const [x0, x1, zb] = [-S.length / 2, S.length / 2, -S.depth];

	const target = /** @type {import('../util/vec.js').Vec3} */ ([0.9, 1.25, -0.6]);
	const distance = 7.5;
	const pitch = (Math.asin(clamp((1.55 - target[1]) / distance, -1, 1)) * 180) / Math.PI + view.tilt;
	const cam = camera({ target, pitch, turn: view.turn, distance, fov: 34 });
	const pts = /** @type {import('../util/vec.js').Vec3[]} */ ([[x0, 0, zb], [x0, S.height, zb], [x0, 0, 0.3], [x0, S.height, 0.3], [x1 + B.depth, 0, zb], [x1 + B.depth, S.height, 0.3], [x1 + B.depth, 0, 0.3]]);
	const vw = frame(cam, { width, height, points: pts, fit, shift: [0, 0.02] });
	const key = keyLight(light, 1.4);
	const sc = scene({ width, height, key: JSON.stringify({ o: 'shelter', view, time, seed }) });
	const hz = horizon(vw);
	const px = width / 1600;
	const look = SKIES[night ? 'night' : 'day'];

	// the lightbox: a slab standing at the shelter's end, its face to +x
	const bz = (zb + 0) / 2;
	const box = slab(vw, { frame: { o: [x1 + B.depth, B.foot + B.height / 2, bz], u: [0, 0, -1], v: [0, -1, 0], n: [1, 0, 0] }, width: B.width, height: B.height, radius: 0.03, depth: B.depth, color: STEEL, light: key, bevel: Math.max(0.6, px), profile: [[0, 1, 0]] });
	const f = B.frame;
	const posterAt = (x, y) => box.map(f + x, f + y);
	const [pw, ph] = [B.width - 2 * f, B.height - 2 * f];
	const posterQuad = [[0, 0], [pw, 0], [pw, ph], [0, ph]].map(([x, y]) => posterAt(x, y));
	/** The poster: art in the box, lit from inside at night (brighter in the middle, as a lightbox is). */
	const poster = (glowing) =>
		artFace(sc, {
			map: posterAt,
			width: pw,
			height: ph,
			draw: (w, h) => {
				const g = sc.id('backlight');
				sc.def(el('radialGradient', { id: g, cx: 0.5, cy: 0.5, r: 0.75 }, el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': glowing ? 0.1 : 0 }), el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': glowing ? 0.12 : 0.06 })));
				return (fill === 'contain' ? el('rect', { width: w, height: h, fill: paper }) : '') + fitArt(sc, art, { x: 0, y: 0, width: w, height: h }, fill) + el('rect', { width: w, height: h, fill: `url(#${g})` });
			},
		});

	// glass panes: a faint tint, the sky reflected, a bright edge
	const pane = (q) => {
		const pts2 = q.map((p) => vw.at(/** @type {import('../util/vec.js').Vec3} */ (p)));
		return el('path', { d: polyPath(pts2), fill: night ? '#22324a' : '#d7e6ee', opacity: night ? 0.25 : 0.2 }) + glass(sc, { outline: pts2, light, strength: night ? 0.5 : 1.3, band: 0.45 }) + el('path', { d: polyPath(pts2), fill: 'none', stroke: '#e9eef2', 'stroke-opacity': 0.35, 'stroke-width': px });
	};
	const yg = 0.12;
	const yt = S.height - 0.1;
	const back = pane([[x0, yg, zb], [x1, yg, zb], [x1, yt, zb], [x0, yt, zb]]);
	const end = pane([[x0, yg, zb], [x0, yg, -0.25], [x0, yt, -0.25], [x0, yt, zb]]);
	const roof = slab(vw, { frame: { o: [0, S.height + 0.12, zb / 2 + 0.1], u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0] }, width: S.length + 0.3, height: S.depth + 0.5, radius: 0.04, depth: 0.12, color: STEEL, light: key, bevel: Math.max(0.6, px), profile: [[0, 1, 0]] });
	const under = lit(STEEL, roof.frontFaces ? [0, 1, 0] : [0, -1, 0], { light: key, point: [0, S.height, 0], eye: cam.eye });
	const posts = [[x0, zb], [x1, zb], [x0, -0.25]].map(([x, z]) => pole(sc, vw, { from: [x, 0.12, z], to: [x, S.height, z], radius: 0.045, color: STEEL, light: key }));
	const seat = slab(vw, { frame: { o: [-0.1, 0.46, zb + 0.22], u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0] }, width: 2.2, height: 0.34, radius: 0.04, depth: 0.04, color: '#8c939b', light: key, bevel: 0, profile: [[0, 1, 0]] });
	const legs = [-1, 0.8].map((x) => pole(sc, vw, { from: [x, 0.12, zb + 0.22], to: [x, 0.44, zb + 0.22], radius: 0.03, color: STEEL, light: key }));
	// where the shelter stands: soft shadows on the paving
	const foot = patch(vw, x0 - 0.1, x1 + B.depth + 0.1, zb - 0.1, 0.25, 0.13);

	sc.add(
		sky(sc, { time: night ? 'night' : 'day', horizon: hz, sun: light, seed }),
		skyline(sc, vw, { z: -38, x: [-80, 80], night, haze: look.stops[3], seed }),
		street(sc, vw, { x: [-60, 60], back: -30, kerb: 1.4, light }),
		foot.length > 2 && el('path', { d: polyPath(foot), fill: '#000', opacity: night ? 0.15 : 0.12, filter: sc.blur(18 * px) }),
		back,
		end,
		...legs,
		seat.sides,
		el('path', { d: seat.path, fill: lit('#8c939b', [0, 1, 0], { light: key, point: [0, 0.46, zb], eye: cam.eye }) }),
		...posts,
		box.sides,
		el('path', { d: box.path, fill: '#3b4047' }),
		!night && poster(false),
		roof.sides,
		el('path', { d: roof.path, fill: under }),
	);
	if (night) {
		// the street goes dark; the poster lights itself, the paving and the glass near it; a strip light under the roof
		const shape = el('path', { d: polyPath(posterQuad), fill: '#fff6e6' });
		const spill = patch(vw, x1 - 0.6, x1 + 2.6, zb - 0.6, 0.9, 0.13);
		const strip = [[x0 + 0.3, S.height - 0.01, zb / 2], [x1 - 0.3, S.height - 0.01, zb / 2]].map((p) => vw.at(/** @type {import('../util/vec.js').Vec3} */ (p)));
		sc.add(
			nightVeil(sc, 0.72),
			spill.length > 2 && el('path', { d: polyPath(spill), fill: '#fff1d8', opacity: 0.16, filter: sc.blur(40 * px) }),
			glow(sc, shape, 60 * px, 0.9),
			poster(true),
			el('line', { x1: strip[0][0], y1: strip[0][1], x2: strip[1][0], y2: strip[1][1], stroke: '#eaf2ff', 'stroke-width': 4 * px, 'stroke-linecap': 'round', filter: sc.blur(3 * px) }),
			el('line', { x1: strip[0][0], y1: strip[0][1], x2: strip[1][0], y2: strip[1][1], stroke: '#ffffff', 'stroke-width': 1.5 * px, 'stroke-linecap': 'round' }),
		);
	}
	sc.add(glass(sc, { outline: posterQuad, light, strength: night ? 0.6 : 1 }), grainLayer(sc, clamp(num('shelter', options.grain, 0.5, 'grain'), 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'shelter' };
}
