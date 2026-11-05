/**
 * @module @logomarks/mockups/three/lightbox
 *
 * A backlit poster on an underground station's wall: a slim metal frame
 * round a glowing face, set on a wall of large cream enamel panels (each a
 * little out of true, so the strip lights overhead catch them unevenly),
 * a dark tiled skirting and a tiled floor. The poster lights its own
 * frame's lip and the floor in front of it, and its glow spills onto the
 * panels round it. The poster is the art, or, given a mark and a name, a
 * type poster composed from them with its grid showing.
 */

import { reader } from '../util/reader.js';
import { mix } from '../util/color.js';
import { rng } from '../util/rng.js';
import { scene as svgScene } from '../render/scene.js';
import { canvas2d } from '../render/image.js';
import { typePoster } from '../parts/typeposter.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg, artAspect } from './printart.js';

/** The wall, in mm: an enamel panel, the joint between panels, the skirting's height, and the frame's rail. */
export const STATION = Object.freeze({ panel: [960, 640], joint: 12, skirting: 420, rail: 32, depth: 70 });

/** The poster's height, and the composed poster's proportions, in mm. */
export const LIGHTBOX = Object.freeze({ height: 1016, type: [1830, 1016], widest: 3048 });

/** The wall's tiles: cream enamel, or white. */
export const STATION_WALLS = Object.freeze({ cream: '#d9cdb0', white: '#e7e4dc', green: '#7f9a86' });

/**
 * The poster's size in mm, from the art's proportions: always 1016 mm high, between square and three times as wide.
 *
 * @param {number} aspect The art's width over its height.
 * @returns {[number, number]} Its width and height.
 */
export function posterSize(aspect) {
	const a = Math.min(LIGHTBOX.widest / LIGHTBOX.height, Math.max(0.6, aspect || 1));
	return [Math.round(LIGHTBOX.height * a), LIGHTBOX.height];
}

/**
 * The panels round the poster: whole panels on a grid that starts at the skirting, each with a seeded tone and a slight tilt.
 *
 * @param {{ width: number, height: number, seed: string }} o How much wall to cover (mm, centred on x = 0, up from the floor), and the seed.
 * @returns {{ x: number, y: number, tone: number, tilt: [number, number] }[]} Each panel's centre (mm), its tone (−1–1) and its tilt (radians, about x and y).
 */
export function panelGrid({ width, height, seed }) {
	const S = STATION;
	const [pw, ph] = [S.panel[0] + S.joint, S.panel[1] + S.joint];
	const r = rng(`${seed}:panels`);
	const out = [];
	const cols = Math.ceil(width / pw / 2) + 1;
	for (let j = 0; S.skirting + j * ph < height; j++) {
		for (let i = -cols; i <= cols; i++) {
			out.push({ x: i * pw, y: S.skirting + S.joint + j * ph + ph / 2, tone: r.range(-1, 1), tilt: [r.range(-0.006, 0.006), r.range(-0.006, 0.006)] });
		}
	}
	return out;
}

