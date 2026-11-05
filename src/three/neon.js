/**
 * @module @logomarks/mockups/three/neon
 *
 * A neon sign on a wall in a dim room: the mark bent in glass tube along
 * its outline (each closed shape one tube, its corners rounded as glass
 * bends), held off the wall on small standoffs. The tubes burn with a hot
 * pale core and their colour at the edges; their light falls on the wall
 * round them, raking across the bricks so their faces and mortar show,
 * and blooms softly in the air. The rest of the room is nearly dark.
 */

import { reader } from '../util/reader.js';
import { mix, rgb } from '../util/color.js';
import { svgOutlines, resample, runLength } from '../util/pathpoints.js';
import { scene as svgScene } from '../render/scene.js';
import { canvas2d } from '../render/image.js';
import { resolveWall, wallLayer } from '../materials/wall.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg } from './printart.js';

/** The neon colours by name (the gases and coated tubes signs are made in). */
export const NEON_COLORS = Object.freeze({ pink: '#ff2f7d', red: '#ff3b2a', orange: '#ff8a1f', yellow: '#ffd23a', green: '#3dff8a', blue: '#2f8bff', white: '#fff1dd' });

/** The sign, in mm: the mark's width, the tube's diameter, how far it stands off the wall, and how far apart its standoffs are. */
export const NEON = Object.freeze({ size: 700, tube: 13, standoff: 45, spacing: 220 });

/**
 * The tubes a mark is bent into: each outline long enough to bend, resampled and smoothed (glass bends round, never to a point), in mm round the sign's centre (y up).
 *
 * @param {string} svg The mark's SVG markup.
 * @param {{ size?: number, tube?: number }} [o] The sign's width and the tube's diameter (mm).
 * @returns {{ points: [number, number][], closed: boolean }[]} The tubes' centrelines.
 * @throws {TypeError} When the mark has no outlines.
 */
export function neonTubes(svg, { size = NEON.size, tube = NEON.tube } = {}) {
	const { box, outlines } = svgOutlines(svg);
	const k = size / Math.max(box[2], box[3]);
	const [cx, cy] = [box[0] + box[2] / 2, box[1] + box[3] / 2];
	const step = tube * 0.6;
	return outlines
		.map((o) => ({ closed: o.closed, points: o.points.map(([x, y]) => /** @type {[number, number]} */ ([(x - cx) * k, (cy - y) * k])) }))
		.filter((o) => runLength(o.points, o.closed) > tube * 4.5)
		.map((o) => ({ closed: o.closed, points: smooth(resample(o.points, step, o.closed), o.closed, Math.max(1, Math.round(tube / step))) }));
}

/**
 * Points eased round their corners: each moved towards its neighbours' mean, a few times over.
 *
 * @param {[number, number][]} pts The points.
 * @param {boolean} closed Whether they loop.
 * @param {number} passes How many times.
 * @returns {[number, number][]} The smoothed points.
 */
function smooth(pts, closed, passes) {
	let p = pts;
	for (let s = 0; s < passes; s++) {
		p = p.map((q, i) => {
			if (!closed && (i === 0 || i === p.length - 1)) return q;
			const a = p[(i - 1 + p.length) % p.length];
			const b = p[(i + 1) % p.length];
			return /** @type {[number, number]} */ ([(a[0] + 2 * q[0] + b[0]) / 4, (a[1] + 2 * q[1] + b[1]) / 4]);
		});
	}
	return p;
}

/**
 * Points spread evenly along the tubes, by length (where the lights and standoffs go).
 *
 * @param {{ points: [number, number][], closed: boolean }[]} tubes The tubes.
 * @param {number} spacing How far apart (mm).
 * @returns {[number, number][]} The points.
 */
export function alongTubes(tubes, spacing) {
	return tubes.flatMap((t) => {
		const len = runLength(t.points, t.closed);
		const n = Math.max(1, Math.round(len / spacing));
		return resample(t.points, len / n, t.closed).slice(0, n);
	});
}

