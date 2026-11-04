/**
 * @module @arraypress/mockups/parts/artsize
 *
 * An artwork's proportions, read from its header without decoding it: a
 * PNG's IHDR, a JPEG's frame header, a GIF's screen, a WebP's VP8 header,
 * an SVG's viewBox or width and height. A print is fitted inside its print
 * area at its own aspect, so a wide logo stays wide on a T-shirt.
 */

/**
 * The bytes of an artwork, when it carries them (bytes, or a base64 `data:` URI).
 *
 * @param {import('../types.js').Art} art The artwork.
 * @returns {Uint8Array | string | null} Its bytes, its SVG markup, or `null` (a URL).
 */
function bytesOf(art) {
	if (art instanceof Uint8Array) return art;
	if (art instanceof ArrayBuffer) return new Uint8Array(art);
	const s = art.trim();
	if (s.startsWith('<')) return s;
	const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(s);
	if (!m) return null;
	if (!m[2]) return decodeURIComponent(m[3]);
	const bin = atob(m[3]);
	const b = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
	return b;
}

/**
 * An artwork's width over its height.
 *
 * @param {import('../types.js').Art} art Image bytes, SVG markup or a `data:` URI.
 * @param {number} [fallback=1] The answer when it can't be read (a URL, an unknown format).
 * @returns {number} Its aspect.
 */
export function artAspect(art, fallback = 1) {
	const b = bytesOf(art);
	if (b === null) return fallback;
	if (typeof b === 'string') return svgAspect(b) ?? fallback;
	const u16 = (i) => (b[i] << 8) | b[i + 1];
	const u32 = (i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
	const ratio = (w, h) => (w > 0 && h > 0 ? w / h : fallback);
	if (b[0] === 0x89 && b[1] === 0x50) return ratio(u32(16), u32(20));
	if (b[0] === 0x47 && b[1] === 0x49) return ratio(b[6] | (b[7] << 8), b[8] | (b[9] << 8));
	if (b[0] === 0xff && b[1] === 0xd8) {
		for (let i = 2; i < b.length - 9; ) {
			if (b[i] !== 0xff) return fallback;
			const marker = b[i + 1];
			if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return ratio(u16(i + 7), u16(i + 5));
			i += 2 + u16(i + 2);
		}
		return fallback;
	}
	const ascii = (f, t) => String.fromCharCode(...b.subarray(f, t));
	if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
		const kind = ascii(12, 16);
		if (kind === 'VP8 ') return ratio((b[26] | (b[27] << 8)) & 0x3fff, (b[28] | (b[29] << 8)) & 0x3fff);
		if (kind === 'VP8L') return ratio(1 + (((b[22] & 0x3f) << 8) | b[21]), 1 + (((b[24] & 0xf) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6)));
		if (kind === 'VP8X') return ratio(1 + (b[24] | (b[25] << 8) | (b[26] << 16)), 1 + (b[27] | (b[28] << 8) | (b[29] << 16)));
		return fallback;
	}
	const head = new TextDecoder().decode(b.subarray(0, 2048));
	return head.includes('<svg') ? (svgAspect(head) ?? fallback) : fallback;
}

/**
 * An SVG's aspect, from its viewBox, or its width and height.
 *
 * @param {string} svg The markup (its opening tag is enough).
 * @returns {number | null} The aspect, or `null`.
 */
function svgAspect(svg) {
	const tag = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? '';
	const vb = /viewBox\s*=\s*["']\s*[-\d.e]+[\s,]+[-\d.e]+[\s,]+([\d.e]+)[\s,]+([\d.e]+)/i.exec(tag);
	if (vb && +vb[1] > 0 && +vb[2] > 0) return +vb[1] / +vb[2];
	const w = /\bwidth\s*=\s*["']([\d.]+)/i.exec(tag);
	const h = /\bheight\s*=\s*["']([\d.]+)/i.exec(tag);
	return w && h && +w[1] > 0 && +h[1] > 0 ? +w[1] / +h[1] : null;
}

/**
 * The largest box of an aspect that fits inside another, centred on it horizontally and set at its top.
 *
 * @param {number} aspect The art's width over height.
 * @param {{ x: number, y: number, w: number, h: number }} area The print area.
 * @param {'top' | 'middle'} [align='top'] Where it sits in the area, vertically.
 * @returns {{ x: number, y: number, w: number, h: number }} The art's box.
 */
export function fitInside(aspect, area, align = 'top') {
	const w = Math.min(area.w, area.h * aspect);
	const h = w / aspect;
	return { x: area.x + (area.w - w) / 2, y: align === 'top' ? area.y : area.y + (area.h - h) / 2, w, h };
}
