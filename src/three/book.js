/**
 * @module @logomarks/mockups/three/book
 *
 * A clothbound book beside its acrylic slipcase, lying on a coloured
 * ground, seen from above at an angle. The book's boards are covered in
 * woven cloth (the weave in the bump, a fabric's sheen), the mark
 * blind-debossed into the front board tone on tone (pressed down, a
 * little darker and smoother where the die bit), and the page block shows
 * between the boards. The slipcase is tinted cast acrylic, light passing
 * through it, open along one side with a thumb notch cut into both faces,
 * the brand's name printed on it in white.
 */

import { reader } from '../util/reader.js';
import { brandOf } from '../util/brand.js';
import { mix } from '../util/color.js';
import { rng } from '../util/rng.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg } from './printart.js';
import { canvas2d } from '../render/image.js';
import { artHref } from '../render/art.js';
import { ink } from '../render/ink.js';
import { scene as svgScene } from '../render/scene.js';
import { lockupIn } from '../parts/lockup.js';
import { UNIT, contactMesh } from './deskplane.js';

/** The book and its slipcase, in mm: the book's width, height and thickness, its boards' thickness and overhang, the case's wall, and the notch's radius. */
export const BOOK = Object.freeze({ width: 170, height: 240, thickness: 26, board: 2.6, overhang: 3, wall: 3, notch: 22 });

/** Where the book and the case lie (centres, mm; z towards the camera) and their turn (degrees). */
export const BOOK_LAYOUT = Object.freeze({ book: Object.freeze({ x: -100, z: 34, turn: 0 }), slipcase: Object.freeze({ x: 104, z: -34, turn: 0 }) });

/**
 * The front board's maps, drawn at its size: the cloth's colour (the deboss a shade darker), its height (the weave, the mark pressed down), and its roughness (smoother in the deboss).
 *
 * @param {HTMLImageElement} mark The mark, decoded (drawn as a silhouette).
 * @param {{ cloth: string, seed: string, size?: number, scale?: number }} o The cloth's colour, the seed, the canvas's longer side (2048), and the mark's size as a share of the board's width (0.5).
 * @returns {{ color: HTMLCanvasElement, height: HTMLCanvasElement, rough: HTMLCanvasElement }} The three canvases.
 */
export function clothCanvases(mark, { cloth, seed, size = 2048, scale = 0.5 }) {
	const W = Math.round((size * BOOK.width) / BOOK.height);
	const H = size;
	const pxmm = H / BOOK.height;
	// the weave: warp and weft about half a millimetre apart, each thread's height rising and falling over the other
	const [hc, hg] = canvas2d(W, H);
	const img = hg.createImageData(W, H);
	const r = rng(`${seed}:weave`);
	const pitch = 0.42 * pxmm;
	const slub = Array.from({ length: 64 }, () => r.range(-1, 1));
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const u = x / pitch;
			const v = y / pitch;
			const cu = Math.floor(u);
			const cv = Math.floor(v);
			const over = (cu + cv) % 2 === 0;
			const fu = u - cu - 0.5;
			const fv = v - cv - 0.5;
			const warp = Math.cos(fu * Math.PI) * (over ? 1 : 0.55);
			const weft = Math.cos(fv * Math.PI) * (over ? 0.55 : 1);
			const h = Math.max(warp, weft) * 0.75 + slub[(cu * 7 + cv * 3) & 63] * 0.12;
			const g = 128 + h * 70;
			img.data.set([g, g, g, 255], (y * W + x) * 4);
		}
	}
	hg.putImageData(img, 0, 0);
	// the mark's silhouette, centred a little high
	const [mc, mg] = canvas2d(W, H);
	const side = W * scale;
	const aspect = mark.width / mark.height || 1;
	const [mw, mh] = aspect >= 1 ? [side, side / aspect] : [side * aspect, side];
	mg.drawImage(mark, (W - mw) / 2, H * 0.45 - mh / 2, mw, mh);
	mg.globalCompositeOperation = 'source-in';
	mg.fillStyle = '#000';
	mg.fillRect(0, 0, W, H);
	// pressed down: the weave inside the mark flattened and lowered, its edge softened by the die
	hg.save();
	hg.filter = `blur(${pxmm * 0.25}px)`;
	hg.globalAlpha = 0.75;
	hg.drawImage(mc, 0, 0);
	hg.restore();
	const [cc, cg] = canvas2d(W, H);
	cg.fillStyle = cloth;
	cg.fillRect(0, 0, W, H);
	// the dye's slight unevenness, and wear along the edges
	cg.filter = `blur(${W * 0.03}px)`;
	for (let i = 0; i < 40; i++) {
		cg.fillStyle = r.next() < 0.5 ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.015)';
		cg.beginPath();
		cg.ellipse(r.range(0, W), r.range(0, H), r.range(W * 0.05, W * 0.2), r.range(W * 0.05, W * 0.2), 0, 0, Math.PI * 2);
		cg.fill();
	}
	cg.filter = 'none';
	// slubs: threads a little thicker or thinner for a few millimetres, so the weave reads at a distance
	for (let i = 0; i < 9000; i++) {
		const across = r.next() < 0.5;
		const len = r.range(1.5, 6) * pxmm;
		cg.fillStyle = r.next() < 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
		const x = r.range(0, W);
		const y = r.range(0, H);
		if (across) cg.fillRect(x, y, len, 0.25 * pxmm);
		else cg.fillRect(x, y, 0.25 * pxmm, len);
	}
	cg.strokeStyle = 'rgba(255,255,255,0.05)';
	cg.lineWidth = pxmm * 2;
	cg.strokeRect(pxmm, pxmm, W - 2 * pxmm, H - 2 * pxmm);
	cg.globalAlpha = 0.18;
	cg.drawImage(mc, 0, 0);
	// the deboss's walls: the far one in shade, the near one catching the light
	const wall = (shift, color, alpha) => {
		const [ec, eg] = canvas2d(W, H);
		eg.drawImage(mc, 0, 0);
		eg.globalCompositeOperation = 'destination-out';
		eg.drawImage(mc, 0, shift);
		eg.globalCompositeOperation = 'source-in';
		eg.fillStyle = color;
		eg.fillRect(0, 0, W, H);
		cg.globalAlpha = alpha;
		cg.drawImage(ec, 0, 0);
	};
	wall(pxmm * 0.5, '#000000', 0.35);
	wall(-pxmm * 0.5, '#ffffff', 0.12);
	const [rc, rg] = canvas2d(W, H);
	rg.fillStyle = '#e0e0e0';
	rg.fillRect(0, 0, W, H);
	rg.filter = 'invert(1) brightness(0.62)';
	rg.globalAlpha = 0.5;
	rg.drawImage(mc, 0, 0);
	return { color: cc, height: hc, rough: rc };
}

