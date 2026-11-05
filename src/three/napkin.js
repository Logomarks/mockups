/**
 * @module @logomarks/mockups/three/napkin
 *
 * A stack of folded paper napkins: 2-ply cocktail napkins, 254 mm square
 * folded in four to 127 mm, piled a little unevenly, the brand printed in
 * one ink on the top one (in its middle, or small in its corner). Each is
 * soft creped tissue: very matte, a velvety sheen at grazing angles, the
 * crepe and the embossed border in its relief. Two edges are folds,
 * rounded; the other two are the open edges, where the plies show.
 */

import { reader } from '../util/reader.js';
import { rng } from '../util/rng.js';
import { isHex, mix } from '../util/color.js';
import { ink as inked } from '../render/ink.js';
import { canvas2d } from '../render/image.js';
import { shoot } from './shot.js';
import { UNIT } from './deskplane.js';
import { tableShot, dressTable, brandPrint } from './tabletop.js';

/** A folded cocktail napkin, in mm: its side, its thickness folded (four plies of two), and its embossed border's inset and width. */
export const NAPKIN = Object.freeze({ side: 127, thick: 1.15, inset: 5, border: 5 });

/** The napkins' colours by name. */
export const NAPKIN_COLORS = Object.freeze({ white: '#f3f1ec', kraft: '#ae8c66', black: '#1d1d1f', blush: '#e9c9c0' });

/** Where the print sits: in the middle, or small in the open corner. */
export const NAPKIN_PRINTS = /** @type {const} */ (['centre', 'corner']);

/**
 * Where each napkin in a stack lies: piled from the desk up, each nudged and turned a little, the same for the same seed.
 *
 * @param {number} count How many.
 * @param {string} seed The seed.
 * @returns {{ x: number, y: number, z: number, turn: number }[]} Each napkin's centre (mm; y its underside) and turn (degrees), bottom first.
 */
export function napkinStack(count, seed) {
	const r = rng(`${seed}:napkins`);
	return Array.from({ length: count }, (_, i) => ({
		x: r.range(-1.4, 1.4),
		y: i * NAPKIN.thick,
		z: r.range(-1.4, 1.4),
		// the top one, picked up and put back, lies a little more turned
		turn: i === count - 1 ? r.range(2.5, 4) * (r.next() < 0.5 ? -1 : 1) : r.range(-1.2, 1.2),
	}));
}

/**
 * The napkin's face: its colour, the crepe's mottle, and the print; and the relief (crepe and the embossed border) as a bump map.
 *
 * @param {object} o The napkin.
 * @param {string} o.color Its colour.
 * @param {HTMLCanvasElement | null} o.print The print (clear where the paper shows), or none.
 * @param {string} o.seed The seed.
 * @param {number} [o.px=6] Pixels per mm.
 * @returns {{ color: HTMLCanvasElement, bump: HTMLCanvasElement }} The canvases (the face's top-left first).
 */
