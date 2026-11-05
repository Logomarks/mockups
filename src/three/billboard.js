/**
 * @module @logomarks/mockups/three/billboard
 *
 * A billboard over a hedge, seen from the street below: the poster pasted
 * on a slim board (its paper's seams faintly showing), lamps on short
 * arms along its foot, standing above a clipped hedge wall against a
 * clear summer sky, a concrete block and a rendered wall beside it. The hedge is
 * leaves, not a texture: tens of thousands of them, each turned its own
 * way, deeper ones darker, shading one another in the sun, so it has the
 * depth and sparkle a real one has.
 */

import { reader } from '../util/reader.js';
import { mix } from '../util/color.js';
import { rng } from '../util/rng.js';
import { scene as svgScene } from '../render/scene.js';
import { canvas2d } from '../render/image.js';
import { resolveSurface } from '../materials/desk.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg, artAspect } from './printart.js';
import { deskCanvas } from './deskplane.js';
import { resolveWall, wallLayer } from '../materials/wall.js';

/** The site, in mm: the hedge's width, height and depth, the board's width, the gap between the hedge and the board, and a leaf's length. */
export const HEDGE = Object.freeze({ width: 15000, height: 2700, depth: 900, board: 6400, gap: 350, leaf: 62 });

/** The greens a hedge's leaves are drawn from: laurel, box, and yew. */
export const HEDGES = Object.freeze({ laurel: ['#2d5a22', '#3f7230', '#557f34', '#6c8f3c', '#24461b'], box: ['#3d5f1f', '#4f7425', '#678a2c', '#7f9a3a', '#2f4a18'], yew: ['#29472a', '#355a30', '#456b36', '#577c3c', '#203b20'] });

/**
 * The board's height for the art's proportions: as wide as the site's board, between a third and half as tall.
 *
 * @param {number} aspect The art's width over its height.
 * @returns {[number, number]} The board's width and height, in mm.
 */
export function boardSize(aspect) {
	const a = Math.min(3, Math.max(2, aspect || 3));
	return [HEDGE.board, Math.round(HEDGE.board / a)];
}

/**
 * Where the hedge's leaves are: scattered over its front and top, sunk to seeded depths, each turned out from the face by up to ~55°.
 *
 * @param {{ width: number, height: number, depth: number, leaf: number, seed: string, density?: number }} o The hedge (mm) and a leaf's length, the seed, and how thickly they grow (1).
 * @returns {{ p: [number, number, number], n: [number, number, number], spin: number, depth: number }[]} Each leaf's centre (mm; x across, y up, z out of the front face, which is z = 0), the way it faces, its turn about that, and how deep it sits (0 outermost, 1 deepest).
 */
export function hedgeLeaves({ width, height, depth, leaf, seed, density = 1 }) {
	const r = rng(`${seed}:leaves`);
	const per = (2.4 * density) / (leaf * leaf * 0.55);
	const out = [];
	const leafAt = (x, y, z, normal, d) => {
		// facing out from the face, tipped a seeded way
		const t1 = r.range(-1, 1) * 0.95;
		const t2 = r.range(-1, 1) * 0.95;
		const n = normal === 'front' ? [Math.sin(t1), Math.sin(t2) * 0.8 + 0.25, Math.cos(t1) * Math.cos(t2)] : [Math.sin(t1) * 0.8, Math.cos(t1) * Math.cos(t2), Math.sin(t2) * 0.8 + 0.2];
		const l = Math.hypot(n[0], n[1], n[2]);
		out.push({ p: /** @type {[number, number, number]} */ ([x, y, z]), n: /** @type {[number, number, number]} */ (n.map((v) => v / l)), spin: r.range(0, Math.PI * 2), depth: d });
	};
	// the front: the face billows a little (clipped, not flat), leaves sunk up to 160 mm into it
	const front = Math.round(width * height * per);
	for (let i = 0; i < front; i++) {
		const x = r.range(-width / 2, width / 2);
		const y = r.range(0, height);
		// clumps: bulges where the leaves crowd outward into the light, hollows where they sink into shade
		const clump = 0.5 + 0.25 * (Math.sin(x * 0.0043 + Math.sin(y * 0.003) * 2) + Math.sin(y * 0.0061 + x * 0.0017 + 0.7));
		const d = Math.min(1, r.next() ** 1.6 * (0.45 + 1.1 * (1 - clump)));
		const billow = 40 * Math.sin(x * 0.0021 + 1.3) * Math.sin(y * 0.0034) + 25 * Math.sin(x * 0.0057 + y * 0.004) + 50 * clump;
		leafAt(x, y, billow - d * 160, 'front', d);
	}
	// the top: clipped level, a little rounded at the front edge
	const top = Math.round(width * depth * per * 0.8);
	for (let i = 0; i < top; i++) {
		const x = r.range(-width / 2, width / 2);
		const z = -r.range(0, depth);
		const d = r.next() ** 1.6;
		const round = z > -120 ? -((120 + z) ** 2) / 300 : 0;
		leafAt(x, height + round - d * 140, z, 'top', d);
	}
	return out;
}