/**
 * A backlit poster in a station, on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./lightbox.js').LightboxSceneOptions} options The poster (art, or a mark and a name to compose one), and the wall.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function lightboxScene(canvas, options) {
	const o = reader('lightboxScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const name = o.text('name', '');
	const layout = o.oneOf('layout', name ? 'type' : 'art', /** @type {const} */ (['art', 'type']));
	const color = o.color('color', '#12201f');
	const ink = o.color('ink', '#8fe3c6');
	const headline = o.text('headline', 'Made for the way you move.');
	const url = o.text('url', '');
	const wallName = o.oneOf('wall', 'cream', /** @type {(keyof typeof STATION_WALLS)[]} */ (Object.keys(STATION_WALLS)));
	const glow = o.num('glow', 1, 0, 3);
	const seed = o.text('seed', 'lightbox');
	const [pw, ph] = layout === 'type' ? LIGHTBOX.type : posterSize(await artAspect(art));
	// the poster drawn: the art filling the face, or the type poster
	const px = 1.6;
	const sc = svgScene({ width: Math.round(pw * px), height: Math.round(ph * px), key: `lightbox:${seed}` });
	if (layout === 'type') sc.add(typePoster(sc, { width: sc.width, height: sc.height, mark: art, name, headline, url, color, ink }));
	else sc.add(sc.image(art, pw / ph)(0, 0, sc.width, sc.height));
	const face = await drawSvg(sc.svg(), sc.width, sc.height);
	const tile = STATION_WALLS[wallName];
	const shot = {
		...shotOf(o, { ground: '#000000', light: 0, layout: 'upright', fit: 0.92, view: { tilt: 0, turn: 0, fov: 30 } }),
		lighting: /** @type {const} */ ('none'),
		toneMapping: /** @type {const} */ ('aces'),
		lens: lensOf(o, { aperture: 0.004, blur: 0.3, samples: 24 }),
	};

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
		const { RectAreaLightUniformsLib } = await import('three/addons/lights/RectAreaLightUniformsLib.js');
		RectAreaLightUniformsLib.init();
		const u = 1 / 100;
		const S = STATION;
		const cy = S.skirting + S.joint + (S.panel[1] + S.joint) * 0.5 + ph / 2 + 60;
		const env = keep(new THREE.CanvasTexture(stationCanvas()));
		env.mapping = THREE.EquirectangularReflectionMapping;
		env.colorSpace = THREE.SRGBColorSpace;
		scene.environment = env;
		scene.environmentIntensity = 0.8;
		scene.background = new THREE.Color('#0c0b09');

		// the wall: a dark backing in the joints, the enamel panels standing proud of it, each a touch out of true
		const wallW = Math.max(pw * 2.6, 6000);
		const wallH = 3600;
		const backing = new THREE.Mesh(new THREE.PlaneGeometry(wallW * u, wallH * u), new THREE.MeshStandardMaterial({ color: '#4a4135', roughness: 0.9 }));
		backing.position.set(0, (wallH / 2) * u, 0);
		backing.receiveShadow = true;
		scene.add(backing);
		const panels = panelGrid({ width: wallW, height: wallH, seed });
		const enamel = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.18, envMapIntensity: 1 });
		const grime = keep(new THREE.CanvasTexture(grimeCanvas(seed)));
		grime.colorSpace = THREE.SRGBColorSpace;
		enamel.map = grime;
		// flat faces: a rounded box's bent normals band under a near light
		const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(S.panel[0] * u, S.panel[1] * u, 22 * u), enamel, panels.length);
		const m4 = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const e = new THREE.Euler();
		panels.forEach((p, i) => {
			q.setFromEuler(e.set(p.tilt[0], p.tilt[1], 0));
			m4.compose(new THREE.Vector3(p.x * u, p.y * u, 11 * u), q, new THREE.Vector3(1, 1, 1));
			slabs.setMatrixAt(i, m4);
			slabs.setColorAt(i, new THREE.Color(mix(tile, p.tone > 0 ? '#f4eedd' : '#a8987a', Math.abs(p.tone) * 0.18)));
		});
		slabs.receiveShadow = true;
		scene.add(slabs);

		// the skirting: dark glazed tiles, and the floor's tiles
		const skirt = new THREE.Mesh(new THREE.BoxGeometry(wallW * u, S.skirting * u, 40 * u), new THREE.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.7, map: keep(tileTexture(THREE, { size: [300, 140], width: wallW, height: S.skirting, color: '#3a3027', joint: '#17130f' })) }));
		skirt.position.set(0, (S.skirting / 2) * u, 20 * u);
		skirt.receiveShadow = true;
		scene.add(skirt);
		const floorMap = keep(tileTexture(THREE, { size: [300, 300], width: wallW, height: 4000, color: '#8a7e6b', joint: '#4e463b' }));
		const floor = new THREE.Mesh(new THREE.PlaneGeometry(wallW * u, 4000 * u), new THREE.MeshPhysicalMaterial({ map: floorMap, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4 }));
		floor.rotation.x = -Math.PI / 2;
		floor.position.z = 2000 * u;
		floor.receiveShadow = true;
		scene.add(floor);

		// the lightbox: a metal frame of rounded rails, the glowing face, glass over it
		const box = new THREE.Group();
		// its own environment, so its intensity holds (scene.environment overrides a material's intensity)
		const metal = new THREE.MeshPhysicalMaterial({ color: '#efe9dc', metalness: 1, roughness: 0.32, envMap: env, envMapIntensity: 2.2 });
		const rail = S.rail;
		for (const [w, h, x, y] of [
			[pw + 2 * rail, rail, 0, ph / 2 + rail / 2],
			[pw + 2 * rail, rail, 0, -ph / 2 - rail / 2],
			[rail, ph, -pw / 2 - rail / 2, 0],
			[rail, ph, pw / 2 + rail / 2, 0],
		]) {
			const r = new THREE.Mesh(new RoundedBoxGeometry(w * u, h * u, S.depth * u, 4, 14 * u), metal);
			r.position.set(x * u, y * u, (S.depth / 2) * u);
			r.castShadow = r.receiveShadow = true;
			box.add(r);
		}
		// the rails' inner lip, lit by the tubes behind the face: a thin bright edge all round
		const lipMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff1d6').multiplyScalar(0.9 + 0.4 * glow) });
		for (const [w, h, x, y] of [
			[pw + 12, 7, 0, ph / 2 + 3],
			[pw + 12, 7, 0, -ph / 2 - 3],
			[7, ph, -pw / 2 - 3, 0],
			[7, ph, pw / 2 + 3, 0],
		]) {
			const lip = new THREE.Mesh(new THREE.PlaneGeometry(w * u, h * u), lipMat);
			lip.position.set(x * u, y * u, (S.depth - 20) * u);
			box.add(lip);
		}
		const faceMap = keep(new THREE.CanvasTexture(face));
		faceMap.colorSpace = THREE.SRGBColorSpace;
		faceMap.anisotropy = 8;
		const lit = new THREE.Mesh(new THREE.PlaneGeometry(pw * u, ph * u), new THREE.MeshBasicMaterial({ map: faceMap, color: new THREE.Color(1, 1, 1).multiplyScalar(0.92 + 0.5 * glow) }));
		lit.position.z = (S.depth - 22) * u;
		box.add(lit);
		// the glass: the station in it, faintly; it takes no light of its own (no highlight from the face's own light)
		const glass = new THREE.Mesh(new THREE.PlaneGeometry(pw * u, ph * u), new THREE.MeshBasicMaterial({ color: '#000000', envMap: env, combine: THREE.AddOperation, reflectivity: 0.1, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
		glass.position.z = (S.depth - 12) * u;
		box.add(glass);
		box.position.set(0, cy * u, 24 * u);
		scene.add(box);

		// the light: the strip lights overhead, raking down the wall; the poster's own light forward and onto the panels
		const strip = new THREE.RectAreaLight('#ffe7c2', 7, wallW * u, 0.3);
		strip.position.set(0, 3400 * u, 1500 * u);
		strip.lookAt(0, 1200 * u, 0);
		const mean = meanColour(face);
		// a point in front of the face: lights the rails, the panels round it and the floor below, falling off as a lightbox's spill does
		const out = new THREE.PointLight(mean, 1.6 * glow, 0, 2);
		out.position.set(0, cy * u, (S.depth + 380) * u);
		const spill = new THREE.Mesh(new THREE.PlaneGeometry((pw + 1400) * u, (ph + 1400) * u), new THREE.MeshBasicMaterial({ map: keep(haloTexture(THREE, mean)), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 * glow }));
		spill.position.set(0, cy * u, 42 * u);
		const fill = new THREE.HemisphereLight('#fff2dc', '#3a3025', 0.45);
		// a downlight over the platform: the wall brightest round the poster, falling away to the corners
		const down = new THREE.SpotLight('#ffe9c8', 30, 0, 0.75, 1, 2);
		down.position.set(0, 3300 * u, 2600 * u);
		down.target.position.set(0, (cy - 200) * u, 0);
		scene.add(down, down.target);
		scene.add(strip, out, spill, fill);
		const w = pw + 2 * rail;
		return { width: w * 1.5 * u, height: (ph + 2 * rail) * 1.75 * u, center: [0, (cy - 330) * u, 0], focus: [0, cy * u, (S.depth + 24) * u] };
	});
}

