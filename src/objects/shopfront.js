/**
 * @module @logomarks/mockups/objects/shopfront
 *
 * A shopfront: the brand's mark and name on a painted fascia above a shop
 * window and a glazed door, in a brick building, with a projecting blade
 * sign carrying the mark and gooseneck lamps over the fascia. A simple
 * architectural rendering lit like a photograph (daylight across the
 * brick, the cornice's shadow on the fascia, raised letters, the sky in
 * the glass), seen from across the pavement straight on or at an angle.
 * The front is drawn flat and warped onto the building with a true
 * perspective map. Dimensions are in metres.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { ink as inked } from '../render/ink.js';
import { fitArt } from '../render/fit.js';
import { grainLayer } from '../materials/grain.js';
import { keyLight } from '../materials/light.js';
import { sky } from '../materials/sky.js';
import { slab } from '../parts/slab.js';
import { pole } from '../parts/pole.js';
import { artFace } from '../parts/face.js';
import { brickWall } from '../parts/brick.js';
import { facade, upperFloor, SHOP } from '../parts/facade.js';
import { street } from '../parts/pavement.js';
import { camera, frame, horizon, onPlane, seen } from '../util/camera.js';
import { polyPath } from '../util/shape.js';
import { resolveSize } from '../util/size.js';
import { isHex } from '../util/color.js';
import { clamp } from '../util/num.js';
import { num, viewOf } from '../util/options.js';

/** The blade sign: its side, how far out from the wall it starts, its centre's height, and its bracket's height. */
export const BLADE = Object.freeze({ size: 0.72, out: 0.2, height: 4.35, bracket: 4.82 });

/** The named views: nearly straight on (a little from the left, so the blade sign shows), and from the left at an angle. */
export const SHOPFRONT_VIEWS = Object.freeze({ front: Object.freeze({ tilt: 0, turn: -12 }), angle: Object.freeze({ tilt: 0, turn: -40 }) });

