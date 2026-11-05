/**
 * @module @logomarks/mockups/parts/cover
 *
 * A binder's or a book's printed cover and spine, composed from the
 * brand: the mark small at the top of the cover, a title and volume
 * across from it, a grid of dots down the middle, and the name set large
 * along the bottom; on the spine, the name running down it with the mark
 * at its foot. Drawn at true size in millimetres, the board's tooth over
 * the print.
 */

import { scene } from '../render/scene.js';
import { el, esc } from '../render/svg.js';
import { toothFill } from '../materials/paper.js';
import { FONT } from './screen/ui.js';
import { lockup, typeWidth } from './lockup.js';

/**
 * The volume's number as the cover and spine print it.
 *
 * @param {number} n The volume (from 1).
 * @returns {string} `'01'`, `'02'`, …
 */
export const volume = (n) => String(n).padStart(2, '0');

/**
 * A cover, as an SVG document.
 *
 * @param {import('../util/brand.js').Brand} brand The brand.
 * @param {object} o The cover.
 * @param {[number, number]} o.size Its width and height, mm.
 * @param {string} [o.title=''] A title, set small at the top right.
 * @param {number} [o.volume=1] The volume's number.
 * @param {number} [o.px=6] Pixels per mm.
 * @param {boolean} [o.dots=true] The grid of dots.
 * @returns {string} The SVG, `size × px` pixels.
 */
export function coverSvg(brand, { size, title = '', volume: vol = 1, px = 6, dots = true }) {
	const [W, H] = size;
	const sc = scene({ width: W * px, height: H * px, key: `cover:${brand.name}:${vol}` });
	const m = W * 0.07;
	const k = (v) => v * px;
	const type = { fill: brand.ink, 'font-family': FONT };
	sc.add(el('rect', { width: k(W), height: k(H), fill: brand.color }));
	sc.add(lockup(sc, { mark: brand.mark, ink: brand.ink, size: k(W * 0.08), x: k(m), y: k(m) }));
	const small = k(W * 0.018);
	const right = [title, `Vol. ${volume(vol)}`].filter(Boolean);
	right.forEach((line, i) => sc.add(el('text', { ...type, x: k(W * 0.62), y: k(m) + small * (1 + i * 1.45), 'font-size': small, 'font-weight': 500 }, esc(line))));
	if (dots) {
		const top = H * 0.22;
		const bottom = H * (brand.name ? 0.7 : 0.6);
		const step = (W - 2 * m) / 13;
		let d = '';
		for (let y = top; y <= bottom; y += step) for (let x = m; x <= W - m + 0.01; x += step) d += `M${k(x) - k(0.5)} ${k(y)}a${k(0.5)} ${k(0.5)} 0 1 0 ${k(1)} 0a${k(0.5)} ${k(0.5)} 0 1 0 ${k(-1)} 0`;
		sc.add(el('path', { d, fill: brand.ink, opacity: 0.85 }));
	}
	if (brand.name) {
		const fs = Math.min(H * 0.16, (W - 2 * m) / typeWidth(brand.name, 1, -0.03));
		sc.add(el('text', { ...type, x: k(m * 0.85), y: k(H - m), 'font-size': k(fs), 'font-weight': 500, 'letter-spacing': k(fs * -0.03) }, esc(brand.name)));
	} else sc.add(lockup(sc, { mark: brand.mark, ink: brand.ink, size: k(W * 0.3), x: k(m), y: k(H - m - W * 0.3) }));
	sc.add(el('rect', { width: k(W), height: k(H), fill: toothFill(sc, px, 7), opacity: 0.9 }));
	return sc.svg();
}

/**
 * A spine, as an SVG document: the name running down it (read with the head tipped right), the mark at its foot, the title and volume at its head.
 *
 * @param {import('../util/brand.js').Brand} brand The brand.
 * @param {object} o The spine.
 * @param {[number, number]} o.size Its width (the book's thickness) and height, mm.
 * @param {string} [o.title=''] A title, at the head.
 * @param {number} [o.volume=1] The volume's number.
 * @param {number} [o.px=6] Pixels per mm.
 * @returns {string} The SVG, `size × px` pixels.
 */
export function spineSvg(brand, { size, title = '', volume: vol = 1, px = 6 }) {
	const [W, H] = size;
	const sc = scene({ width: W * px, height: H * px, key: `spine:${brand.name}:${vol}` });
	const k = (v) => v * px;
	const type = { fill: brand.ink, 'font-family': FONT };
	sc.add(el('rect', { width: k(W), height: k(H), fill: brand.color }));
	const mark = Math.min(W * 0.42, 20);
	const foot = H - W * 0.3 - mark;
	sc.add(lockup(sc, { mark: brand.mark, ink: brand.ink, size: k(mark), x: k((W - mark) / 2), y: k(foot) }));
	// set along the spine: turned a quarter, reading from the head down
	const along = (text, at, fs, weight) => el('text', { ...type, x: 0, y: 0, 'font-size': k(fs), 'font-weight': weight, transform: `translate(${k(W / 2 - fs * 0.36)} ${k(at)}) rotate(90)` }, esc(text));
	if (brand.name) {
		const fs = Math.min(W * 0.34, (H * 0.36) / typeWidth(brand.name, 1));
		sc.add(along(brand.name, foot - fs * 0.8 - typeWidth(brand.name, fs), fs, 500));
	}
	const head = [title, `Vol. ${volume(vol)}`].filter(Boolean).join('  ·  ');
	sc.add(along(head, W * 0.5, Math.min(W * 0.12, 4.2), 500));
	sc.add(el('rect', { width: k(W), height: k(H), fill: toothFill(sc, px, 11), opacity: 0.9 }));
	return sc.svg();
}