/**
 * A billboard over a hedge, on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./billboard.js').BillboardSceneOptions} options The poster (inline), the hedge and the light.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function billboardScene(canvas, options) {
	const o = reader('billboardScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const kind = o.oneOf('hedge', 'laurel', /** @type {(keyof typeof HEDGES)[]} */ (Object.keys(HEDGES)));
	const density = o.num('density', 1, 0.3, 2);
	const sunSide = o.num('light', -0.5, -1, 1);
	const seed = o.text('seed', 'billboard');
	const [bw, bh] = boardSize(await artAspect(art));
	// the poster: the art, its pasted sheets' seams faint across it
	const px = 0.32;
	const ps = svgScene({ width: Math.round(bw * px), height: Math.round(bh * px), key: `board:${seed}` });
	ps.add(ps.image(art, bw / bh)(0, 0, ps.width, ps.height));
	for (let i = 1; i < 4; i++) ps.add(`<rect x="0" y="${(ps.height * i) / 4}" width="${ps.width}" height="1.2" fill="#000" opacity="0.07"/>`);
	const poster = await drawSvg(ps.svg(), ps.width, ps.height);
	const concrete = await deskCanvas(resolveSurface('concrete'), { span: 3000, light: 0.3, seed, px: 1024 });
	// the white wall: painted render, drawn at its size
	const ws = svgScene({ width: 768, height: 920, key: `render:${seed}` });
	ws.add(wallLayer(ws, resolveWall('#e6e4de'), { width: 768, height: 920, mm: 768 / 3000, light: sunSide, seed }));
	const render = await drawSvg(ws.svg(), 768, 920);
	const shot = {
		...shotOf(o, { ground: '#000000', light: sunSide, layout: 'upright', fit: 0.9, view: { tilt: -8, turn: -24, fov: 34 } }),
		lighting: /** @type {const} */ ('none'),
		lens: lensOf(o, { aperture: 0.002, blur: 0.5, samples: 24 }),
	};

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
		const u = 1 / 100;
		const H = HEDGE;
		const sky = keep(new THREE.CanvasTexture(skyCanvas(seed)));
		sky.mapping = THREE.EquirectangularReflectionMapping;
		sky.colorSpace = THREE.SRGBColorSpace;
		scene.background = sky;
		scene.environment = sky;
		scene.environmentIntensity = 0.7;

		// the hedge: a dark core, and the leaves on it
		const core = new THREE.Mesh(new THREE.BoxGeometry(H.width * u, (H.height - 60) * u, (H.depth - 120) * u), new THREE.MeshStandardMaterial({ color: '#0d1a0b', roughness: 1 }));
		core.position.set(0, ((H.height - 60) / 2) * u, (-(H.depth - 120) / 2 - 80) * u);
		scene.add(core);
		const leaves = hedgeLeaves({ width: H.width, height: H.height, depth: H.depth, leaf: H.leaf, seed, density });
		const leafTex = keep(new THREE.CanvasTexture(leafCanvas()));
		leafTex.colorSpace = THREE.SRGBColorSpace;
		const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.45, envMapIntensity: 1 });
		const geo = new THREE.PlaneGeometry(H.leaf * 0.62 * u, H.leaf * u);
		const mesh = new THREE.InstancedMesh(geo, leafMat, leaves.length);
		mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: 0.5 });
		const greens = HEDGES[kind];
		const r = rng(`${seed}:greens`);
		const m4 = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const spin = new THREE.Quaternion();
		const zAxis = new THREE.Vector3(0, 0, 1);
		const n = new THREE.Vector3();
		const scale = new THREE.Vector3();
		leaves.forEach((l, i) => {
			n.set(...l.n);
			q.setFromUnitVectors(zAxis, n).multiply(spin.setFromAxisAngle(zAxis, l.spin));
			const s = r.range(0.75, 1.2);
			m4.compose(new THREE.Vector3(l.p[0] * u, l.p[1] * u, l.p[2] * u), q, scale.set(s, s, s));
			mesh.setMatrixAt(i, m4);
			// deeper leaves darker (the hedge's own shade), a few young ones paler
			const c = mix(greens[Math.floor(r.next() * greens.length)], r.next() > 0.93 ? '#a7b84e' : '#000000', r.next() > 0.93 ? 0.35 : l.depth * 0.55);
			mesh.setColorAt(i, new THREE.Color(c));
		});
		mesh.castShadow = mesh.receiveShadow = true;
		scene.add(mesh);

		// the board: the poster on a slim panel, a metal edge, lamps on arms along its foot, a post behind
		const y0 = H.height + H.gap;
		const bx = -600;
		const board = new THREE.Group();
		const posterMap = keep(new THREE.CanvasTexture(poster));
		posterMap.colorSpace = THREE.SRGBColorSpace;
		posterMap.anisotropy = 8;
		const face = new THREE.Mesh(new THREE.PlaneGeometry(bw * u, bh * u), new THREE.MeshStandardMaterial({ map: posterMap, roughness: 0.85 }));
		face.position.z = 61 * u;
		face.receiveShadow = true;
		const edgeMat = new THREE.MeshStandardMaterial({ color: '#d9d6cf', roughness: 0.6, metalness: 0.3 });
		const panel = new THREE.Mesh(new RoundedBoxGeometry((bw + 70) * u, (bh + 70) * u, 120 * u, 2, 12 * u), edgeMat);
		panel.castShadow = panel.receiveShadow = true;
		board.add(panel, face);
		const steel = new THREE.MeshStandardMaterial({ color: '#5d6066', roughness: 0.5, metalness: 0.7 });
		for (let i = 0; i < 4; i++) {
			const lx = (-bw / 2 + (bw * (i + 0.5)) / 4) * u;
			const arm = new THREE.Mesh(new THREE.BoxGeometry(30 * u, 30 * u, 520 * u), steel);
			arm.position.set(lx, (-bh / 2 - 60) * u, 300 * u);
			const head = new THREE.Mesh(new RoundedBoxGeometry(240 * u, 70 * u, 160 * u, 2, 18 * u), steel);
			head.position.set(lx, (-bh / 2 - 80) * u, 560 * u);
			head.rotation.x = -0.5;
			for (const m of [arm, head]) {
				m.castShadow = true;
				board.add(m);
			}
		}
		board.position.set(bx * u, (y0 + bh / 2) * u, -200 * u);
		board.rotation.x = -0.02;
		scene.add(board);
		const post = new THREE.Mesh(new THREE.BoxGeometry(400 * u, (y0 + 200) * u, 400 * u), steel);
		post.position.set(bx * u, ((y0 + 200) / 2) * u, -700 * u);
		scene.add(post);

		// the concrete block behind on the left, and a white wall on the right
		const concreteMap = keep(new THREE.CanvasTexture(concrete.canvas));
		concreteMap.colorSpace = THREE.SRGBColorSpace;
		concreteMap.wrapS = concreteMap.wrapT = THREE.MirroredRepeatWrapping;
		concreteMap.repeat.set(2, 1.4);
		const block = new THREE.Mesh(new THREE.BoxGeometry(6000 * u, 4300 * u, 3000 * u), new THREE.MeshStandardMaterial({ map: concreteMap, color: '#c9c3b8', roughness: 0.95 }));
		block.position.set(-7600 * u, 2150 * u, -2600 * u);
		block.castShadow = block.receiveShadow = true;
		// its parapet: a coping proud of the face, its shadow under it
		const coping = new THREE.Mesh(new THREE.BoxGeometry(6100 * u, 160 * u, 3150 * u), new THREE.MeshStandardMaterial({ color: '#d6d1c7', roughness: 0.9 }));
		coping.position.set(-7600 * u, 4380 * u, -2600 * u);
		coping.castShadow = true;
		scene.add(coping);
		const renderMap = keep(new THREE.CanvasTexture(render));
		renderMap.colorSpace = THREE.SRGBColorSpace;
		const white = new THREE.Group();
		// two lifts of cladding, a shadowed joint between them
		for (const [h, y] of [[2380, 1190], [1200, 3000]]) {
			const lift = new THREE.Mesh(new RoundedBoxGeometry(3000 * u, h * u, 600 * u, 2, 8 * u), new THREE.MeshStandardMaterial({ map: renderMap, roughness: 0.85 }));
			lift.position.set(0, y * u, 0);
			lift.castShadow = lift.receiveShadow = true;
			white.add(lift);
		}
		white.position.set(7200 * u, 0, 200 * u);
		const street = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ color: '#77746e', roughness: 0.95 }));
		street.rotation.x = -Math.PI / 2;
		street.receiveShadow = true;
		scene.add(block, white, street);

		// the sun, high and to one side, and the sky's light
		const sun = new THREE.DirectionalLight('#fff3e0', 4);
		sun.position.set(sunSide * 9, 14, 9);
		sun.target.position.set(0, 2.4, 0);
		sun.castShadow = true;
		sun.shadow.mapSize.set(4096, 4096);
		sun.shadow.camera.left = -90;
		sun.shadow.camera.right = 90;
		sun.shadow.camera.top = 60;
		sun.shadow.camera.bottom = -60;
		sun.shadow.camera.near = 1;
		sun.shadow.camera.far = 60;
		sun.shadow.bias = -0.0003;
		sun.shadow.normalBias = 0.01;
		sun.shadow.radius = 1.5;
		scene.add(sun, sun.target, new THREE.HemisphereLight('#bcd6f2', '#4a5a34', 0.8));
		const top = y0 + bh;
		return { width: (bw + 2600) * u, height: (top + 300) * u, center: [bx * 0.6 * u, (top * 0.6) * u, 0], focus: [bx * u, (y0 + bh / 2) * u, 0] };
	});
}