/**
 * The slipcase's print: the brand's lockup in white, large along its top edge, on a clear ground.
 *
 * @param {import('../util/brand.js').Brand} brand The brand.
 * @param {[number, number]} size The case's face, mm.
 * @param {number} [px=8] Pixels per mm.
 * @returns {string} The SVG.
 */
export function slipcaseSvg(brand, [W, H], px = 8) {
	const sc = svgScene({ width: W * px, height: H * px, key: `slipcase:${brand.name}` });
	const m = W * 0.08;
	sc.add(lockupIn(sc, { mark: brand.mark, name: brand.name, ink: '#ffffff', size: W * px, x: m * px, y: m * px, width: (W - 2 * m) * px, height: H * 0.2 * px, align: 'start' }));
	return sc.svg();
}

/**
 * A clothbound book and its acrylic slipcase, in 3D on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./book.js').BookSceneOptions} options The mark (inline), the brand, and how to show them.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function bookScene(canvas, options) {
	const o = reader('bookScene', options);
	const brand = brandOf(o, { color: '#2a2f2c' });
	const cloth = o.color('cloth', mix(brand.color, '#1d1d1d', 0.55));
	const tint = o.color('tint', '#5fc9b2');
	const ground = o.color('ground', '#a8cbcf');
	const light = o.num('light', 0.4, -1, 1);
	const seed = o.text('seed', 'book');
	const B = BOOK;
	const markImg = new Image();
	markImg.src = artHref(ink(brand.mark, '#000000'));
	await markImg.decode();
	const maps = clothCanvases(markImg, { cloth, seed, scale: o.num('scale', 0.5, 0.1, 0.9) });
	const caseFace = /** @type {[number, number]} */ ([B.width + 2 * B.wall + 2, B.height + 2 * B.wall + 2]);
	const print = await drawSvg(slipcaseSvg(brand, caseFace), caseFace[0] * 8, caseFace[1] * 8);
	const shot = { ...shotOf(o, { ground, light, layout: 'flat', fit: 0.82, view: { tilt: 44, turn: -24 } }), lens: lensOf(o, { aperture: 0.008, blur: 0.4 }) };

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
		const u = 1 / UNIT;
		const tex = (c, srgb = true) => {
			const t = keep(new THREE.CanvasTexture(c));
			if (srgb) t.colorSpace = THREE.SRGBColorSpace;
			t.anisotropy = 8;
			return t;
		};
		// the book, its spine to the left: two boards, the spine, the page block between
		const book = new THREE.Group();
		const front = keep(new THREE.MeshPhysicalMaterial({ map: tex(maps.color), bumpMap: tex(maps.height, false), bumpScale: 1.6, roughnessMap: tex(maps.rough, false), roughness: 1, sheen: 0.6, sheenRoughness: 0.55, sheenColor: mix(cloth, '#ffffff', 0.5), envMapIntensity: 0.6 }));
		const weave = tex(maps.height, false);
		weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
		const plainCloth = keep(new THREE.MeshPhysicalMaterial({ color: cloth, bumpMap: weave, bumpScale: 1.6, roughness: 0.9, sheen: 0.6, sheenRoughness: 0.55, sheenColor: mix(cloth, '#ffffff', 0.5), envMapIntensity: 0.6 }));
		const pages = keep(new THREE.MeshStandardMaterial({ color: '#f1eee6', roughness: 0.9, bumpMap: pageLines(THREE, keep), bumpScale: 0.6 }));
		const W = B.width * u;
		const D = B.height * u;
		const T = B.thickness * u;
		const b = B.board * u;
		const add = (geo, mat, x, y, z) => {
			const m = new THREE.Mesh(geo, mat);
			m.position.set(x, y, z);
			m.castShadow = m.receiveShadow = true;
			book.add(m);
			return m;
		};
		const boardGeo = keep(new RoundedBoxGeometry(W, b, D, 3, b * 0.45));
		add(boardGeo, [plainCloth, plainCloth, front, plainCloth, plainCloth, plainCloth], 0, T - b / 2, 0);
		add(boardGeo, plainCloth, 0, b / 2, 0);
		const spine = add(keep(new THREE.CylinderGeometry(T / 2, T / 2, D, 32, 1, false, Math.PI, Math.PI)), plainCloth, -W / 2 + 0.02, T / 2, 0);
		spine.rotation.x = Math.PI / 2;
		spine.scale.set(0.35, 1, 1);
		add(keep(new THREE.BoxGeometry(W - B.overhang * u - 0.02, T - 2 * b, D - 2 * B.overhang * u)), pages, -B.overhang * u * 0.5 + 0.01, T / 2, 0);
		const L = BOOK_LAYOUT;
		book.position.set(L.book.x * u, 0, L.book.z * u);
		book.rotation.y = (-L.book.turn * Math.PI) / 180;
		scene.add(book);

		// the slipcase: two faces with a thumb notch along the open side, three walls; tinted cast acrylic
		// a window for the acrylic to reflect, where a flat face seen from the camera looks: its edge cuts across the face
		const studio = keep(new THREE.CanvasTexture(windowCanvas(shot.view?.turn ?? -24, shot.view?.tilt ?? 44)));
		studio.mapping = THREE.EquirectangularReflectionMapping;
		studio.colorSpace = THREE.SRGBColorSpace;
		const glass = { transmission: 1, roughness: 0.03, ior: 1.49, specularIntensity: 1, envMap: studio, envMapIntensity: 5, attenuationColor: tint };
		const acrylic = keep(new THREE.MeshPhysicalMaterial({ ...glass, color: mix(tint, '#ffffff', 0.7), thickness: B.wall * u, attenuationDistance: 0.14 }));
		// the cut edges: light runs along inside the sheet, so they read deeper and greener
		// the cut edges: light runs along inside the sheet, so they read as solid lines of the tint
		const edge = keep(new THREE.MeshPhysicalMaterial({ color: mix(tint, '#0b1a17', 0.2), roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, envMap: studio, envMapIntensity: 2 }));
		// the bottom sheet, lying on the ground: the ground seen through it, tinted, so the top shows the case's inside
		const floor = keep(new THREE.MeshPhysicalMaterial({ color: mix(ground, tint, 0.45), roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, envMap: studio, envMapIntensity: 1.2 }));
		const [cw, cd] = [caseFace[0] * u, caseFace[1] * u];
		const ch = (B.thickness + 2) * u + 2 * B.wall * u;
		const w = B.wall * u;
		const slip = new THREE.Group();
		const face = notchedFace(THREE, cw, cd, B.notch * u);
		const extrude = { depth: w * 0.6, bevelEnabled: true, bevelThickness: w * 0.2, bevelSize: w * 0.15, bevelSegments: 3, curveSegments: 24 };
		const faceGeo = keep(new THREE.ExtrudeGeometry(face, extrude));
		for (const y of [0, ch - w]) {
			const m = new THREE.Mesh(faceGeo, [y ? acrylic : floor, edge]);
			m.rotation.x = -Math.PI / 2;
			m.position.y = y + w * 0.2;
			slip.add(m);
		}
		const wallGeo = (len) => keep(new RoundedBoxGeometry(w, ch, len, 2, w * 0.3));
		// the walls: clear sheet, their cut edges (top and ends) the deeper tint
		const right = new THREE.Mesh(wallGeo(cd), [acrylic, acrylic, edge, edge, edge, edge]);
		right.position.set(cw / 2 - w / 2, ch / 2, 0);
		const far = new THREE.Mesh(wallGeo(cw - 2 * w), [acrylic, acrylic, edge, edge, edge, edge]);
		far.rotation.y = Math.PI / 2;
		far.position.set(0, ch / 2, -cd / 2 + w / 2);
		const near = far.clone();
		near.position.z = cd / 2 - w / 2;
		slip.add(right, far, near);
		// the print, on the top face
		const ink = tex(print);
		const printed = new THREE.Mesh(new THREE.PlaneGeometry(cw, cd), new THREE.MeshStandardMaterial({ map: ink, transparent: true, roughness: 0.5, depthWrite: false }));
		printed.rotation.x = -Math.PI / 2;
		printed.position.y = ch + w * 0.05;
		slip.add(printed);
		slip.position.set(L.slipcase.x * u, 0, L.slipcase.z * u);
		slip.rotation.y = (-L.slipcase.turn * Math.PI) / 180;
		scene.add(slip);

		// soft shade under both: the book's dense, the case's faint (light passes through it)
		scene.add(await contactMesh(THREE, { feet: [{ x: L.book.x, z: L.book.z, w: B.width, d: B.height, lift: 0.08 }], light, strength: 1.4 }));
		const caseShade = await contactMesh(THREE, { feet: [{ x: L.slipcase.x, z: L.slipcase.z, w: caseFace[0], d: caseFace[1], lift: 0.08 }], light, strength: 0.35 });
		caseShade.position.y += 0.0002;
		scene.add(caseShade);
		const width = (Math.abs(L.book.x) + Math.abs(L.slipcase.x) + caseFace[0]) * u;
		return { width: width * 1.05, height: (caseFace[1] + 68) * u, center: [0, 0, 0] };
	});
}

