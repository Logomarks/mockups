/**
 * @module @logomarks/mockups/three/window
 *
 * The brand cut in vinyl on a shop window: the mark and the name, white
 * or gilded, applied to the outside of a large pane in a painted timber
 * frame, set in a brick front. The glass is real glass: the street it
 * faces (sky, buildings, the low sun) lies across it, strongest where the
 * camera looks along it, and through it a dim café shows, its pendant
 * lamps glowing, out of focus behind the lettering. Gilt lettering takes
 * the street in its metal; white vinyl is matte.
 */

import { reader } from '../util/reader.js';
import { isHex, mix } from '../util/color.js';
import { rng } from '../util/rng.js';
import { scene as svgScene } from '../render/scene.js';
import { lockupIn } from '../parts/lockup.js';
import { resolveWall, wallLayer } from '../materials/wall.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg } from './printart.js';
import { streetCanvas, STREET_TIMES } from './streetenv.js';

/** The vinyls: white, and gold leaf. */
export const WINDOW_VINYLS = Object.freeze({ white: '#f4f2ec', gold: '#e8c072' });

/** The window, in mm: the pane, the frame's width and depth, the sill's height above the street, and the lettering's widest. */
export const SHOP_WINDOW = Object.freeze({ pane: [2000, 1700], frame: 90, depth: 110, sill: 600, lettering: 900 });

