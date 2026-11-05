/**
 * @module @logomarks/mockups/three/printart
 *
 * Print artwork as canvases for the 3D print scenes, drawn by the 2D
 * modules so the two versions match: a print file trimmed of its bleed, art
 * laid on a printed panel (filling it, or set in its middle on the board's
 * colour), and an artwork's own proportions. Browser only.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { artHref } from '../render/art.js';
import { svgImage, canvas2d } from '../render/image.js';
import { trimmed } from '../parts/print.js';

/**
 * SVG markup drawn onto a new canvas.
 *
 * @param {string} svg The markup.
 * @param {number} w The canvas's width.
 * @param {number} h The canvas's height.
 * @returns {Promise<HTMLCanvasElement>} The canvas.
 */
export async function drawSvg(svg, w, h) {
	const img = await svgImage(svg);
	const [c, g] = canvas2d(w, h);
	g.drawImage(img, 0, 0, w, h);
	return c;
}

/**
 * A print file trimmed of its bleed, filling a canvas of the trim's proportions.
 *
 * @param {import('../types.js').Art} art The print file (inline).
 * @param {object} o The print.
 * @param {[number, number]} o.trim The finished size, in mm.
 * @param {number} [o.bleed=0] The bleed it carries on each side, in mm.
 * @param {number} [o.px=20] Pixels per mm.
 * @returns {Promise<HTMLCanvasElement>} The canvas.
 */
export function trimCanvas(art, { trim, bleed = 0, px = 20 }) {
	const w = Math.round(trim[0] * px);
	const h = Math.round(trim[1] * px);
	const sc = scene({ width: w, height: h, key: 'trim' });
	sc.add(trimmed(sc, art, { trim, bleed })(0, 0, w, h));
	return drawSvg(sc.svg(), w, h);
}

/**
 * A printed panel: the board's colour, the art filling it (`'cover'`), whole and centred inside a margin (`'contain'`), or set in its middle (`'logo'`, a share of its smaller side).
 *
 * @param {import('../types.js').Art} art The art (inline).
 * @param {object} o The panel.
 * @param {[number, number]} o.size The panel's size, in mm.
 * @param {string | null} o.color The board's colour, under the art (`null` leaves it clear, for the board to be drawn under it).
 * @param {'cover' | 'contain' | 'logo'} [o.fit='cover'] How the art sits.
 * @param {number} [o.scale=0.5] For `'logo'`: the art's size, as a share of the panel's smaller side.
 * @param {number} [o.aspect=1] The art's own width over height.
 * @param {number} [o.px=8] Pixels per mm.
 * @returns {Promise<HTMLCanvasElement>} The canvas.
 */
export function panelCanvas(art, { size, color, fit = 'cover', scale = 0.5, aspect = 1, px = 8 }) {
	const w = Math.round(size[0] * px);
	const h = Math.round(size[1] * px);
	const sc = scene({ width: w, height: h, key: 'panel' });
	if (color) sc.add(el('rect', { width: w, height: h, fill: color }));
	if (fit === 'cover') sc.add(sc.image(art, w / h)(0, 0, w, h));
	else if (fit === 'contain') {
		const pad = Math.min(w, h) * 0.1;
		const [bw, bh] = [w - 2 * pad, h - 2 * pad];
		const [aw, ah] = aspect >= bw / bh ? [bw, bw / aspect] : [bh * aspect, bh];
		sc.add(sc.image(art, aspect)((w - aw) / 2, (h - ah) / 2, aw, ah));
	} else {
		const s = Math.min(w, h) * scale;
		const aw = aspect >= 1 ? s : s * aspect;
		const ah = aspect >= 1 ? s / aspect : s;
		sc.add(sc.image(art, aspect)((w - aw) / 2, (h - ah) / 2, aw, ah));
	}
	return drawSvg(sc.svg(), w, h);
}

/**
 * An artwork's own proportions, decoded.
 *
 * @param {import('../types.js').Art} art The art (inline).
 * @returns {Promise<number>} Its width over its height (1 when it has no size of its own).
 */
export async function artAspect(art) {
	const img = new Image();
	img.src = artHref(art);
	await img.decode();
	return img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
}
