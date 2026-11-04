/**
 * @module @arraypress/mockups/render/art
 *
 * The finished artwork a mockup shows, as something an SVG `<image>` can
 * point at. Bytes are sniffed (PNG, JPEG, WebP, GIF, AVIF, SVG) and inlined
 * as a `data:` URI; SVG markup is inlined; a URL is kept as it is (browsers
 * draw it, but sharp and an SVG drawn into a canvas can't fetch it, so use
 * `loadArt` from `./node` or `./browser` to inline it first).
 */

/** Each image type by the bytes it starts with. */
const MAGIC = /** @type {const} */ ([
	['image/png', [0x89, 0x50, 0x4e, 0x47]],
	['image/jpeg', [0xff, 0xd8, 0xff]],
	['image/gif', [0x47, 0x49, 0x46, 0x38]],
]);

/**
 * The type of an image, from its first bytes.
 *
 * @param {Uint8Array} b The image's bytes.
 * @returns {string | null} Its MIME type, or `null` when it isn't one this knows.
 */
export function sniff(b) {
	for (const [type, sig] of MAGIC) if (sig.every((v, i) => b[i] === v)) return type;
	const ascii = (from, to) => String.fromCharCode(...b.subarray(from, to));
	if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
	if (ascii(4, 8) === 'ftyp' && /^avi[fs]/.test(ascii(8, 12))) return 'image/avif';
	const head = new TextDecoder().decode(b.subarray(0, 512)).trimStart();
	if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'image/svg+xml';
	return null;
}

/**
 * Bytes as base64, in Node (Buffer) or a browser (btoa).
 *
 * @param {Uint8Array} b The bytes.
 * @returns {string} Their base64.
 */
export function base64(b) {
	const B = /** @type {{ Buffer?: { from(b: Uint8Array): { toString(enc: string): string } } }} */ (globalThis).Buffer;
	if (B) return B.from(b).toString('base64');
	let s = '';
	for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
	return btoa(s);
}

/**
 * Artwork as an `href` for an SVG `<image>`.
 *
 * @param {import('../types.js').Art} art Image bytes (`Uint8Array`, `Buffer`, `ArrayBuffer`), SVG markup, a `data:` URI or a URL.
 * @returns {string} A `data:` URI, or the URL as given.
 * @throws {TypeError} When it's empty, or bytes of a type this doesn't know.
 */
export function artHref(art) {
	if (typeof art === 'string') {
		const s = art.trim();
		if (!s) throw new TypeError('art is empty');
		if (s.startsWith('<')) return `data:image/svg+xml;base64,${base64(new TextEncoder().encode(s))}`;
		return s;
	}
	const bytes = art instanceof ArrayBuffer ? new Uint8Array(art) : art instanceof Uint8Array ? art : null;
	if (!bytes || !bytes.length) throw new TypeError('art must be image bytes, SVG markup, a data: URI or a URL');
	const type = sniff(bytes);
	if (!type) throw new TypeError('art: not a PNG, JPEG, WebP, GIF, AVIF or SVG');
	return `data:${type};base64,${base64(bytes)}`;
}
