/**
 * @module @arraypress/mockups/three/studioenv
 *
 * A photo studio for glossy things to reflect, painted as an
 * equirectangular image: a dim room, a large soft key box in front on the
 * light's side, a tall strip light on the other side, and a soft overhead.
 * Glaze and gloss stock pick up those shapes as the long highlights a
 * product photo has; three.js prefilters it like any environment.
 */

import { canvas2d } from '../render/image.js';
import { clamp } from '../util/num.js';

/**
 * Where a soft box goes on the panorama, from where the light is.
 *
 * @param {number} light Where the light is, left (-1) to right (1).
 * @returns {{ u: number, v: number, w: number, h: number, power: number }[]} Each box's centre (u round from -x, v up from the floor), size, and brightness (0–1).
 */
export function softboxes(light) {
	const s = Math.sign(clamp(light, -1, 1)) || 1;
	// three's equirect: u = 0.75 looks towards the camera (+z), u = 0.5 to the right (+x)
	return [
		{ u: 0.75 - 0.1 * s, v: 0.64, w: 0.1, h: 0.28, power: 1 },
		{ u: 0.75 + 0.2 * s, v: 0.58, w: 0.035, h: 0.42, power: 0.75 },
		{ u: 0.5, v: 0.97, w: 1, h: 0.12, power: 0.35 },
	];
}

/**
 * The studio as an environment texture.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {{ light: number, size?: number }} o Where the light is, and the panorama's width (1024).
 * @returns {import('three').CanvasTexture} An equirectangular texture, for `scene.environment`.
 */
export function studioEnvironment(THREE, { light, size = 1024 }) {
	const W = size;
	const H = size / 2;
	const [c, g] = canvas2d(W, H);
	const room = g.createLinearGradient(0, 0, 0, H);
	room.addColorStop(0, '#5a5a5a');
	room.addColorStop(0.5, '#2e2e2e');
	room.addColorStop(1, '#202020');
	g.fillStyle = room;
	g.fillRect(0, 0, W, H);
	for (const b of softboxes(light)) {
		const x = b.u * W;
		const y = (1 - b.v) * H;
		const w = b.w * W;
		const h = b.h * H;
		const v = Math.round(255 * b.power);
		g.filter = `blur(${Math.max(2, w * 0.08)}px)`;
		g.fillStyle = `rgb(${v},${v},${v})`;
		g.fillRect(x - w / 2, y - h / 2, w, h);
		if (x - w / 2 < 0) g.fillRect(x - w / 2 + W, y - h / 2, w, h);
		if (x + w / 2 > W) g.fillRect(x - w / 2 - W, y - h / 2, w, h);
	}
	g.filter = 'none';
	const t = new THREE.CanvasTexture(c);
	t.mapping = THREE.EquirectangularReflectionMapping;
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}