export function napkinFace({ color, print, seed, px = 6 }) {
	const N = Math.round(NAPKIN.side * px);
	const [c, g] = canvas2d(N, N);
	const [b, bg] = canvas2d(N, N);
	const r = rng(`${seed}:crepe`);
	g.fillStyle = color;
	g.fillRect(0, 0, N, N);
	// the crepe: fine ridges across the sheet, a little irregular, and the paper's own mottle
	bg.fillStyle = '#808080';
	bg.fillRect(0, 0, N, N);
	for (let y = 0; y < N; y += r.range(1.2, 2.6)) {
		bg.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '0,0,0'},${r.range(0.08, 0.22)})`;
		bg.fillRect(0, y, N, r.range(0.6, 1.4));
	}
	bg.filter = `blur(${px * 0.15}px)`;
	bg.drawImage(b, 0, 0);
	bg.filter = 'none';
	const img = bg.getImageData(0, 0, N, N);
	for (let i = 0; i < img.data.length; i += 4) {
		const v = (r.next() - 0.5) * 26;
		for (let k = 0; k < 3; k++) img.data[i + k] += v;
	}
	bg.putImageData(img, 0, 0);
	// the embossed border: a band of little raised diamonds round the edge
	const i0 = NAPKIN.inset * px;
	const bw = NAPKIN.border * px;
	const step = 2.4 * px;
	const emboss = canvas2d(N, N);
	const eg = emboss[1];
	eg.fillStyle = '#ffffff';
	for (let t = i0; t < N - i0; t += step) {
		for (const [x, y] of [[t, i0 + bw / 2], [t, N - i0 - bw / 2], [i0 + bw / 2, t], [N - i0 - bw / 2, t]]) {
			eg.beginPath();
			eg.moveTo(x, y - bw * 0.32);
			eg.lineTo(x + step * 0.32, y);
			eg.lineTo(x, y + bw * 0.32);
			eg.lineTo(x - step * 0.32, y);
			eg.fill();
		}
	}
	// pressed in softly
	bg.filter = `blur(${px * 0.3}px)`;
	bg.globalAlpha = 0.55;
	bg.drawImage(emboss[0], 0, 0);
	bg.globalAlpha = 1;
	bg.filter = 'none';
	// the mottle a creped sheet has in its colour (not the emboss: that's only relief)
	const mottle = g.getImageData(0, 0, N, N);
	for (let i = 0; i < mottle.data.length; i += 4) {
		const v = (r.next() - 0.5) * 7;
		for (let k = 0; k < 3; k++) mottle.data[i + k] += v;
	}
	g.putImageData(mottle, 0, 0);
	if (print) {
		// ink soaked into tissue: soft-edged, a touch lighter, the crepe through it
		g.filter = `blur(${px * 0.12}px) saturate(0.9)`;
		g.globalAlpha = 0.94;
		g.drawImage(print, 0, 0, N, N);
		g.filter = 'none';
		g.globalAlpha = 1;
	}
	return { color: c, bump: b };
}

/**
 * Napkins in 3D on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./napkin.js').NapkinSceneOptions} options The mark (inline), and the napkins.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function napkinScene(canvas, options) {
	const o = reader('napkinScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const named = o.raw('color') ?? 'white';
	const color = typeof named === 'string' && Object.hasOwn(NAPKIN_COLORS, named) ? NAPKIN_COLORS[/** @type {keyof typeof NAPKIN_COLORS} */ (named)] : isHex(named) ? /** @type {string} */ (named) : null;
	if (!color) throw new TypeError(`napkinScene: color is 'white', 'kraft', 'black', 'blush' or a hex colour (got ${JSON.stringify(named)})`);
	const ink = o.color('ink', color === NAPKIN_COLORS.black ? '#e8e4dc' : '#1b1b1b');
	const where = o.oneOf('print', 'centre', NAPKIN_PRINTS);
	const name = o.text('name', '');
	const count = Math.round(o.num('count', 16, 1, 60));
	const t = await tableShot(o, { layout: 'flat', fit: 0.82, view: { tilt: 46, turn: -20, fov: 30 }, surface: 'oak', aperture: 0.014, span: 700, seed: 'napkin' });
	const S = NAPKIN.side;
	const box = /** @type {[number, number, number, number]} */ (where === 'centre' ? [S * 0.28, S * 0.28, S * 0.44, S * 0.44] : [S - 36, S - 36, 24, 24]);
	const print = await brandPrint({ mark: inked(art, ink), name, ink, size: [S, S], box, layout: 'stack' });
	const stack = napkinStack(count, t.seed);

	return shoot(canvas, t.shot, async (THREE, scene, keep) => {
		const texture = (c, srgb) => {
			const m = keep(new THREE.CanvasTexture(c));
			if (srgb) m.colorSpace = THREE.SRGBColorSpace;
			m.anisotropy = 8;
			return m;
		};
		const tissue = (face) =>
			keep(
				new THREE.MeshPhysicalMaterial({
					map: texture(face.color, true),
					bumpMap: texture(face.bump, false),
					bumpScale: 2.4,
					roughness: 0.97,
					sheen: 0.6,
					sheenRoughness: 0.9,
					sheenColor: mix(color, '#ffffff', 0.5),
					envMapIntensity: 0.4,
				}),
			);
		const top = tissue(napkinFace({ color, print, seed: t.seed }));
		const plain = tissue(napkinFace({ color, print: null, seed: `${t.seed}:plain` }));
		const edge = keep(new THREE.MeshPhysicalMaterial({ map: texture(pliesCanvas(color), true), roughness: 1, sheen: 0.5, sheenRoughness: 0.9, sheenColor: '#ffffff', envMapIntensity: 0.3 }));
		const u = 1 / UNIT;
		// a few shapes of napkin, used in turn, so neighbours don't lie the same
		const shapes = [0, 1, 2].map((k) => keep(napkinGeometry(THREE, u, `${t.seed}:${k}`)));
		stack.forEach((n, i) => {
			// faces: +x, -x, +y (up), -y, +z, -z
			const m = new THREE.Mesh(shapes[i % shapes.length], [edge, edge, i === stack.length - 1 ? top : plain, plain, edge, edge]);
			m.position.set(n.x * u, (n.y + NAPKIN.thick / 2) * u, n.z * u);
			m.rotation.y = (n.turn * Math.PI) / 180;
			m.castShadow = m.receiveShadow = true;
			scene.add(m);
		});
		await dressTable(THREE, scene, keep, t, { feet: [{ x: 0, z: 0, w: S, d: S, lift: 0.4 }], shade: 1.2, gloss: 1 });
		const h = stack.length * NAPKIN.thick;
		return { width: (S * 1.25) * u, height: (S * 1.25) * u, center: [0, h * u * 0.5, 0], focus: [0, h * u, S * 0.3 * u] };
	});
}

/**
 * A napkin as soft tissue: a slab, full in the middle and thinning to rounded edges, with a seeded gentle wave.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {number} u Scene units per mm.
 * @param {string} seed The seed.
 * @returns {import('three').BoxGeometry} The napkin, centred, its faces grouped as a box's.
 */
export function napkinGeometry(THREE, u, seed) {
	const S = NAPKIN.side;
	const t = NAPKIN.thick;
	const g = new THREE.BoxGeometry(S * u, t * u, S * u, 40, 1, 40);
	const p = g.attributes.position;
	const r = rng(seed);
	const [a, b, c, d] = [r.range(0, 6), r.range(0, 6), r.range(1.5, 3), r.range(1.5, 3)];
	for (let i = 0; i < p.count; i++) {
		const nx = p.getX(i) / ((S / 2) * u);
		const nz = p.getZ(i) / ((S / 2) * u);
		// fuller in the middle; at the edges the plies thin and round over
		const full = (1 - Math.abs(nx) ** 8) * (1 - Math.abs(nz) ** 8);
		const half = (t / 2) * (0.3 + 0.7 * Math.sqrt(Math.max(0, full)));
		const wave = 0.18 * Math.sin(nx * c + a) * Math.sin(nz * d + b);
		p.setY(i, (Math.sign(p.getY(i)) * half + wave) * u);
	}
	g.computeVertexNormals();
	return g;
}

/**
 * A napkin's open edges: the plies' thin lines, lighter where each catches the light.
 *
 * @param {string} color The paper's colour.
 * @returns {HTMLCanvasElement} The tile (v across the napkin's thickness).
 */
function pliesCanvas(color) {
	const [c, g] = canvas2d(64, 64);
	g.fillStyle = mix(color, '#000000', 0.1);
	g.fillRect(0, 0, 64, 64);
	for (let i = 0; i < 4; i++) {
		g.fillStyle = mix(color, '#ffffff', 0.15);
		g.fillRect(0, i * 16 + 3, 64, 9);
	}
	return c;
}
