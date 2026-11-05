/**
 * @module @logomarks/mockups/objects/laptop
 *
 * A laptop: a generic clamshell (a thin aluminium base with a plain
 * keyboard and a trackpad, a lid with even black bezels and a small camera
 * dot; no maker's shapes or marks) open on a desk, seen at three-quarters
 * or from the front. Its screen is a browser window with the brand's
 * domain in the address field and the art as the page, warped onto the
 * screen with a true perspective map. Dimensions are in millimetres.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { warp } from '../render/warp.js';
import { resolveGround, groundLayer } from '../materials/ground.js';
import { castShadow } from '../materials/shadow.js';
import { grainLayer } from '../materials/grain.js';
import { glass } from '../materials/glass.js';
import { keyLight, lit } from '../materials/light.js';
import { resolveBody } from '../materials/body.js';
import { slab } from '../parts/slab.js';
import { deck } from '../parts/keyboard.js';
import { browserWindow } from '../parts/screen/browser.js';
import { camera, frame, onPlane } from '../util/camera.js';
import { polyPath } from '../util/shape.js';
import { resolveSize } from '../util/size.js';
import { mix } from '../util/color.js';
import { clamp } from '../util/num.js';
import { num, oneOf, viewOf } from '../util/options.js';

/** A laptop's body, in millimetres: the base, the lid, the screen's bezels, and how far past upright the lid leans (degrees). */
export const LAPTOP = Object.freeze({ width: 304, depth: 212, base: 13, lid: 206, shell: 5, side: 9, top: 11, radius: 9, lean: 17 });

/** The named views: three-quarters from the left, and straight on. */
export const LAPTOP_VIEWS = Object.freeze({ angle: Object.freeze({ tilt: 20, turn: -34 }), front: Object.freeze({ tilt: 14, turn: 0 }) });

/** The screen's drawing width; its height follows the screen's proportions. */
const W = 1600;