/**
 * A shop window with the brand in vinyl on it, on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./window.js').WindowSceneOptions} options The mark (inline) and name, the vinyl, the joinery and the street.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function windowScene(canvas, options) {
	const o = reader('windowScene', options);
	const art = /** @type {import('../types.js').Art} */ (o.raw('art'));
	const name = o.text('name', '');
	const vinylName = o.raw('vinyl') ?? 'white';
	const vinyl = typeof vinylName === 'string' && Object.hasOwn(WINDOW_VINYLS, vinylName) ? WINDOW_VINYLS[/** @type {keyof typeof WINDOW_VINYLS} */ (vinylName)] : isHex(vinylName) ? /** @type {string} */ (vinylName) : null;
	if (!vinyl) throw new TypeError(`windowScene: vinyl is 'white', 'gold' or a hex colour (got ${JSON.stringify(vinylName)})`);
	const gilt = vinylName === 'gold';
	const joinery = o.color('color', '#1e2a25');
	const time = o.oneOf('time', 'day', /** @type {(keyof typeof STREET_TIMES)[]} */ (Object.keys(STREET_TIMES)));
	const wall = resolveWall(/** @type {any} */ (o.raw('wall') ?? 'brick'), 'windowScene');
	const glare = o.num('glare', 1, 0, 3) * 5;
	const seed = o.text('seed', 'window');
	const W = SHOP_WINDOW;
	// the lettering: the lockup stacked, white on clear, at the vinyl's true size
	const lx = 1.4;
	const lw = Math.round(W.lettering * lx);
	const lh = Math.round(W.lettering * 0.75 * lx);
	const ls = svgScene({ width: lw, height: lh, key: `decal:${seed}` });
	ls.add(lockupIn(ls, { mark: art, name, ink: '#ffffff', size: lh * 0.62, layout: 'stack', x: 0, y: 0, width: lw, height: lh, weight: 600 }));
	const letters = await drawSvg(ls.svg(), lw, lh);
	const front = svgScene({ width: 2048, height: 1400, key: `front:${seed}` });
	front.add(wallLayer(front, wall, { width: 2048, height: 1400, mm: 2048 / 6000, light: 0.4, seed }));
	const brick = await drawSvg(front.svg(), 2048, 1400);
	const shot = {
		...shotOf(o, { ground: '#000000', light: 0, layout: 'upright', fit: 0.98, view: { tilt: 2, turn: 26, fov: 30 } }),
		lighting: /** @type {const} */ ('none'),
		toneMapping: /** @type {const} */ ('aces'),
		lens: lensOf(o, { aperture: 0.04, blur: 0.5, samples: 40 }),
	};

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
		const u = 1 / 100;
		const panorama = streetCanvas(null, { time, seed });
		acrossTheRoad(panorama, { time, seed });
		const street = keep(new THREE.CanvasTexture(panorama));
		street.mapping = THREE.EquirectangularReflectionMapping;
		street.colorSpace = THREE.SRGBColorSpace;
		scene.environment = street;
		scene.background = street;
		const cy = W.sill + W.pane[1] / 2;
		const [pw, ph] = W.pane;
		const F = W.frame;

		// the front: brick, with the window's opening
		const brickMap = keep(new THREE.CanvasTexture(brick));
		brickMap.colorSpace = THREE.SRGBColorSpace;
		const brickMat = new THREE.MeshStandardMaterial({ map: brickMap, bumpMap: brickMap, bumpScale: 1.5, roughness: 0.9 });
		const openW = pw + 2 * F;
		const openH = ph + 2 * F;
		const [fw, fh] = [6000, 4100];
		const wallShape = new THREE.Shape();
		wallShape.moveTo(-fw / 2, 0).lineTo(fw / 2, 0).lineTo(fw / 2, fh).lineTo(-fw / 2, fh).lineTo(-fw / 2, 0);
		wallShape.holes.push(new THREE.Path().moveTo(-openW / 2, W.sill - F).lineTo(-openW / 2, W.sill - F + openH).lineTo(openW / 2, W.sill - F + openH).lineTo(openW / 2, W.sill - F).lineTo(-openW / 2, W.sill - F));
		const wallGeo = new THREE.ShapeGeometry(wallShape);
		const uv = wallGeo.attributes.uv;
		const pos = wallGeo.attributes.position;
		for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / fw + 0.5, pos.getY(i) / fh);
		wallGeo.scale(u, u, u);
		const front = new THREE.Mesh(wallGeo, brickMat);
		front.position.z = W.depth * u;
		front.receiveShadow = true;
		scene.add(front);
		// the stallriser under the window, painted with the joinery
		const paint = new THREE.MeshPhysicalMaterial({ color: joinery, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 });
		const riser = new THREE.Mesh(new RoundedBoxGeometry(openW * u, (W.sill - F) * u, 60 * u, 3, 8 * u), paint);
		riser.position.set(0, ((W.sill - F) / 2) * u, (W.depth + 10) * u);
		scene.add(riser);

		// the frame: four rounded rails, a moulded sill
		for (const [w, h, x, y] of [
			[openW, F, 0, W.sill - F / 2],
			[openW, F, 0, W.sill + ph + F / 2],
			[F, ph, -pw / 2 - F / 2, cy],
			[F, ph, pw / 2 + F / 2, cy],
		]) {
			const rail = new THREE.Mesh(new RoundedBoxGeometry(w * u, h * u, W.depth * u, 4, 12 * u), paint);
			rail.position.set(x * u, y * u, (W.depth / 2) * u);
			rail.castShadow = rail.receiveShadow = true;
			scene.add(rail);
		}
		const sill = new THREE.Mesh(new RoundedBoxGeometry((openW + 120) * u, 50 * u, (W.depth + 90) * u, 4, 14 * u), paint);
		sill.position.set(0, (W.sill - F - 25) * u, (W.depth / 2 + 45) * u);
		scene.add(sill);

		// the glass: clear, adding only its reflection over the room behind (the street, by Fresnel, as bright as daylight is next to a dim room)
		const glass = new THREE.Mesh(new THREE.PlaneGeometry(pw * u, ph * u), new THREE.MeshPhysicalMaterial({ color: '#000000', roughness: 0.02, ior: 1.52, specularIntensity: 1, envMap: street, envMapIntensity: glare, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
		const gz = (W.depth * 0.45) * u;
		glass.position.set(0, cy * u, gz);
		scene.add(glass);

		// the lettering: on the glass's outer face
		const alpha = keep(new THREE.CanvasTexture(letters));
		const decalMat = gilt
			? new THREE.MeshPhysicalMaterial({ color: vinyl, metalness: 1, roughness: 0.14, alphaMap: alpha, alphaTest: 0.5, envMap: street, envMapIntensity: 2.2 })
			: new THREE.MeshStandardMaterial({ color: vinyl, roughness: 0.55, alphaMap: alpha, alphaTest: 0.5 });
		const decal = new THREE.Mesh(new THREE.PlaneGeometry(W.lettering * u, W.lettering * 0.75 * u), decalMat);
		decal.position.set(0, (cy + 60) * u, gz + 0.8 * u);
		scene.add(decal);

		scene.add(interior(THREE, { width: pw, height: ph + W.sill + 900, seed, u }));
		// daylight: the sky over the street, the sun raking the front from the left
		const sun = new THREE.DirectionalLight('#fff4e2', time === 'dusk' ? 0.4 : 1.6);
		sun.position.set(-4, 5, 4);
		sun.castShadow = true;
		sun.shadow.mapSize.set(2048, 2048);
		sun.shadow.camera.left = sun.shadow.camera.bottom = -30;
		sun.shadow.camera.right = sun.shadow.camera.top = 30;
		sun.shadow.radius = 4;
		sun.shadow.bias = -0.0005;
		scene.add(sun, new THREE.HemisphereLight('#cfe0f2', '#6b5f55', 0.5));
		return { width: openW * 0.92 * u, height: openH * 0.92 * u, center: [0, cy * u, gz], focus: [0, (cy + 60) * u, gz] };
	});
}

/**
 * A dim café behind the glass: dark walls, a counter, shelves, and pendant lamps glowing warm, all far enough back to fall out of focus.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {{ width: number, height: number, seed: string, u: number }} o The room's width and height (mm), the seed, and scene units per mm.
 * @returns {import('three').Group} The room, behind z = 0.
 */
