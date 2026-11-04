/**
 * @module @arraypress/mockups/three/board
 *
 * Paper and board as physical materials: a stock's print surface (matte
 * paper is rough with a faint sheen, gloss has a clearcoat), the tooth of
 * the sheet as a fine bump map, a plain board in a colour, and the cut
 * edge of corrugated board (two liners and the fluted wave between).
 */

import { canvas2d } from '../render/image.js';
import { rng } from '../util/rng.js';
import { mix } from '../util/color.js';

/**
 * A canvas as a repeating data texture.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {HTMLCanvasElement} c The canvas.
 * @param {boolean} srgb Whether it holds colour.
 * @returns {import('three').CanvasTexture} The texture, wrapping both ways.
 */
function tile(THREE, c, srgb) {
	const t = new THREE.CanvasTexture(c);
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	if (srgb) t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}

/**
 * The tooth of a sheet: seeded fine noise, for a bump map.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {string} [seed='tooth'] The seed.
 * @param {number} [size=256] The tile's side.
 * @returns {import('three').CanvasTexture} The tile, repeating.
 */
export function toothMap(THREE, seed = 'tooth', size = 256) {
	const [c, g] = canvas2d(size, size);
	const img = g.createImageData(size, size);
	const r = rng(seed);
	for (let i = 0; i < size * size; i++) {
		const v = 128 + (r.next() + r.next() - 1) * 90;
		img.data.set([v, v, v, 255], i * 4);
	}
	g.putImageData(img, 0, 0);
	return tile(THREE, c, false);
}

/**
 * A printed paper or board surface.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('../materials/paper.js').Stock} stock The stock.
 * @param {import('three').Texture | null} map The print (or `null` for the stock's own colour).
 * @param {import('three').Texture | null} [tooth] The tooth (a bump map); its repeat is set by the caller.
 * @returns {import('three').MeshPhysicalMaterial} The material.
 */
export function stockMaterial(THREE, stock, map, tooth = null) {
	const gloss = Math.min(1, stock.sheen / 1.5);
	return new THREE.MeshPhysicalMaterial({
		map,
		color: map ? '#ffffff' : stock.color,
		roughness: 0.86 - 0.5 * gloss,
		clearcoat: gloss > 0.6 ? 0.32 : 0.04 + 0.1 * gloss,
		clearcoatRoughness: gloss > 0.6 ? 0.22 : 0.55,
		sheen: 0.25 * (1 - gloss),
		sheenRoughness: 0.8,
		sheenColor: '#ffffff',
		bumpMap: tooth,
		bumpScale: 0.25 * stock.tooth,
		envMapIntensity: 0.7,
	});
}

/**
 * A plain matte board in a colour.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {string} color Its colour.
 * @param {import('three').Texture | null} [map] What's printed on it.
 * @returns {import('three').MeshStandardMaterial} The material.
 */
export function boardMaterial(THREE, color, map = null) {
	return new THREE.MeshStandardMaterial({ color: map ? '#ffffff' : color, map, roughness: 0.88, metalness: 0, envMapIntensity: 0.5 });
}

/**
 * The cut edge of single-wall corrugated board: the liners top and bottom, the flute's wave between, its hollows in shadow. One tile is a few flutes; repeat it along the edge.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {string} color The board's colour (kraft, or the outer liner's white).
 * @param {string} [inner] The inner liner's colour (the board's).
 * @returns {import('three').CanvasTexture} The tile: u along the edge, v across the board's thickness.
 */
export function fluteMap(THREE, color, inner = color) {
	const W = 256;
	const H = 64;
	const [c, g] = canvas2d(W, H);
	const core = mix('#b8905f', color, 0.25);
	g.fillStyle = mix(core, '#000000', 0.55);
	g.fillRect(0, 0, W, H);
	// the wave: four flutes across the tile
	g.fillStyle = mix(core, '#000000', 0.08);
	g.strokeStyle = mix(core, '#ffffff', 0.12);
	g.lineWidth = 5;
	g.beginPath();
	for (let x = 0; x <= W; x += 2) {
		const y = H / 2 + Math.sin((x / W) * Math.PI * 8) * (H * 0.3);
		if (x === 0) g.moveTo(x, y);
		else g.lineTo(x, y);
	}
	g.stroke();
	g.fillStyle = color;
	g.fillRect(0, 0, W, H * 0.12);
	g.fillStyle = inner;
	g.fillRect(0, H * 0.88, W, H * 0.12);
	return tile(THREE, c, true);
}

/**
 * Baked ambient darkening for a face of a box, as a grey map to multiply its colour by: shadow gathering where it meets the faces beside it. A box face's UVs run 0–1 with v up its height, so `bottom` is where a wall meets the floor.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {object} o How dark each edge gets (0 none, 1 black) and how far in it reaches.
 * @param {number} [o.sides=0] At the left and right edges (u = 0 and 1).
 * @param {number} [o.bottom=0] At the bottom edge (v = 0).
 * @param {number} [o.top=0] At the top edge (v = 1).
 * @param {number} [o.reach=0.16] How far in it reaches, as a share of the face.
 * @param {number} [size=256] The map's side.
 * @returns {import('three').CanvasTexture} The map (sRGB grey, white where nothing gathers).
 */
export function shadeMap(THREE, { sides = 0, bottom = 0, top = 0, reach = 0.16 }, size = 256) {
	const [c, g] = canvas2d(size, size);
	const img = g.createImageData(size, size);
	// a soft falloff, steep right in the corner, as occlusion is
	const fall = (d) => Math.exp(-d / reach / 0.38);
	for (let y = 0; y < size; y++) {
		const v = 1 - (y + 0.5) / size;
		for (let x = 0; x < size; x++) {
			const u = (x + 0.5) / size;
			const occ = 1 - (1 - sides * fall(u)) * (1 - sides * fall(1 - u)) * (1 - bottom * fall(v)) * (1 - top * fall(1 - v));
			const k = Math.round(255 * (1 - occ));
			img.data.set([k, k, k, 255], (y * size + x) * 4);
		}
	}
	g.putImageData(img, 0, 0);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}