/**
 * A shopfront mockup.
 *
 * @param {import('./shopfront.js').ShopfrontOptions} options The mark, the name and how to show them.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function shopfront(options) {
	if (!options || typeof options !== 'object') throw new TypeError('shopfront: pass { art, name, … }');
	const { art, name, seed = 'shopfront' } = options;
	if (art === undefined || art === null) throw new TypeError('shopfront: art (the mark) is required');
	if (typeof name !== 'string' || !name) throw new TypeError('shopfront: name is required (the fascia\'s lettering)');
	const color = hexOption(options.color, '#22392f', 'color');
	const ink = hexOption(options.ink, '#f4efe4', 'ink');
	const joinery = hexOption(options.joinery, '#2a2e33', 'joinery');
	const brick = hexOption(options.brick, '#9b5b45', 'brick');
	const view = viewOf('shopfront', options.view, SHOPFRONT_VIEWS, 'front');
	const blade = options.blade ?? true;
	const light = clamp(num('shopfront', options.light, -0.45, 'light'), -1, 1);
	const fit = clamp(num('shopfront', options.fit, 0.84, 'fit'), 0.2, 1);
	const { width, height } = resolveSize(options.size);
	const mark = inked(art, ink);
	const decal = inked(art, '#ffffff');

	const target = /** @type {import('../util/vec.js').Vec3} */ ([0.4, 2.6, 0]);
	const distance = 12;
	const pitch = (Math.asin(clamp((1.6 - target[1]) / distance, -1, 1)) * 180) / Math.PI + view.tilt;
	const cam = camera({ target, pitch, turn: view.turn, distance, fov: 32 });
	const half = SHOP.width / 2;
	const vw = frame(cam, { width, height, points: [[-half - 0.4, 0, 0], [half + 1.2, 0, 1], [-half - 0.4, 6.4, 0], [half + 1.2, 6.4, 0]], fit, shift: [0, 0.03] });
	const key = keyLight(light, 1.5);
	const sc = scene({ width, height, key: JSON.stringify({ o: 'shopfront', view, seed }) });
	const hz = horizon(vw);

	// the building: brick as far as the view sees, the shopfront on it
	let tall = 30;
	while (tall > 6 && vw.at([0, tall - 1, 0])[1] < -height * 0.1) tall -= 1;
	const [a0, a1] = seen(vw, 0, 0, [-30, 30]);
	const [b0, b1] = seen(vw, tall, 0, [-30, 30]);
	const [xa, xb] = [Math.min(a0, b0), Math.max(a1, b1)];
	const span = xb - xa;
	const k = 1000 / Math.max(span, tall);
	const wallMap = onPlane(vw, [xa, tall, 0], [1, 0, 0], [0, -1, 0]);
	const fk = 1000 / SHOP.width;
	const upMap = onPlane(vw, [-half, tall, 0], [1, 0, 0], [0, -1, 0]);
	const upH = Math.min(tall - SHOP.height - 0.3, 3.4);
	// the shopfront stands a little proud of the wall: a shallow box, its shadow on the brick
	const D = 0.14;
	const front = slab(vw, { frame: { o: [0, SHOP.height / 2, D], u: [1, 0, 0], v: [0, -1, 0], n: [0, 0, 1] }, width: SHOP.width, height: SHOP.height, radius: 0.01, depth: D, color: joinery, light: key, bevel: Math.max(0.6, width / 1600), profile: [[0, 1, 0]] });
	const drop = [[-half, 0], [half, 0], [half, SHOP.height], [-half, SHOP.height]].map(([x, y]) => vw.at([x - light * 0.12, y - 0.1, 0]));
	sc.add(
		sky(sc, { horizon: hz, sun: light, seed }),
		artFace(sc, { map: (x, y) => wallMap(x / k, y / k), width: span * k, height: tall * k, tolerance: 1.5, max: 12, draw: (w, h) => brickWall(sc, { width: w, height: h, scale: k, color: brick, light, seed, coping: vw.at([0, tall, 0])[1] > 0 }) }),
		upH > 2 && artFace(sc, { map: (x, y) => upMap(x / fk, (tall - SHOP.height - 0.3 - upH) + y / fk), width: SHOP.width * fk, height: upH * fk, draw: () => upperFloor(sc, { scale: fk, width: SHOP.width, height: upH, light }) }),
		el('path', { d: polyPath(drop), fill: '#000', opacity: 0.3, filter: sc.blur(width * 0.006) }),
		street(sc, vw, { x: [xa - 10, xb + 10], back: 0, kerb: 3.2, light }),
		front.sides,
		artFace(sc, { map: (x, y) => front.map(x / fk, y / fk), width: SHOP.width * fk, height: SHOP.height * fk, draw: () => facade(sc, { scale: fk, name, mark, decal, color, ink, joinery, light }) }),
		front.edge,
	);

	// gooseneck lamps over the fascia
	const lampsAt = [-0.62, 0, 0.62].map((t) => t * (SHOP.width / 2 - 0.6));
	for (const x of lampsAt) {
		const y = SHOP.fascia[1] + SHOP.cornice + 0.05;
		sc.add(
			pole(sc, vw, { from: [x, y, 0.02], to: [x, y + 0.28, 0.1], radius: 0.018, color: joinery, light: key }),
			pole(sc, vw, { from: [x, y + 0.28, 0.1], to: [x, y + 0.22, 0.48], radius: 0.018, color: joinery, light: key }),
		);
		const shade = slab(vw, { frame: { o: [x, y + 0.2, 0.52], u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0] }, width: 0.24, height: 0.2, radius: 0.09, depth: 0.1, color: joinery, light: key, bevel: 0 });
		sc.add(shade.sides, el('path', { d: shade.path, fill: joinery }));
	}

	// the blade sign: a bracket off the wall, the sign hanging square to it, its shadow on the brick
	if (blade) {
		const bx = half + 0.32;
		const B = BLADE;
		const zc = B.out + B.size / 2;
		const fromLeft = cam.eye[0] < bx;
		const sign = slab(vw, { frame: { o: [bx + (fromLeft ? -0.025 : 0.025), B.height, zc], u: [0, 0, fromLeft ? 1 : -1], v: [0, -1, 0], n: [fromLeft ? -1 : 1, 0, 0] }, width: B.size, height: B.size, radius: 0.04, depth: 0.05, color, light: key, bevel: Math.max(0.6, width / 1600), profile: [[0, 1, 0]] });
		const shadow = [[0, -0.3], [0, 0.3]].map(([dz, dy]) => vw.at([bx - light * 0.3, B.height + dy, 0]));
		sc.add(
			el('path', { d: polyPath([...shadow, vw.at([bx - light * 0.3 - 0.05, B.height + 0.3, 0]), vw.at([bx - light * 0.3 - 0.05, B.height - 0.3, 0])]), fill: '#000', opacity: 0.2, filter: sc.blur(width * 0.008) }),
			pole(sc, vw, { from: [bx, B.bracket, -0.02], to: [bx, B.bracket, B.out + B.size + 0.08], radius: 0.022, color: joinery, light: key }),
			pole(sc, vw, { from: [bx, B.bracket - 0.12, 0], to: [bx, B.bracket, 0.35], radius: 0.016, color: joinery, light: key }),
			...[B.out + 0.08, B.out + B.size - 0.08].map((z) => pole(sc, vw, { from: [bx, B.bracket, z], to: [bx, B.height + B.size / 2, z], radius: 0.008, color: '#1c1e21', light: key })),
			sign.sides,
			artFace(sc, {
				map: sign.map,
				width: B.size,
				height: B.size,
				draw: (w, h) => el('rect', { width: w, height: h, fill: color }) + el('rect', { x: w * 0.04, y: h * 0.04, width: w * 0.92, height: h * 0.92, fill: 'none', stroke: ink, 'stroke-width': w * 0.012, opacity: 0.8 }) + fitArt(sc, mark, { x: w * 0.2, y: h * 0.2, width: w * 0.6, height: h * 0.6 }, 'contain'),
			}),
			sign.edge,
		);
	}
	sc.add(grainLayer(sc, clamp(num('shopfront', options.grain, 0.5, 'grain'), 0, 1), seed));
	return { svg: sc.svg(), width, height, object: 'shopfront' };
}

/**
 * A hex colour option, or its default.
 *
 * @param {unknown} v The option.
 * @param {string} fallback Its default.
 * @param {string} name Its name, for the error.
 * @returns {string} The colour.
 * @throws {TypeError} When it's given and isn't a hex colour.
 */
function hexOption(v, fallback, name) {
	if (v === undefined) return fallback;
	if (!isHex(v)) throw new TypeError(`shopfront: ${name} is a hex colour (got ${JSON.stringify(v)})`);
	return v;
}