/**
 * A neon sign on a wall, on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./neon.js').NeonSceneOptions} options The mark (SVG, inline), the neon's colour and the wall.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option, or a mark with no outlines.
 */
export async function neonScene(canvas, options) {
	const o = reader('neonScene', options);
	const svg = svgMarkup(/** @type {import('../types.js').Art} */ (o.raw('art')));
	if (!svg) throw new TypeError('neonScene: art is the mark as SVG (markup, a data: URI or bytes): the tubes follow its outlines');
	const named = o.raw('color');
	const color = typeof named === 'string' && Object.hasOwn(NEON_COLORS, named) ? NEON_COLORS[/** @type {keyof typeof NEON_COLORS} */ (named)] : o.color('color', NEON_COLORS.pink);
	const wall = resolveWall(/** @type {any} */ (o.raw('wall') ?? 'brick'), 'neonScene');
	const size = o.num('size', NEON.size, 200, 3000);
	const power = o.num('glow', 1, 0, 3);
	const seed = o.text('seed', 'neon');
	const tubes = neonTubes(svg, { size, tube: NEON.tube });
	// the wall drawn at its true size, round the sign
	const span = [size * 3.4, size * 2.4];
	const px = Math.min(2048 / span[0], 0.9);
	const ws = svgScene({ width: Math.round(span[0] * px), height: Math.round(span[1] * px), key: `neonwall:${seed}` });
	ws.add(wallLayer(ws, wall, { width: ws.width, height: ws.height, mm: px, light: -0.2, seed }));
	const wallCanvas = await drawSvg(ws.svg(), ws.width, ws.height);
	const glowCanvas = glowPicture(tubes, { size, color });
	const shot = {
		...shotOf(o, { ground: '#000000', light: 0, layout: 'upright', fit: 0.78, view: { tilt: 3, turn: -16, fov: 30 } }),
		lighting: /** @type {const} */ ('none'),
		toneMapping: /** @type {const} */ ('aces'),
		lens: lensOf(o, { aperture: 0.01, blur: 0.4, samples: 32 }),
	};

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const u = 1 / 100;
		const lift = (span[1] / 2) * u;
		scene.background = new THREE.Color('#050404');
		// the wall: its drawing, and its relief from the same drawing (mortar sunk, brick faces proud)
		const map = keep(new THREE.CanvasTexture(wallCanvas));
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = 8;
		const bump = keep(new THREE.CanvasTexture(wallCanvas));
		const brick = new THREE.Mesh(new THREE.PlaneGeometry(span[0] * u, span[1] * u), new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: wall.kind === 'brick' ? 2.2 : 0.6, roughness: 0.88 }));
		brick.position.y = lift;
		brick.receiveShadow = true;
		scene.add(brick);

		// the tubes: glass burning from within, a pale core and the colour at its edges
		const [r, g, b] = rgb(color).map((v) => (v / 255) ** 2.2);
		const glass = new THREE.ShaderMaterial({
			uniforms: { uColor: { value: new THREE.Vector3(r, g, b) }, uPower: { value: 0.6 + power } },
			vertexShader: 'varying vec3 vN; varying vec3 vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
			fragmentShader:
				'uniform vec3 uColor; uniform float uPower; varying vec3 vN; varying vec3 vV; void main() { float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0); vec3 c = uColor * (0.6 + 2.4 * pow(f, 1.6)) + vec3(1.0, 0.95, 0.9) * pow(f, 12.0) * 0.8; gl_FragColor = vec4(c * uPower, 1.0); }',
		});
		const steel = new THREE.MeshStandardMaterial({ color: '#8c8c90', metalness: 0.9, roughness: 0.35 });
		const z = NEON.standoff * u;
		for (const t of tubes) {
			const curve = new THREE.CatmullRomCurve3(t.points.map(([x, y]) => new THREE.Vector3(x * u, y * u + lift, z)), t.closed, 'centripetal');
			scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, t.points.length * 2), (NEON.tube / 2) * u, 12, t.closed), glass));
		}
		// standoffs: short posts from the wall to the tubes, with a clip
		const post = new THREE.CylinderGeometry(2.4 * u, 3.2 * u, NEON.standoff * u, 10);
		post.rotateX(Math.PI / 2);
		for (const [x, y] of alongTubes(tubes, NEON.spacing)) {
			const m = new THREE.Mesh(post, steel);
			m.position.set(x * u, y * u + lift, z / 2);
			m.castShadow = true;
			scene.add(m);
		}
		// the light on the wall: coloured lights along the tubes, a little off it
		const points = alongTubes(tubes, size * 0.28);
		const each = (5.5 * power) / Math.sqrt(points.length);
		for (const [x, y] of points) {
			const l = new THREE.PointLight(color, each, size * 2.2 * u, 2);
			l.position.set(x * u, y * u + lift, z * 1.4);
			scene.add(l);
		}
		// the bloom: the tubes' light in the air, and a wide wash on the wall
		const halo = keep(new THREE.CanvasTexture(glowCanvas));
		halo.colorSpace = THREE.SRGBColorSpace;
		const glow = new THREE.Mesh(new THREE.PlaneGeometry(size * 2 * u, size * 2 * u), new THREE.MeshBasicMaterial({ map: halo, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 * Math.min(1.5, power) }));
		glow.position.set(0, lift, z + 2 * u);
		// a faint cold light from a window to the left, so the dark wall still has its shape
		const moon = new THREE.DirectionalLight('#8aa0c8', 0.2);
		moon.position.set(-4, 1.5, 2);
		scene.add(glow, moon, new THREE.AmbientLight('#ffffff', 0.015));
		return { width: size * 1.25 * u, height: size * 1.25 * u, center: [0, lift, 0], focus: [0, lift, z] };
	});
}

