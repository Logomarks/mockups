/**
 * @module @logomarks/mockups/render/dims
 *
 * An image's size, read from its `data:` URI without decoding it: PNG,
 * GIF and WebP headers, JPEG's frame marker, and an SVG's `viewBox` (or
 * `width` and `height`). Screens and signs fit art by its proportions, so
 * they need them before anything is drawn.
 */

/**
 * The first bytes of a base64 `data:` URI.
 *
 * @param {string} href The URI.
 * @param {number} bytes How many bytes to decode, at most.
 * @returns {Uint8Array | null} The bytes, or `null` when it isn't base64 data.
 */
function head(href, bytes) {
	const m = /^data:[^;,]*;base64,/.exec(href);
	if (!m) return null;
	const b64 = href.slice(m[0].length, m[0].length + Math.ceil(bytes / 3) * 4).replace(/[^A-Za-z0-9+/]/g, '');
	const s = atob(b64.slice(0, b64.length - (b64.length % 4)));
	const out = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
	return out;
}

/**
 * An SVG's size, from its root element.
 *
 * @param {string} svg The markup.
 * @returns {{ width: number, height: number } | null} Its size, or `null` when it gives none.
 */
export function svgSize(svg) {
	const root = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? '';
	const vb = /viewBox\s*=\s*["']\s*[-\d.e]+[\s,]+[-\d.e]+[\s,]+([\d.e]+)[\s,]+([\d.e]+)/i.exec(root);
	if (vb && +vb[1] > 0 && +vb[2] > 0) return { width: +vb[1], height: +vb[2] };
	const w = /\swidth\s*=\s*["']([\d.]+)(px)?["']/i.exec(root);
	const h = /\sheight\s*=\s*["']([\d.]+)(px)?["']/i.exec(root);
	return w && h && +w[1] > 0 && +h[1] > 0 ? { width: +w[1], height: +h[1] } : null;
}

/**
 * An image's size, from its `data:` URI.
 *
 * @param {string} href A `data:` URI (as `artHref` gives).
 * @returns {{ width: number, height: number } | null} Its size in pixels (an SVG's in its own units), or `null` when it can't be read (a URL).
 */
export function artSize(href) {
	if (href.startsWith('data:image/svg+xml')) {
		const comma = href.indexOf(',');
		const body = href.slice(comma + 1);
		const text = /;base64,/.test(href.slice(0, comma + 1)) ? new TextDecoder().decode(head(href, body.length) ?? new Uint8Array()) : decodeURIComponent(body);
		return svgSize(text);
	}
	const b = head(href, 262144);
	if (!b || b.length < 30) return null;
	const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
	const ascii = (from, to) => String.fromCharCode(...b.subarray(from, to));
	if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return { width: dv.getUint32(16), height: dv.getUint32(20) };
	if (ascii(0, 3) === 'GIF') return { width: dv.getUint16(6, true), height: dv.getUint16(8, true) };
	if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
		const kind = ascii(12, 16);
		if (kind === 'VP8 ') return { width: dv.getUint16(26, true) & 0x3fff, height: dv.getUint16(28, true) & 0x3fff };
		if (kind === 'VP8L') {
			const v = dv.getUint32(21, true);
			return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 };
		}
		if (kind === 'VP8X') return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
	}
	if (b[0] === 0xff && b[1] === 0xd8) {
		let i = 2;
		while (i + 9 < b.length) {
			if (b[i] !== 0xff) return null;
			const marker = b[i + 1];
			const size = dv.getUint16(i + 2);
			// SOF0–SOF15, less DHT (c4), JPG (c8) and DAC (cc)
			if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { width: dv.getUint16(i + 7), height: dv.getUint16(i + 5) };
			i += 2 + size;
		}
	}
	return null;
}