/**
 * A station for glossy things to reflect, as an equirectangular canvas: a dim tunnel, a long strip light overhead, a lit platform behind the camera.
 *
 * @returns {HTMLCanvasElement} The panorama.
 */
function stationCanvas() {
	const [c, g] = canvas2d(1024, 512);
	const bg = g.createLinearGradient(0, 0, 0, 512);
	bg.addColorStop(0, '#7a6b56');
	bg.addColorStop(0.5, '#4a4034');
	bg.addColorStop(1, '#2a241d');
	g.fillStyle = bg;
	g.fillRect(0, 0, 1024, 512);
	g.filter = 'blur(3px)';
	g.fillStyle = '#fff4dc';
	// strip lights running along the platform, overhead
	for (const y of [70, 110]) g.fillRect(0, y, 1024, 7);
	g.fillStyle = '#9c8c72';
	g.fillRect(640, 200, 280, 60);
	g.filter = 'none';
	return c;
}

/**
 * Faint grime for the enamel: soft darker blooms and streaks, tiled across the panels.
 *
 * @param {string} seed The seed.
 * @returns {HTMLCanvasElement} The texture (white, darkened where grimy).
 */
function grimeCanvas(seed) {
	const [c, g] = canvas2d(512, 512);
	g.fillStyle = '#ffffff';
	g.fillRect(0, 0, 512, 512);
	const r = rng(`${seed}:grime`);
	g.filter = 'blur(18px)';
	for (let i = 0; i < 16; i++) {
		g.fillStyle = `rgba(120,100,70,${r.range(0.015, 0.045)})`;
		g.beginPath();
		g.ellipse(r.range(0, 512), r.range(0, 512), r.range(30, 120), r.range(20, 80), r.range(0, 3), 0, Math.PI * 2);
		g.fill();
	}
	g.filter = 'blur(2px)';
	for (let i = 0; i < 8; i++) {
		g.fillStyle = `rgba(90,75,55,${r.range(0.03, 0.07)})`;
		g.fillRect(r.range(0, 512), r.range(200, 512), r.range(2, 5), r.range(40, 200));
	}
	g.filter = 'none';
	return c;
}

