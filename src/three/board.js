/**
 * @module @logomarks/mockups/three/board
 *
 * Paper and board as physical materials: a stock's print surface (matte
 * paper is rough with a faint sheen, gloss has a clearcoat), the tooth of
 * the sheet as a fine bump map, a plain board in a colour, and the cut
 * edge of corrugated board (two liners and the fluted wave between).
 *
 * Packaging board is baked face by face: the kraft photograph (or the
 * board's colour with the photograph's grain over it), the print with the
 * grain over that too (ink sits in the fibres), occlusion where the face
 * meets its neighbours and the soft bend of a fold, at the face's real
 * size, with a seeded turn and offset per face. Its normal and roughness
 * come from the photograph's luminance, so it's matte and toothy, not
 * plastic. Without the photographs (they're fetched beside the package),
 * the grain is the procedural fibre.
 */

import { canvas2d } from '../render/image.js';
import { rng, hash } from '../util/rng.js';
import { mix } from '../util/color.js';
import { clamp } from '../util/num.js';
import { fibreField } from '../materials/board.js';
import { KRAFT_COUNT, KRAFT_SPAN, KRAFT_MEAN, kraftUrl } from '../materials/textures.js';

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
export function shadeMap(THREE, o, size = 256) {
	const t = new THREE.CanvasTexture(shadeCanvas(o, size));
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

/**
 * Baked ambient darkening as a canvas: grey, white where nothing gathers (to multiply a face by).
 *
 * @param {{ sides?: number, bottom?: number, top?: number, reach?: number }} o How dark each edge gets and how far in it reaches (see `shadeMap`).
 * @param {number} [size=256] The canvas's side.
 * @returns {HTMLCanvasElement} The canvas (v up: its bottom row is the face's bottom edge).
 */
export function shadeCanvas({ sides = 0, bottom = 0, top = 0, reach = 0.16 }, size = 256) {
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
	return c;
}

/** @type {Promise<ImageBitmap[]> | null} */
let photos = null;

/**
 * The kraft photographs, fetched once (none when they can't be).
 *
 * @returns {Promise<ImageBitmap[]>} The variants.
 */
export function kraftPhotos() {
	photos ??= Promise.all(
		Array.from({ length: KRAFT_COUNT }, async (_, n) => {
			const r = await fetch(kraftUrl(n));
			if (!r.ok) throw new Error(String(r.status));
			return createImageBitmap(await r.blob());
		}),
	).catch(() => {
		photos = null;
		return [];
	});
	return photos;
}

/**
 * A photograph's luminance, read back from a canvas.
 *
 * @param {CanvasImageSource} img The photograph.
 * @param {number} size The side to read it at.
 * @returns {Float32Array} Luminance, 0–1, row by row.
 */
function luminance(img, size) {
	const [, g] = canvas2d(size, size);
	g.drawImage(img, 0, 0, size, size);
	const d = g.getImageData(0, 0, size, size).data;
	const out = new Float32Array(size * size);
	for (let i = 0; i < out.length; i++) out[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
	return out;
}

/**
 * Board grain as a canvas to lay over a colour (or a print): black where the source is darker than its mean, white where it's lighter.
 *
 * @param {Float32Array} lum The grain's source: luminance round `mean` (the photograph's), or a signed tone round 0.
 * @param {number} size Its side.
 * @param {number} mean What counts as no change.
 * @param {number} k How strongly the grain shows.
 * @returns {HTMLCanvasElement} The tile.
 */
function grainCanvas(lum, size, mean, k) {
	const [c, g] = canvas2d(size, size);
	const img = g.createImageData(size, size);
	for (let i = 0; i < lum.length; i++) {
		const t = (lum[i] - mean) * k;
		const v = t < 0 ? 0 : 255;
		img.data.set([v, v, v, Math.round(clamp(Math.abs(t), 0, 0.85) * 255)], i * 4);
	}
	g.putImageData(img, 0, 0);
	return c;
}

/**
 * A normal map from heights (wrapping, so it tiles), and a roughness map from the same: matte everywhere, a touch rougher in the hollows.
 *
 * @param {Float32Array} h Heights, 0–1-ish.
 * @param {number} size The side.
 * @param {number} strength How steep the heights read.
 * @returns {{ normal: HTMLCanvasElement, rough: HTMLCanvasElement }} The maps.
 */
function reliefCanvases(h, size, strength) {
	const [nc, ng] = canvas2d(size, size);
	const [rc, rg] = canvas2d(size, size);
	const ni = ng.createImageData(size, size);
	const ri = rg.createImageData(size, size);
	const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
	let mean = 0;
	for (const v of h) mean += v;
	mean /= h.length;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
			const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
			const l = Math.hypot(dx, dy, 1);
			const i = (y * size + x) * 4;
			ni.data.set([Math.round((-dx / l) * 127.5 + 127.5), Math.round((dy / l) * 127.5 + 127.5), Math.round((1 / l) * 127.5 + 127.5), 255], i);
			const r = Math.round(clamp(0.9 - (at(x, y) - mean) * 0.6, 0.78, 1) * 255);
			ri.data.set([r, r, r, 255], i);
		}
	}
	ng.putImageData(ni, 0, 0);
	rg.putImageData(ri, 0, 0);
	return { normal: nc, rough: rc };
}

/**
 * Everything a box's board needs, made once per scene: the photographs (or none), each one's grain over other colours, and the relief maps.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('../materials/board.js').FibreLook} look The board's fibre (for the procedural grain, without photographs).
 * @param {string} seed The seed.
 * @param {number} [strength=2.2] How strongly the photographs' grain shows over a colour or a print (kraft's own; less on white, where it would read as recycled board).
 * @returns {Promise<import('./board.js').BoardKit>} The kit.
 */
