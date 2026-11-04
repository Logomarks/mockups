/**
 * @module @arraypress/mockups/materials/skin
 *
 * Skin: the tones, and how a form made of skin is lit. A form is a height
 * field in millimetres (a finger a flattened round, the palm a low dome);
 * it's lit in JS into three soft maps laid over the flat skin colour: the
 * form shadow and the occlusion where one form tucks under another (in a
 * warm shadow colour, never grey), the warm reddish terminator where the
 * skin turns away and light scatters under it, and a broad satin sheen
 * (diffuse light plus a wide, faint specular). Then a very fine texture.
 * No outlines: an edge is only where the form turns away.
 */

import { el } from '../render/svg.js';
import { speckTile } from './desk.js';
import { blur, field, greyPng } from '../util/field.js';
import { isHex, mix } from '../util/color.js';
import { clamp } from '../util/num.js';

/** The named tones. */
export const SKINS = Object.freeze({
	porcelain: '#f0d2c0',
	light: '#e3b99c',
	medium: '#c99570',
	tan: '#a8724c',
	brown: '#7e4e31',
	deep: '#56321e',
});

/**
 * A skin tone and its shading colours.
 *
 * @param {import('./skin.js').SkinOption | undefined} v A named tone or a hex colour (`'medium'`).
 * @param {string} [object='hand'] The object, for the error.
 * @returns {import('./skin.js').Skin} The palette.
 * @throws {TypeError} For anything else.
 */
export function resolveSkin(v = 'medium', object = 'hand') {
	const base = Object.hasOwn(SKINS, v) ? SKINS[/** @type {keyof typeof SKINS} */ (v)] : isHex(v) ? v : null;
	if (!base) throw new TypeError(`${object}: skin is ${Object.keys(SKINS).map((k) => `'${k}'`).join(', ')} or a hex colour (got ${JSON.stringify(v)})`);
	return {
		base,
		shade: mix(base, '#4a1c10', 0.48),
		light: mix(base, '#fff6ef', 0.35),
		rim: mix(base, '#b8402a', 0.42),
		nail: mix(base, '#f1d9d2', 0.32),
		crease: mix(base, '#3a140a', 0.5),
	};
}

/**
 * A height field lit as skin: three maps as PNG `data:` URIs, each grey-and-alpha (alpha is the amount).
 *
 * @param {import('../util/field.js').Field} f Heights in mm, 0 outside the form.
 * @param {number} cell The cell's size in mm.
 * @param {{ x: number, y: number }} lit The direction to the light in the field's frame (y down the frame).
 * @returns {{ shade: string, rim: string, sheen: string }} The form shadow and occlusion, the warm terminator, the sheen.
 */
export function skinMaps(f, cell, lit) {
	const { w, h, v } = f;
	// occlusion: how far a cell sits below the blurred heights round it (a finger tucked under another, a crease)
	const soft = blur(Object.assign(field(w, h), { v: Float32Array.from(v) }), Math.max(1, Math.round(2.2 / cell)));
	const L = norm([lit.x * 0.62, lit.y * 0.62, 0.78]);
	const H = norm([L[0], L[1], L[2] + 1]);
	const flat = L[2];
	const at = (x, y) => v[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)];
	const shade = new Float32Array(w * h);
	const rim = new Float32Array(w * h);
	const sheen = new Float32Array(w * h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			if (v[i] <= 0) continue;
			const gx = (at(x + 1, y) - at(x - 1, y)) / (2 * cell);
			const gy = (at(x, y + 1) - at(x, y - 1)) / (2 * cell);
			const N = norm([-gx, -gy, 1]);
			const lambert = N[0] * L[0] + N[1] * L[1] + N[2] * L[2];
			const turn = 1 - N[2]; // 0 facing the camera, 1 edge-on
			const ao = clamp((soft.v[i] - v[i]) / 3.2);
			shade[i] = clamp(Math.max(0, flat - lambert) * 0.95 + ao * 0.8 + turn * turn * 0.35);
			rim[i] = clamp(Math.pow(turn, 1.6) * 0.55 * (0.6 + 0.4 * Math.max(0, flat - lambert)));
			const spec = Math.pow(Math.max(0, N[0] * H[0] + N[1] * H[1] + N[2] * H[2]), 14);
			sheen[i] = clamp(Math.max(0, lambert - flat) * 0.55 + spec * 0.16 * (1 - ao));
		}
	}
	// carry the edge's values a few cells past it, so the shapes' smooth outlines never meet the field's stepped one
	for (const a of [shade, rim, sheen]) {
		grow(a, v, w, h, 4);
		// and soften the steps the grid leaves along the edge
		blur({ w, h, v: a }, 1);
	}
	const png = (a) => greyPng(w, h, (x, y) => [1, a[y * w + x]]);
	return { shade: png(shade), rim: png(rim), sheen: png(sheen) };
}

