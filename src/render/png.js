/**
 * @module @logomarks/mockups/render/png
 *
 * A minimal PNG encoder for small generated tiles (the film grain): 8-bit
 * grey with alpha, stored uncompressed (deflate's stored blocks), so it
 * needs no zlib and runs anywhere.
 */

/** CRC-32's table, made on first use. */
let table = /** @type {Uint32Array | null} */ (null);

/**
 * CRC-32 of some bytes, as PNG chunks need.
 *
 * @param {Uint8Array} b The bytes.
 * @returns {number} The checksum.
 */
export function crc32(b) {
	if (!table) {
		table = new Uint32Array(256);
		for (let i = 0; i < 256; i++) {
			let c = i;
			for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			table[i] = c >>> 0;
		}
	}
	let c = 0xffffffff;
	for (let i = 0; i < b.length; i++) c = table[(c ^ b[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

/**
 * A grey-and-alpha image as PNG bytes.
 *
 * @param {number} width Its width.
 * @param {number} height Its height.
 * @param {Uint8Array} pixels Grey and alpha for each pixel, row by row (`width * height * 2` bytes).
 * @returns {Uint8Array} The PNG.
 */
export function encodePng(width, height, pixels) {
	const row = width * 2;
	const raw = new Uint8Array((row + 1) * height);
	for (let y = 0; y < height; y++) raw.set(pixels.subarray(y * row, (y + 1) * row), y * (row + 1) + 1);
	// zlib: header, stored blocks, Adler-32
	const blocks = Math.ceil(raw.length / 65535) || 1;
	const z = new Uint8Array(2 + raw.length + blocks * 5 + 4);
	z[0] = 0x78;
	z[1] = 0x01;
	let o = 2;
	for (let i = 0; i < blocks; i++) {
		const part = raw.subarray(i * 65535, (i + 1) * 65535);
		z[o++] = i === blocks - 1 ? 1 : 0;
		z[o++] = part.length & 0xff;
		z[o++] = part.length >>> 8;
		z[o++] = ~part.length & 0xff;
		z[o++] = (~part.length >>> 8) & 0xff;
		z.set(part, o);
		o += part.length;
	}
	let a = 1;
	let b = 0;
	for (const v of raw) {
		a = (a + v) % 65521;
		b = (b + a) % 65521;
	}
	new DataView(z.buffer).setUint32(o, ((b << 16) | a) >>> 0);
	const ihdr = new Uint8Array(13);
	const dv = new DataView(ihdr.buffer);
	dv.setUint32(0, width);
	dv.setUint32(4, height);
	ihdr.set([8, 4, 0, 0, 0], 8);
	return concat([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', z), chunk('IEND', new Uint8Array(0))]);
}

/**
 * One PNG chunk: length, type, data, CRC.
 *
 * @param {string} type Its four-letter type.
 * @param {Uint8Array} data Its data.
 * @returns {Uint8Array} The chunk.
 */
function chunk(type, data) {
	const out = new Uint8Array(12 + data.length);
	const dv = new DataView(out.buffer);
	dv.setUint32(0, data.length);
	for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
	out.set(data, 8);
	dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
	return out;
}

/**
 * Byte arrays joined.
 *
 * @param {Uint8Array[]} parts The arrays.
 * @returns {Uint8Array} One array.
 */
function concat(parts) {
	const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
	let o = 0;
	for (const p of parts) {
		out.set(p, o);
		o += p.length;
	}
	return out;
}
