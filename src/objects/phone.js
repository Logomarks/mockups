/**
 * @module @arraypress/mockups/objects/phone
 *
 * A phone: a generic modern handset (a rounded slab with a metal band, thin
 * even bezels and a small punch-hole camera; no maker's shapes, cameras or
 * marks) lying on a surface, seen from straight above or at an angle. Its
 * screen shows art, a home screen with the brand as an app, or the brand's
 * post in a feed. The screen is a flat drawing warped onto the glass with a
 * true perspective map, then the glass's reflections go over it.
 * Dimensions are in millimetres.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { warp } from '../render/warp.js';
import { fitArt } from '../render/fit.js';
import { resolveGround, groundLayer } from '../materials/ground.js';
import { castShadow } from '../materials/shadow.js';
import { grainLayer } from '../materials/grain.js';
import { glass } from '../materials/glass.js';
import { keyLight } from '../materials/light.js';
import { slab } from '../parts/slab.js';
import { homeScreen } from '../parts/screen/home.js';
import { feedScreen } from '../parts/screen/feed.js';
import { camera, frame } from '../util/camera.js';
import { polyPath } from '../util/shape.js';
import { resolveSize } from '../util/size.js';
import { clamp } from '../util/num.js';
import { resolveBody } from '../materials/body.js';
import { num, oneOf, viewOf } from '../util/options.js';

/** A phone's body, in millimetres: its size, corner radius, thickness, bezel, the screen's corner radius and the camera's hole. */
export const PHONE = Object.freeze({ width: 72, height: 152, radius: 11, depth: 8, bezel: 2.3, screenRadius: 9, hole: 1.6 });

/** The named views: straight down, and a slight angle. */
export const PHONE_VIEWS = Object.freeze({ front: Object.freeze({ tilt: 0, turn: 0 }), angle: Object.freeze({ tilt: 34, turn: -26 }) });

/** The screen's drawing width; its height follows the screen's proportions. */
const W = 1080;

/**
 * A phone mockup.
 *
 * @param {import('./phone.js').PhoneOptions} options The art, what the screen shows and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function phone(options) {
	if (!options || typeof options !== 'object') throw new TypeError('phone: pass { art, … }');
	const { art, name = '', seed = 'phone' } = options;
	if (art === undefined || art === null) throw new TypeError('phone: art is required');
	const show = oneOf('phone', 'screen', options.screen, ['art', 'home', 'feed'], 'art');
	if (show !== 'art' && !name) throw new TypeError(`phone: a ${show} screen needs the brand's name`);
	const fill = oneOf('phone', 'fill', options.fill, ['cover', 'contain', 'top'], 'cover');
	const theme = oneOf('phone', 'theme', options.theme, ['light', 'dark'], 'light');
	const view = viewOf('phone', options.view, PHONE_VIEWS, 'front');
	const light = clamp(num('phone', options.light, 0.35, 'light'), -1, 1);
	const strength = clamp(num('phone', options.shadow, 1, 'shadow'), 0, 3);
	const reflect = clamp(num('phone', options.glass, 1, 'glass'), 0, 2);
	const fit = clamp(num('phone', options.fit, 0.82, 'fit'), 0.2, 1);
	const body = resolveBody(options.finish ?? 'graphite', 'phone');
	const { width, height } = resolveSize(options.size);
	const g = resolveGround(options.ground);
	const P = PHONE;

	// lying on the surface (y up), its top towards the back
	const cam = camera({ target: [0, P.depth / 2, 0], pitch: 90 - view.tilt, turn: view.turn, distance: 620, fov: 26 });
	const box = [-1, 1].flatMap((x) => [-1, 1].flatMap((z) => [0, P.depth].map((y) => /** @type {import('../util/vec.js').Vec3} */ ([(x * P.width) / 2, y, (z * P.height) / 2]))));
	const vw = frame(cam, { width, height, points: box, fit });
	const key = keyLight(light, 1.4);
	const s = slab(vw, { frame: { o: [0, P.depth, 0], u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0] }, width: P.width, height: P.height, radius: P.radius, depth: P.depth, color: body.color, finish: body.finish, light: key, bevel: Math.max(0.8, vw.scale * 0.0009) });

	const sc = scene({ width, height, key: JSON.stringify({ o: 'phone', show, view, seed }) });
	// the screen, drawn flat, then warped onto the glass
	const sw = P.width - 2 * P.bezel;
	const sh = P.height - 2 * P.bezel;
	const H = Math.round((W * sh) / sw);
	const content = sc.id('screen');
	const avatarArt = options.avatar ?? art;
	const drawn =
		show === 'home'
			? homeScreen(sc, { width: W, height: H, icon: art, name, wallpaper: options.wallpaper, background: options.iconBackground, padding: options.iconPadding, seed })
			: show === 'feed'
				? feedScreen(sc, { width: W, height: H, post: art, avatar: avatarArt, name, handle: options.handle, theme, seed })
				: (fill === 'cover' ? '' : el('rect', { width: W, height: H, fill: '#000' })) + fitArt(sc, art, { x: 0, y: 0, width: W, height: H }, fill);
	sc.def(el('g', { id: content }, drawn));
	const k = sw / W;
	const screenMap = (x, y) => s.map(P.bezel + x * k, P.bezel + y * k);
	const screenEdge = s.outline(P.bezel, P.screenRadius);
	const clip = sc.id('screenclip');
	sc.def(el('clipPath', { id: clip }, el('path', { d: polyPath(screenEdge) })));
	// the camera's hole: a small circle near the top, projected
	const hy = P.bezel + 5.2;
	const hole = Array.from({ length: 20 }, (_, i) => s.map(P.width / 2 + Math.cos((i / 20) * 2 * Math.PI) * P.hole, hy + Math.sin((i / 20) * 2 * Math.PI) * P.hole));

	const [t0, t1] = [vw.at([0, 0, -P.height / 2]), vw.at([0, 0, P.height / 2])];
	const shine = { x: light, strength: strength * g.shadow, unit: Math.hypot(t1[0] - t0[0], t1[1] - t0[1]) * 0.75 };
	sc.add(
		groundLayer(sc, g),
		castShadow(sc, { ...shine, strength: shine.strength * 2.4 }, { shape: (f) => el('path', { d: polyPath(s.back), fill: f }), foot: null }),
		// where it touches the surface: a dark hairline under the edge
		strength > 0 && el('path', { d: polyPath(s.back), fill: 'none', stroke: '#000', 'stroke-width': shine.unit * 0.006, opacity: Math.min(0.6, 0.35 * strength * g.shadow), filter: sc.blur(shine.unit * 0.003) }),
		el('g', {}, s.sides),
		el('path', { d: polyPath(s.front), fill: '#0b0c0e' }),
		el('g', { 'clip-path': `url(#${clip})` }, warp(sc, { content, width: W, height: H, map: screenMap })),
		el('path', { d: polyPath(screenEdge), fill: 'none', stroke: '#000', 'stroke-opacity': 0.5, 'stroke-width': Math.max(0.6, vw.scale * 0.0004) }),
		el('path', { d: polyPath(hole), fill: '#050506', stroke: '#2a2d33', 'stroke-width': Math.max(0.5, vw.scale * 0.0003) }),
		glass(sc, { outline: s.front, light, strength: reflect }),
		s.edge,
		grainLayer(sc, clamp(num('phone', options.grain, 0.5, 'grain'), 0, 1), seed),
	);
	return { svg: sc.svg(), width, height, object: 'phone' };
}