/**
 * A slipcase face: a rectangle with a half-round thumb notch cut into the middle of its open (left) side.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {number} w Its width.
 * @param {number} d Its depth.
 * @param {number} r The notch's radius.
 * @returns {import('three').Shape} The shape, centred, in x and y (y becomes −z when laid flat).
 */
function notchedFace(THREE, w, d, r) {
	const s = new THREE.Shape();
	s.moveTo(-w / 2, -d / 2);
	s.lineTo(w / 2, -d / 2);
	s.lineTo(w / 2, d / 2);
	s.lineTo(-w / 2, d / 2);
	s.lineTo(-w / 2, r);
	s.absarc(-w / 2, 0, r, Math.PI / 2, -Math.PI / 2, true);
	s.lineTo(-w / 2, -d / 2);
	return s;
}

/**
 * A dim room with one tall window, as an equirectangular panorama, placed where a level face seen from the camera
 * reflects: up and away from the camera, its edge running across the face on a slant.
 *
 * @param {number} turn The camera's turn, degrees.
 * @param {number} tilt The camera's tilt from straight down, degrees.
 * @returns {HTMLCanvasElement} The panorama.
 */
export function windowCanvas(turn, tilt) {
	const W = 1024;
	const H = 512;
	const [c, g] = canvas2d(W, H);
	g.fillStyle = '#262626';
	g.fillRect(0, 0, W, H);
	// where the reflection of the camera's line of sight off a level face points
	const a = (turn * Math.PI) / 180;
	const u = Math.atan2(-Math.cos(a), -Math.sin(a)) / (2 * Math.PI) + 0.5;
	const v = 0.5 + (90 - tilt) / 180;
	const x = u * W;
	const y = (1 - v) * H;
	const sky = g.createLinearGradient(0, y - H * 0.3, 0, y + H * 0.2);
	sky.addColorStop(0, '#ffffff');
	sky.addColorStop(1, '#cfd6da');
	g.fillStyle = sky;
	g.beginPath();
	g.moveTo(x - W * 0.3, y - H * 0.75);
	g.lineTo(x + W * 0.13, y - H * 0.75);
	g.lineTo(x - W * 0.02, y + H * 0.35);
	g.lineTo(x - W * 0.3, y + H * 0.35);
	g.fill();
	return c;
}

/**
 * The page block's edge: fine lines of leaves, for a bump map.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {<T extends { dispose(): void }>(t: T) => T} keep Keeps the texture to free with the scene.
 * @returns {import('three').CanvasTexture} The texture.
 */
function pageLines(THREE, keep) {
	const [c, g] = canvas2d(64, 512);
	const r = rng('pages');
	for (let y = 0; y < 512; y++) {
		const v = 150 + r.range(-50, 50);
		g.fillStyle = `rgb(${v},${v},${v})`;
		g.fillRect(0, y, 64, 1);
	}
	return keep(new THREE.CanvasTexture(c));
}