/**
 * A clear summer sky as an equirectangular canvas: deep blue overhead paling to the horizon, faint high cirrus, a pale ground.
 *
 * @param {string} seed The seed.
 * @returns {HTMLCanvasElement} The panorama.
 */
function skyCanvas(seed) {
	const W = 4096;
	const H = 2048;
	const [c, g] = canvas2d(W, H);
	const sky = g.createLinearGradient(0, 0, 0, H / 2);
	sky.addColorStop(0, '#1f58b0');
	sky.addColorStop(0.55, '#3f82d0');
	sky.addColorStop(0.85, '#7fb0e2');
	sky.addColorStop(1, '#b4d0ec');
	g.fillStyle = sky;
	g.fillRect(0, 0, W, H / 2);
	g.fillStyle = '#8a8a80';
	g.fillRect(0, H / 2, W, H / 2);
	// a clear day: only faint high cirrus, long soft streaks
	const r = rng(`${seed}:cirrus`);
	for (let k = 0; k < 9; k++) {
		const x = r.range(0, W);
		const y = r.range(H * 0.08, H * 0.38);
		g.filter = `blur(${r.range(10, 22)}px)`;
		g.fillStyle = `rgba(255,255,255,${r.range(0.12, 0.26)})`;
		g.beginPath();
		g.ellipse(x, y, r.range(W * 0.04, W * 0.1), r.range(H * 0.004, H * 0.012), r.range(-0.15, 0.15), 0, Math.PI * 2);
		g.fill();
	}
	g.filter = 'none';
	return c;
}