function interior(THREE, { width, height, seed, u }) {
	const room = new THREE.Group();
	const r = rng(`${seed}:cafe`);
	const D = 4200;
	const W = width + 2600;
	const dark = new THREE.MeshStandardMaterial({ color: '#241d18', roughness: 0.9, side: THREE.BackSide });
	const box = new THREE.Mesh(new THREE.BoxGeometry(W * u, height * u, D * u), dark);
	box.position.set(0, (height / 2) * u, (-D / 2) * u);
	room.add(box);
	const wood = new THREE.MeshStandardMaterial({ color: '#5a3d28', roughness: 0.6 });
	const counter = new THREE.Mesh(new THREE.BoxGeometry(2600 * u, 1000 * u, 600 * u), wood);
	counter.position.set(-400 * u, 500 * u, -3000 * u);
	room.add(counter);
	// shelves of bottles and jars on the back wall
	for (let s = 0; s < 3; s++) {
		const y = 1500 + s * 380;
		const shelf = new THREE.Mesh(new THREE.BoxGeometry(2400 * u, 30 * u, 220 * u), wood);
		shelf.position.set(-400 * u, y * u, -4050 * u);
		room.add(shelf);
		for (let x = -1500; x < 700; x += r.range(90, 160)) {
			const h = r.range(140, 300);
			const jar = new THREE.Mesh(new THREE.CylinderGeometry(r.range(30, 45) * u, r.range(30, 45) * u, h * u, 12), new THREE.MeshStandardMaterial({ color: mix('#2d4a3a', '#c8a46a', r.next()), roughness: 0.3 }));
			jar.position.set(x * u, (y + 15 + h / 2) * u, -4050 * u);
			room.add(jar);
		}
	}
	// pendant lamps: warm globes on cords, and their light
	for (const [x, z] of [[-900, -1400], [300, -2200], [1200, -1200]]) {
		const y = height - 700;
		const bulb = new THREE.Mesh(new THREE.SphereGeometry(110 * u, 20, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0').multiplyScalar(2.2) }));
		bulb.position.set(x * u, y * u, z * u);
		const cord = new THREE.Mesh(new THREE.CylinderGeometry(3 * u, 3 * u, 700 * u, 6), new THREE.MeshBasicMaterial({ color: '#111' }));
		cord.position.set(x * u, (y + 400) * u, z * u);
		const light = new THREE.PointLight('#ffc98a', 1.2, 0, 2);
		light.position.copy(bulb.position);
		room.add(bulb, cord, light);
	}
	// tables near the window
	for (const x of [-700, 700]) {
		const top = new THREE.Mesh(new THREE.CylinderGeometry(330 * u, 330 * u, 30 * u, 24), wood);
		top.position.set(x * u, 750 * u, -700 * u);
		room.add(top);
	}
	return room;
}

/**
 * The terrace across the road, painted into the street where the window looks (behind the camera and to its left):
 * a sunlit stone front, rows of tall sash windows with their frames and sills, cornices, shopfronts at street level.
 *
 * @param {HTMLCanvasElement} c The street panorama (painted over).
 * @param {{ time: keyof typeof STREET_TIMES, seed: string }} o The time of day and the seed.
 */
function acrossTheRoad(c, { time, seed }) {
	const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
	const W = c.width;
	const H = c.height;
	const t = STREET_TIMES[time];
	const r = rng(`${seed}:terrace`);
	const stone = mix(t.lit, '#e9dfcc', time === 'dusk' ? 0.1 : 0.45);
	const y0 = H * 0.5 + H * 0.04;
	let x = W * 0.66;
	while (x < W * 1.0) {
		const w = r.range(W * 0.045, W * 0.075);
		const top = H * 0.5 - r.range(H * 0.1, H * 0.15);
		const face = mix(stone, r.next() > 0.5 ? '#ffffff' : '#8a7a66', r.range(0, 0.25));
		g.fillStyle = face;
		g.fillRect(x, top, w + 1, y0 - top);
		// the cornice, and its shadow
		g.fillStyle = mix(face, '#000000', 0.35);
		g.fillRect(x, top + H * 0.006, w + 1, H * 0.004);
		// the windows: tall, dark glass in white frames, a sill under each
		const cols = Math.max(2, Math.round(w / (W * 0.016)));
		const rows = Math.max(2, Math.round((y0 - top - H * 0.035) / (H * 0.03)));
		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				const wx = x + ((i + 0.28) * w) / cols;
				const wy = top + H * 0.016 + j * H * 0.03;
				const ww = (w / cols) * 0.44;
				g.fillStyle = '#f2efe8';
				g.fillRect(wx - 1.5, wy - 1.5, ww + 3, H * 0.018 + 3);
				g.fillStyle = r.next() > 0.8 ? '#6b7a88' : '#2a3038';
				g.fillRect(wx, wy, ww, H * 0.018);
				g.fillStyle = mix(face, '#ffffff', 0.4);
				g.fillRect(wx - 2, wy + H * 0.018 + 2, ww + 4, 2);
			}
		}
		// the shopfront at street level: a dark fascia and glass
		g.fillStyle = mix('#1f2a2a', '#5a2a22', r.next());
		g.fillRect(x + w * 0.04, y0 - H * 0.03, w * 0.92, H * 0.008);
		g.fillStyle = '#1c2026';
		g.fillRect(x + w * 0.06, y0 - H * 0.021, w * 0.88, H * 0.02);
		x += w;
	}
}