export async function boardKit(THREE, look, seed, strength = 2.2) {
	const list = await kraftPhotos();
	const size = 512;
	let grains;
	let span;
	let relief;
	if (list.length) {
		const lums = list.map((p) => luminance(p, size));
		grains = lums.map((l) => grainCanvas(l, size, KRAFT_MEAN, strength));
		span = KRAFT_SPAN;
		relief = reliefCanvases(lums[0], size, 9);
	} else {
		const f = fibreField(look, { seed, size, span: 40 });
		grains = [grainCanvas(f.tone.v, size, 0, 1)];
		span = 40;
		relief = reliefCanvases(f.height.v, size, 2);
	}
	const map = (c, srgb) => {
		const t = new THREE.CanvasTexture(c);
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		if (srgb) t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 8;
		return t;
	};
	return { photos: list, grains, span, normal: map(relief.normal, false), rough: map(relief.rough, false) };
}

/**
 * One face of board baked at its real size: the board, its print, the grain over both, occlusion and folds.
 *
 * @param {import('./board.js').BoardKit} kit The scene's board kit.
 * @param {import('./board.js').BakeOptions} o The face.
 * @returns {HTMLCanvasElement} The canvas (its top row is the face's top, v = 1).
 */
export function bakeBoard(kit, { size, color, kraft, seed, print = null, ao = null, folds = {}, px = 4 }) {
	const s = Math.min(px, 2048 / Math.max(size[0], size[1]));
	const [w, h] = print ? [print.width, print.height] : [Math.round(size[0] * s), Math.round(size[1] * s)];
	const k = w / size[0]; // pixels per mm
	const [c, g] = canvas2d(w, h);
	const r = rng(seed);
	const variant = hash(`${seed}:variant`);
	// a tile laid at the face's scale, turned a seeded quarter and offset
	const tile = (img) => {
		const p = /** @type {CanvasPattern} */ (g.createPattern(img, 'repeat'));
		const scale = (kit.span * k) / img.width;
		p.setTransform(new DOMMatrix().translate(r.next() * kit.span * k, r.next() * kit.span * k).rotate(Math.floor(r.next() * 4) * 90).scale(scale));
		return p;
	};
	g.fillStyle = color;
	g.fillRect(0, 0, w, h);
	const photo = kit.photos.length ? kit.photos[variant % kit.photos.length] : null;
	const grain = kit.grains[variant % kit.grains.length];
	if (kraft && photo) {
		g.fillStyle = tile(photo);
		g.fillRect(0, 0, w, h);
		// a kraft of another shade (a lining): the photograph tinted towards it
		g.globalAlpha = 0.35;
		g.fillStyle = color;
		g.fillRect(0, 0, w, h);
		g.globalAlpha = 1;
	} else {
		g.fillStyle = tile(grain);
		g.fillRect(0, 0, w, h);
	}
	if (print) {
		// ink on board: a little less saturated, its edges just soft, the grain over it
		g.filter = 'saturate(0.88) blur(0.4px)';
		g.drawImage(print, 0, 0, w, h);
		g.filter = 'none';
		g.globalAlpha = kraft ? 0.6 : 1;
		g.fillStyle = tile(grain);
		g.fillRect(0, 0, w, h);
		g.globalAlpha = 1;
	}
	if (ao) {
		g.globalCompositeOperation = 'multiply';
		g.drawImage(shadeCanvas(ao), 0, 0, w, h);
		g.globalCompositeOperation = 'source-over';
	}
	// a fold's rounded bend: a soft band along the edge, darker where it turns away
	for (const [side, alpha] of Object.entries(folds)) {
		const reach = 4 * k;
		const [x0, y0, x1, y1] = side === 'top' ? [0, 0, 0, reach] : side === 'bottom' ? [0, h, 0, h - reach] : side === 'left' ? [0, 0, reach, 0] : [w, 0, w - reach, 0];
		const grad = g.createLinearGradient(x0, y0, x1, y1);
		grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
		grad.addColorStop(1, 'rgba(0,0,0,0)');
		g.fillStyle = grad;
		g.fillRect(0, 0, w, h);
	}
	return c;
}

/**
 * A baked face of board as a material: matte (roughness from the grain, about 0.9), the grain's relief as a normal map, and a faint sheen at grazing angles.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('./board.js').BoardKit} kit The scene's board kit.
 * @param {HTMLCanvasElement} baked The baked face.
 * @param {[number, number]} size The face's size, mm (so the relief repeats at the grain's scale).
 * @param {string} color The board's colour (its sheen's tint).
 * @returns {import('three').MeshPhysicalMaterial} The material.
 */
export function bakedMaterial(THREE, kit, baked, size, color) {
	const map = new THREE.CanvasTexture(baked);
	map.colorSpace = THREE.SRGBColorSpace;
	map.anisotropy = 8;
	const repeat = (t) => {
		const r = t.clone();
		r.repeat.set(size[0] / kit.span, size[1] / kit.span);
		r.needsUpdate = true;
		return r;
	};
	return new THREE.MeshPhysicalMaterial({
		map,
		roughness: 1,
		roughnessMap: repeat(kit.rough),
		normalMap: repeat(kit.normal),
		normalScale: new THREE.Vector2(0.45, 0.45),
		metalness: 0,
		sheen: 0.25,
		sheenRoughness: 0.85,
		sheenColor: mix(color, '#ffffff', 0.6),
		envMapIntensity: 0.55,
	});
}