/**
 * Skin over shapes, lit from a height field: the flat colour, the fine texture, then the shadow, the warm terminator and the sheen, all cut to the shapes.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The skin.
 * @param {string[]} o.shapes The outlines (path data, mm), drawn as one form.
 * @param {import('../util/field.js').Field} o.field Their heights.
 * @param {{ x: number, y: number, cell: number }} o.box Where the field's top-left cell is, and its cell size, in mm.
 * @param {import('./skin.js').Skin} o.skin The skin.
 * @param {{ x: number, y: number }} o.lit The direction to the light.
 * @param {string} [o.extra] Markup to draw over the skin inside the shapes, under the sheen (creases).
 * @returns {string} The markup.
 */
export function skinLayers(sc, { shapes, field: f, box, skin, lit, extra = '' }) {
	const maps = skinMaps(f, box.cell, lit);
	const area = { x: box.x - box.cell / 2, y: box.y - box.cell / 2, width: f.w * box.cell, height: f.h * box.cell };
	// cut to the shapes' union: a mask, since a clip path's overlapping children don't always add up (librsvg)
	const cut = sc.id('skin');
	sc.def(el('mask', { id: cut, maskUnits: 'userSpaceOnUse', ...area }, ...shapes.map((d) => el('path', { d, fill: '#fff' }))));
	// a map as a mask over a colour: the colour where the map says, as much as it says
	const tint = (href, color, opacity = 1) => {
		const m = sc.id('skinmask');
		sc.def(el('mask', { id: m, maskUnits: 'userSpaceOnUse', ...area }, el('image', { ...area, href, preserveAspectRatio: 'none' })));
		return el('rect', { ...area, fill: color, mask: `url(#${m})`, opacity });
	};
	return el(
		'g',
		{},
		...shapes.map((d) => el('path', { d, fill: skin.base })),
		el(
			'g',
			{ mask: `url(#${cut})` },
			el('rect', { ...area, fill: texture(sc), opacity: 0.55 }),
			tint(maps.rim, skin.rim, 0.85),
			tint(maps.shade, skin.shade),
			extra,
			tint(maps.sheen, skin.light),
		),
	);
}

/**
 * Skin's very fine texture: a seamless tile of soft specks, in millimetres.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @returns {string} A `url(#…)` fill.
 */
export function texture(sc) {
	return speckTile(sc, { size: 16, freq: [3.2, 3.2], octaves: 1, dark: 0.03, light: 0.025, seed: 7 });
}

/**
 * Spreads a map's values outwards from the form into the empty cells round it, a cell per pass.
 *
 * @param {Float32Array} a The map.
 * @param {Float32Array} v The heights (0 outside the form).
 * @param {number} w The width.
 * @param {number} h The height.
 * @param {number} passes How many cells to spread.
 */
function grow(a, v, w, h, passes) {
	const filled = Uint8Array.from(v, (x) => (x > 0 ? 1 : 0));
	for (let p = 0; p < passes; p++) {
		const next = Uint8Array.from(filled);
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const i = y * w + x;
				if (filled[i]) continue;
				let sum = 0;
				let k = 0;
				for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
					const X = x + dx;
					const Y = y + dy;
					if (X < 0 || Y < 0 || X >= w || Y >= h || !filled[Y * w + X]) continue;
					sum += a[Y * w + X];
					k++;
				}
				if (k) {
					a[i] = sum / k;
					next[i] = 1;
				}
			}
		}
		filled.set(next);
	}
}

/**
 * A 3-vector made unit length.
 *
 * @param {[number, number, number]} a The vector.
 * @returns {[number, number, number]} It, unit length.
 */
function norm(a) {
	const l = Math.hypot(a[0], a[1], a[2]) || 1;
	return [a[0] / l, a[1] / l, a[2] / l];
}