/**
 * A laptop mockup.
 *
 * @param {import('./laptop.js').LaptopOptions} options The page, the domain and how to show them.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function laptop(options) {
	if (!options || typeof options !== 'object') throw new TypeError('laptop: pass { art, domain, … }');
	const { art, domain, seed = 'laptop' } = options;
	if (art === undefined || art === null) throw new TypeError('laptop: art is required');
	if (typeof domain !== 'string' || !domain) throw new TypeError('laptop: domain is required (the address the browser shows)');
	const fill = oneOf('laptop', 'fill', options.fill, ['cover', 'contain', 'top'], 'top');
	const theme = oneOf('laptop', 'theme', options.theme, ['light', 'dark'], 'light');
	const view = viewOf('laptop', options.view, LAPTOP_VIEWS, 'angle');
	const light = clamp(num('laptop', options.light, 0.35, 'light'), -1, 1);
	const strength = clamp(num('laptop', options.shadow, 1, 'shadow'), 0, 3);
	const reflect = clamp(num('laptop', options.glass, 1, 'glass'), 0, 2);
	const fit = clamp(num('laptop', options.fit, 0.84, 'fit'), 0.2, 1);
	const body = resolveBody(options.finish ?? 'silver', 'laptop');
	const { width, height } = resolveSize(options.size);
	const g = resolveGround(options.ground);
	const L = LAPTOP;

	// the lid leans back from the hinge at the base's back edge
	const lean = (L.lean * Math.PI) / 180;
	const up = /** @type {import('../util/vec.js').Vec3} */ ([0, Math.cos(lean), -Math.sin(lean)]);
	const out = /** @type {import('../util/vec.js').Vec3} */ ([0, Math.sin(lean), Math.cos(lean)]);
	const hinge = /** @type {import('../util/vec.js').Vec3} */ ([0, L.base - 2, -L.depth / 2 + 4]);
	const lidO = /** @type {import('../util/vec.js').Vec3} */ (hinge.map((c, i) => c + up[i] * (L.lid / 2 + 3) + out[i] * L.shell));
	const top = hinge.map((c, i) => c + up[i] * (L.lid + 3));
	const box = [-1, 1].flatMap((x) => [
		/** @type {import('../util/vec.js').Vec3} */ ([(x * L.width) / 2, 0, L.depth / 2]),
		/** @type {import('../util/vec.js').Vec3} */ ([(x * L.width) / 2, 0, -L.depth / 2]),
		/** @type {import('../util/vec.js').Vec3} */ ([(x * L.width) / 2, top[1], top[2]]),
	]);
	const cam = camera({ target: [0, 90, -30], pitch: view.tilt, turn: view.turn, distance: 1300, fov: 26 });
	const vw = frame(cam, { width, height, points: box, fit });
	const key = keyLight(light, 1.3);
	const bevel = Math.max(0.8, vw.scale * 0.0007);
	const base = slab(vw, { frame: { o: [0, L.base, 0], u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0] }, width: L.width, height: L.depth, radius: L.radius, depth: L.base, color: body.color, finish: body.finish, light: key, bevel });
	const lid = slab(vw, { frame: { o: lidO, u: [1, 0, 0], v: /** @type {import('../util/vec.js').Vec3} */ (up.map((c) => -c)), n: out }, width: L.width, height: L.lid, radius: L.radius, depth: L.shell, color: body.color, finish: body.finish, light: key, bevel });

	const sc = scene({ width, height, key: JSON.stringify({ o: 'laptop', view, seed }) });
	// the browser, drawn flat, then warped onto the screen
	const sw = L.width - 2 * L.side;
	const sh = sw / 1.6;
	const H = Math.round(W / 1.6);
	const content = sc.id('screen');
	sc.def(el('g', { id: content }, browserWindow(sc, { width: W, height: H, page: art, domain, title: options.title, icon: options.icon, fill, theme })));
	const k = sw / W;
	const screenMap = (x, y) => lid.map(L.side + x * k, L.top + y * k);
	const screenEdge = [[0, 0], [W, 0], [W, H], [0, H]].map(([x, y]) => screenMap(x, y));
	const cam2 = Array.from({ length: 16 }, (_, i) => lid.map(L.width / 2 + Math.cos((i / 16) * 2 * Math.PI) * 1.4, L.top / 2 + Math.sin((i / 16) * 2 * Math.PI) * 1.4));

	// the top face: lit metal with a soft falloff, then the deck
	const face = lit(body.color, [0, 1, 0], { light: key, point: [0, L.base, 0], eye: cam.eye }, body.finish);
	const grad = sc.id('deck');
	sc.def(el('linearGradient', { id: grad, x1: 0.5 + light * 0.5, y1: 0, x2: 0.5 - light * 0.5, y2: 1 }, el('stop', { offset: 0, 'stop-color': mix(face, '#ffffff', 0.1) }), el('stop', { offset: 1, 'stop-color': mix(face, '#000000', 0.08) })));
	const top2 = onPlane(vw, [-L.width / 2, L.base, -L.depth / 2], [1, 0, 0], [0, 0, 1]);
	const keys = deck(top2, { width: L.width, depth: L.depth, key: '#232428', pad: mix(face, '#000000', 0.04), edge: mix(face, '#000000', 0.35) });

	const [f0, f1] = [vw.at([-L.width / 2, 0, L.depth / 2]), vw.at([L.width / 2, 0, L.depth / 2])];
	const unit = Math.hypot(f1[0] - f0[0], f1[1] - f0[1]) * 0.75;
	const shine = { x: light, strength: strength * g.shadow, unit };
	// the lid's shadow on the desk behind the base: its footprint, thrown back and blurred
	const lidFoot = [[-L.width / 2, 0, -L.depth / 2], [L.width / 2, 0, -L.depth / 2], [L.width / 2, 0, -L.depth / 2 - L.lid * 0.35], [-L.width / 2, 0, -L.depth / 2 - L.lid * 0.35]].map((p) => vw.at(/** @type {import('../util/vec.js').Vec3} */ (p)));
	sc.add(
		groundLayer(sc, g),
		strength > 0 && el('path', { d: polyPath(lidFoot), fill: '#000', opacity: 0.08 * strength * g.shadow, filter: sc.blur(unit * 0.05) }),
		castShadow(sc, { ...shine, strength: shine.strength * 2.2 }, { shape: (f) => el('path', { d: polyPath(base.back), fill: f }), foot: null }),
		strength > 0 && el('path', { d: polyPath(base.back), fill: 'none', stroke: '#000', 'stroke-width': unit * 0.005, opacity: Math.min(0.6, 0.3 * strength * g.shadow), filter: sc.blur(unit * 0.003) }),
		base.sides,
		el('path', { d: base.path, fill: `url(#${grad})` }),
		keys,
		base.edge,
		lid.sides,
		el('path', { d: lid.path, fill: '#0c0d0f' }),
		warp(sc, { content, width: W, height: H, map: screenMap }),
		el('path', { d: polyPath(screenEdge), fill: 'none', stroke: '#000', 'stroke-opacity': 0.6, 'stroke-width': Math.max(0.6, unit * 0.0012) }),
		el('path', { d: polyPath(cam2), fill: '#1d2026' }),
		glass(sc, { outline: lid.front, light, strength: reflect * 0.8, band: 0.3 }),
		lid.edge,
		grainLayer(sc, clamp(num('laptop', options.grain, 0.5, 'grain'), 0, 1), seed),
	);
	return { svg: sc.svg(), width, height, object: 'laptop' };
}