/**
 * A leaf as a texture: a pointed oval with a paler midrib and faint veins, clear round it (its colour comes from each leaf).
 *
 * @returns {HTMLCanvasElement} The texture, 128 × 128.
 */
function leafCanvas() {
	const [c, g] = canvas2d(128, 128);
	g.translate(64, 64);
	g.beginPath();
	g.moveTo(0, -62);
	g.bezierCurveTo(46, -34, 40, 34, 0, 62);
	g.bezierCurveTo(-40, 34, -46, -34, 0, -62);
	const shade = g.createLinearGradient(-40, 0, 40, 0);
	shade.addColorStop(0, '#d8d8d8');
	shade.addColorStop(0.5, '#ffffff');
	shade.addColorStop(1, '#c4c4c4');
	g.fillStyle = shade;
	g.fill();
	g.strokeStyle = 'rgba(255,255,240,0.9)';
	g.lineWidth = 2.5;
	g.beginPath();
	g.moveTo(0, -56);
	g.lineTo(0, 58);
	g.stroke();
	g.strokeStyle = 'rgba(120,120,120,0.35)';
	g.lineWidth = 1.2;
	for (let i = -3; i <= 3; i++) {
		g.beginPath();
		g.moveTo(0, i * 14);
		g.quadraticCurveTo(14, i * 14 - 10, 26, i * 14 - 18);
		g.moveTo(0, i * 14);
		g.quadraticCurveTo(-14, i * 14 - 10, -26, i * 14 - 18);
		g.stroke();
	}
	return c;
}
