/**
 * @module @logomarks/mockups/three/textures
 *
 * The 3D scene's textures, drawn the same way as the 2D mockup so the two
 * match: the cover, each label (the 2D label part, rendered from SVG), a
 * splatter or marble body, and the grooves as maps for a physical
 * material: a normal map of fine rings, a roughness map (the gaps between
 * tracks and the run-out are glossier), an anisotropy map that runs the
 * highlight along the grooves (so it streaks across them, as on a real
 * record), a shadow mask (a clear record's rim and label stop light; the
 * rest lets it through), and the soft contact shadows on the ground, drawn
 * by the 2D shadow code.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { svgImage, canvas2d } from '../render/image.js';
import { label } from '../parts/label.js';
import { body } from '../materials/vinyl.js';
import { trackStops, RADII } from '../materials/surface.js';
import { mix } from '../util/color.js';
import { castShadow } from '../materials/shadow.js';
import { silhouette } from '../parts/record.js';

/**
 * A canvas as a colour texture.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {HTMLCanvasElement} c The canvas.
 * @param {boolean} [srgb=true] Whether it holds colour (sRGB) rather than data.
 * @returns {import('three').CanvasTexture} The texture.
 */
export function texture(THREE, c, srgb = true) {
	const t = new THREE.CanvasTexture(c);
	if (srgb) t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}

/**
 * SVG drawn at a size onto a new canvas.
 *
 * @param {string} svg The markup.
 * @param {number} size The canvas's side.
 * @returns {Promise<HTMLCanvasElement>} The canvas.
 */
async function draw(svg, size) {
	const img = await svgImage(svg);
	const [c, g] = canvas2d(size, size);
	g.drawImage(img, 0, 0, size, size);
	return c;
}

/**
 * The cover, as a square canvas.
 *
 * @param {import('../types.js').Art} art The artwork (inline).
 * @param {number} [size=2048] The canvas's side.
 * @returns {Promise<HTMLCanvasElement>} The canvas.
 */
export function coverCanvas(art, size = 2048) {
	const sc = scene({ width: size, height: size, art, key: 'cover' });
	sc.add(sc.useArt(0, 0, size, size));
	return draw(sc.svg(), size);
}

/**
 * A label, drawn by the 2D label part.
 *
 * @param {import('../types.js').Art} art The cover (for crops and blurs).
 * @param {import('../parts/label.js').Label} lb The label.
 * @param {number} [size=1024] The canvas's side.
 * @returns {Promise<HTMLCanvasElement>} The canvas.
 */
export function labelCanvas(art, lb, size = 1024) {
	const sc = scene({ width: size, height: size, art, key: 'label' });
	sc.add(el('g', { transform: `translate(${size / 2} ${size / 2})` }, label(sc, lb, size / 2)));
	return draw(sc.svg(), size);
}

/**
 * A splatter or marble body, drawn by the 2D material, filling the canvas; and for a splatter on translucent vinyl, where light passes (white) and where the splatter stops it (black), for the transmission.
 *
 * @param {import('../types.js').Art} art Any artwork (the document needs one).
 * @param {import('../materials/vinyl.js').Material} m The material.
 * @param {string} seed The seed.
 * @param {number} [size=1024] The canvases' side.
 * @returns {Promise<{ color: HTMLCanvasElement, mask: HTMLCanvasElement | null }>} The colours, and the transmission mask.
 */
export async function bodyCanvas(art, m, seed, size = 1024) {
	const paint = async (mat, ground) => {
		const sc = scene({ width: size, height: size, art, key: 'body' });
		sc.add(el('g', { transform: `translate(${size / 2} ${size / 2})` }, body(sc, mat, size / 2, seed, ground)));
		return draw(sc.svg(), size);
	};
	if (m.kind !== 'splatter' || !m.base) return { color: await paint(m, '#ffffff'), mask: null };
	// the base solid, in the colour light has through it (the material passes the light), the splatter over it
	const solid = (b) => ({ ...m, base: { ...b, kind: /** @type {'solid'} */ ('solid'), opacity: 1, colors: [], base: null } });
	const b = m.base;
	const color = await paint(solid({ ...b, color: b.opacity < 0.98 ? mix('#ffffff', b.color, b.kind === 'clear' ? 0.08 : b.opacity) : b.color }), '#ffffff');
	if (b.opacity >= 0.98) return { color, mask: null };
	const mask = await paint({ ...solid({ ...b, color: '#ffffff' }), colors: m.colors.map(() => '#000000') }, '#ffffff');
	return { color, mask };
}