/**
 * The tubes' bloom as a picture: their lines stroked in the colour, blurred wide and then close, centred, spanning twice the sign.
 *
 * @param {{ points: [number, number][], closed: boolean }[]} tubes The tubes (mm round the centre).
 * @param {{ size: number, color: string }} o The sign's width and the colour.
 * @returns {HTMLCanvasElement} The picture.
 */
function glowPicture(tubes, { size, color }) {
	const W = 1024;
	const k = W / (size * 2);
	const [c, g] = canvas2d(W, W);
	const stroke = (width, blur, alpha) => {
		g.filter = `blur(${blur}px)`;
		g.globalAlpha = alpha;
		g.strokeStyle = mix(color, '#ffffff', 0.15);
		g.lineWidth = width;
		g.lineJoin = g.lineCap = 'round';
		for (const t of tubes) {
			g.beginPath();
			t.points.forEach(([x, y], i) => (i ? g.lineTo : g.moveTo).call(g, W / 2 + x * k, W / 2 - y * k));
			if (t.closed) g.closePath();
			g.stroke();
		}
	};
	stroke(NEON.tube * k * 6, 34, 0.5);
	stroke(NEON.tube * k * 2.2, 9, 0.6);
	g.filter = 'none';
	g.globalAlpha = 1;
	return c;
}

/**
 * Art as SVG markup, when it is SVG.
 *
 * @param {import('../types.js').Art} art The art.
 * @returns {string | null} The markup, or null for a raster.
 */
export function svgMarkup(art) {
	if (typeof art !== 'string') {
		const text = new TextDecoder().decode(art instanceof ArrayBuffer ? new Uint8Array(art) : art);
		return /<svg[\s>]/i.test(text) ? text : null;
	}
	const s = art.trim();
	if (s.startsWith('<')) return /<svg[\s>]/i.test(s) ? s : null;
	if (!s.startsWith('data:image/svg+xml')) return null;
	const comma = s.indexOf(',');
	const body = s.slice(comma + 1);
	return /;base64$/.test(s.slice(0, comma)) ? new TextDecoder().decode(Uint8Array.from(atob(body), (ch) => ch.charCodeAt(0))) : decodeURIComponent(body);
}