/**
 * A tiled surface's texture: tiles with seeded tones and dark joints, at true size.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {{ size: [number, number], width: number, height: number, color: string, joint: string }} o The tile's size, the surface's (mm), and the colours.
 * @returns {import('three').CanvasTexture} The texture.
 */
function tileTexture(THREE, { size, width, height, color, joint }) {
	const k = Math.min(2048 / width, 2048 / height, 0.5);
	const [c, g] = canvas2d(Math.round(width * k), Math.round(height * k));
	const r = rng(`tiles:${size}`);
	g.fillStyle = joint;
	g.fillRect(0, 0, c.width, c.height);
	const j = Math.max(1, 5 * k);
	for (let y = 0; y < height; y += size[1]) {
		for (let x = 0; x < width; x += size[0]) {
			g.fillStyle = mix(color, r.next() > 0.5 ? '#ffffff' : '#000000', r.range(0, 0.08));
			g.fillRect(x * k + j / 2, y * k + j / 2, size[0] * k - j, size[1] * k - j);
		}
	}
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}

/**
 * The poster's glow spilling round it: a soft rounded fall-off in its own colour.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {string} color The glow's colour.
 * @returns {import('three').CanvasTexture} The texture.
 */
function haloTexture(THREE, color) {
	const [c, g] = canvas2d(256, 256);
	g.filter = 'blur(26px)';
	g.fillStyle = color;
	g.fillRect(64, 64, 128, 128);
	g.filter = 'none';
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

/**
 * A canvas's mean colour, lifted towards white as a lightbox's light is (its tubes are white behind the print).
 *
 * @param {HTMLCanvasElement} canvas The canvas.
 * @returns {string} The colour, hex.
 */
function meanColour(canvas) {
	const [, g] = canvas2d(8, 8);
	g.drawImage(canvas, 0, 0, 8, 8);
	const d = g.getImageData(0, 0, 8, 8).data;
	const sum = [0, 0, 0];
	for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += d[i + k];
	const hex = '#' + sum.map((v) => Math.round(v / 64).toString(16).padStart(2, '0')).join('');
	return mix(hex, '#ffffff', 0.45);
}