/**
 * The groove maps for a record's face, on planar UVs (the face's centre at 0.5, 0.5).
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {string} seed The seed (the same tracks as the 2D record).
 * @param {number} [size=1024] The maps' side.
 * @param {{ label?: number, tracks?: [number, number] }} [o] The label's radius as a fraction of the record's, and how few and how many tracks a side has (a 12"'s).
 * @returns {{ normal: import('three').CanvasTexture, roughness: import('three').CanvasTexture, anisotropy: import('three').CanvasTexture, shadow: import('three').CanvasTexture }} The maps.
 */
export function grooveMaps(THREE, seed, size = 1024, { label = RADII.label, tracks } = {}) {
	const R = size / 2;
	// groove depth by radius, from the 2D tracks: 1 in a track, 0 in the gaps and the run-out
	const stops = trackStops(seed, false, 1, 400, { label, tracks });
	const depth = new Float32Array(R + 1);
	for (let i = 0; i <= R; i++) {
		const t = i / R;
		let k = 0;
		while (k < stops.length - 1 && stops[k + 1][0] < t) k++;
		const [o, c, a] = stops[k];
		depth[i] = t < o || t > RADII.leadIn ? 0 : c === '#000000' ? Math.min(1, a / 0.02) : 0;
	}
	const maps = ['normal', 'roughness', 'anisotropy', 'shadow'].map(() => canvas2d(size, size));
	const data = maps.map(([, g]) => g.createImageData(size, size));
	// fine enough to read as grooves, coarse enough that the map's mips don't alias into moiré
	const period = R / 64;
	for (let y = 0; y < size; y++)
		for (let x = 0; x < size; x++) {
			const dx = x + 0.5 - R;
			const dy = y + 0.5 - R;
			const r = Math.hypot(dx, dy);
			const o = (y * size + x) * 4;
			const d = depth[Math.min(R, Math.round(r))];
			// fine rings: the height's slope across the radius tilts the normal in and out
			const slope = d * 0.35 * Math.cos((2 * Math.PI * r) / period) * (0.7 + 0.3 * Math.sin(r * 0.37));
			const ux = r ? dx / r : 0;
			const uy = r ? dy / r : 0;
			const nl = Math.hypot(slope, 1);
			const set = (m, v0, v1, v2) => {
				data[m].data[o] = v0;
				data[m].data[o + 1] = v1;
				data[m].data[o + 2] = v2;
				data[m].data[o + 3] = 255;
			};
			set(0, ((-slope * ux) / nl) * 127.5 + 127.5, ((slope * uy) / nl) * 127.5 + 127.5, 255 / nl);
			const rough = 140 + 115 * d;
			set(1, rough, rough, rough);
			// along the groove: the tangent (-y, x), in the face's UV space (v runs up)
			set(2, -uy * 127.5 + 127.5, -ux * 127.5 + 127.5, 60 + 195 * d);
			const t = r / R;
			const solid = t < label || t > 0.955 ? 255 : 0;
			set(3, solid, solid, solid);
		}
	maps.forEach(([, g], i) => g.putImageData(data[i], 0, 0));
	const [normal, roughness, anisotropy, shadow] = maps.map(([c]) => texture(THREE, c, false));
	return { normal, roughness, anisotropy, shadow };
}

/**
 * The soft shadows round everything on the ground, drawn by the 2D shadow code onto a transparent canvas.
 *
 * @param {import('../types.js').Art} art Any artwork (the document needs one).
 * @param {object} o What's lying there.
 * @param {number} o.width The canvas's area, sleeve units across.
 * @param {number} o.depth The canvas's area, sleeve units deep.
 * @param {number} o.cx Where the sleeve's centre is, across.
 * @param {{ x: number, r: number, opacity: number }[]} o.records Each record's centre, radius and opacity.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} [o.strength=1] How dark.
 * @param {number} [scale=400] Pixels per sleeve unit.
 * @returns {Promise<HTMLCanvasElement>} The canvas: black, its alpha the shadow.
 */
export async function shadowCanvas(art, { width, depth, cx, records, light, strength = 1 }, scale = 400) {
	const W = Math.round(width * scale);
	const H = Math.round(depth * scale);
	const sc = scene({ width: W, height: H, art, key: 'shadow' });
	const u = scale;
	const at = (x) => W / 2 + x * u;
	const shine = { x: light, strength, unit: u };
	for (const r of records) {
		sc.add(castShadow(sc, shine, { shape: (fill) => silhouette(at(r.x), H / 2, r.r * u, r.opacity, fill), foot: null }));
	}
	sc.add(castShadow(sc, shine, { shape: (fill) => el('rect', { x: at(cx) - u / 2, y: H / 2 - u / 2, width: u, height: u, fill }), foot: null }));
	const img = await svgImage(sc.svg());
	const [c, g] = canvas2d(W, H);
	g.drawImage(img, 0, 0, W, H);
	return c;
}
