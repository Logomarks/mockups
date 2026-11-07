/**
 * @module @logomarks/mockups/plates/extract
 *
 * Making a plate from a photo, in Node (through sharp): the photo scaled
 * to size and re-encoded as JPEG (or WebP, which is smaller; the Node
 * renderer re-encodes it for librsvg), each screen's corners found (or given) and its
 * true proportions recovered, and its maps cut from a version of the photo
 * with the sign blank (the photo itself, when its sign is blank already).
 * `savePlate` writes the lot as a plate directory.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { checkPlate, KIND_LOOKS } from './format.js';
import { findSigns, quadAspect } from './detect.js';
import { signMaps, photoNoise } from './maps.js';
import { quadBox } from './quad.js';
import { cylinderCorners, cylinderAspect, outline } from './surface.js';

/** @type {Promise<typeof import('sharp').default> | null} */
let sharpModule = null;

/**
 * sharp, imported once.
 *
 * @returns {Promise<typeof import('sharp').default>} Its default export.
 * @throws {Error} When it isn't installed.
 */
async function sharp() {
	sharpModule ??= import('sharp').then(
		(m) => m.default,
		() => {
			sharpModule = null;
			throw new Error('makePlate: needs sharp (npm install sharp)');
		},
	);
	return sharpModule;
}

/**
 * A photo's RGB pixels, scaled to the plate's size.
 *
 * @param {string | Uint8Array} input A path or the bytes.
 * @param {{ width: number, height: number } | number} size The exact size, or the longest side to fit within (never enlarged).
 * @returns {Promise<import('./detect.js').Pixels & { image: import('sharp').Sharp }>} The pixels, and the scaled image for encoding.
 */
async function pixels(input, size) {
	const s = await sharp();
	const image = s(input).rotate().removeAlpha();
	const sized = typeof size === 'number' ? image.resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true }) : image.resize(size.width, size.height, { fit: 'fill' });
	const { data, info } = await sized.clone().raw().toBuffer({ resolveWithObject: true });
	return { data: new Uint8Array(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height, image: sized };
}

/**
 * A hand-painted occluder mask (white where something stands in front of the sign), scaled to the photo and cut to a box.
 *
 * @param {string | Uint8Array} input The mask, as a path or bytes, at the photo's proportions.
 * @param {{ width: number, height: number }} photo The plate's photo.
 * @param {readonly [number, number, number, number]} box The screen's box.
 * @returns {Promise<Uint8Array>} Grey, the box's size, row by row.
 */
async function handMask(input, { width, height }, [bx, by, w, h]) {
	const m = await pixels(input, { width, height });
	const out = new Uint8Array(w * h);
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = m.data[((by + y) * width + bx + x) * 3];
	return out;
}

/**
 * How each kind of file is encoded, per format: its extension and sharp's encoder.
 *
 * @param {'jpeg' | 'webp'} format The format.
 * @param {number} quality The photo's quality.
 * @returns {{ ext: string, photo: (i: import('sharp').Sharp) => import('sharp').Sharp, map: (i: import('sharp').Sharp, q: number) => import('sharp').Sharp, mask: { ext: string, encode: (i: import('sharp').Sharp) => import('sharp').Sharp } }} The encoders.
 */
function encoders(format, quality) {
	if (format === 'webp') {
		return {
			ext: 'webp',
			photo: (i) => i.webp({ quality, effort: 6 }),
			map: (i, q) => i.webp({ quality: q, effort: 6 }),
			mask: { ext: 'webp', encode: (i) => i.webp({ lossless: true, effort: 6 }) },
		};
	}
	return {
		ext: 'jpg',
		photo: (i) => i.jpeg({ quality, mozjpeg: true }),
		map: (i, q) => i.jpeg({ quality: q, mozjpeg: true }),
		mask: { ext: 'png', encode: (i) => i.png({ compressionLevel: 9, palette: false }) },
	};
}

/**
 * A plate made from a photo.
 *
 * @param {string | Uint8Array} photo The photo, as a path or bytes.
 * @param {import('./extract.js').MakePlateOptions} options Its name, and how to find and treat each screen.
 * @returns {Promise<{ plate: import('./format.js').Plate, files: Map<string, Uint8Array> }>} The plate (its files named) and the files.
 * @throws {Error} When a screen can't be found.
 */
export async function makePlate(photo, options) {
	const { name, size = 2400, quality = 86, format = 'jpeg', blank, source } = options;
	if (format !== 'jpeg' && format !== 'webp') throw new TypeError(`makePlate '${name}': format is 'jpeg' or 'webp' (got ${JSON.stringify(format)})`);
	const enc = encoders(format, quality);
	const screens = options.screens ?? [{ kind: options.kind ?? 'print' }];
	const shown = await pixels(photo, size);
	const plain = blank ? await pixels(blank, { width: shown.width, height: shown.height }) : shown;
	/** @type {Map<string, Uint8Array>} */
	const files = new Map();
	const s = await sharp();
	files.set(`photo.${enc.ext}`, await enc.photo(shown.image).toBuffer());

	// the photo's own grain, for a sign whose grain was clipped away with its whites
	let grain = -1;
	const taken = [];
	const made = [];
	for (const [k, o] of screens.entries()) {
		const kind = o.kind ?? 'print';
		let corners = o.cylinder ? cylinderCorners(o.cylinder) : o.corners;
		if (!corners) {
			const found = findSigns(plain, { near: o.near }).filter((f) => !taken.some((t) => Math.hypot(t[0][0] - f.corners[0][0], t[0][1] - f.corners[0][1]) < 4));
			if (!found.length) throw new Error(`makePlate '${name}': no blank sign found for screen ${k + 1}; give its corners, or a point on it (near)`);
			corners = found[0].corners;
		}
		taken.push(corners);
		const round = (v) => Math.round(v * 100) / 100;
		corners = corners.map((p) => [round(p[0]), round(p[1])]);
		const shape = outline({ corners, shape: o.shape, cylinder: o.cylinder });
		const box = quadBox(shape, shown.width, shown.height, 3);
		const given = o.mask ? await handMask(o.mask, shown, box) : null;
		const maps = signMaps(plain, corners, box, kind, { occluders: o.occluders ?? true, dark: o.dark, given, outline: o.shape || o.cylinder ? shape : null, stock: o.stock });
		if (maps.noise < 0.5) {
			if (grain < 0) grain = photoNoise(plain);
			maps.noise = Math.max(maps.noise, grain);
		}
		const prefix = screens.length > 1 ? `screen-${k + 1}-` : '';
		const raw = (data, channels) => s(Buffer.from(data), { raw: { width: box[2], height: box[3], channels } });
		files.set(`${prefix}shading.${enc.ext}`, await enc.map(raw(maps.shading, 3), 90).toBuffer());
		/** @type {import('./format.js').PlateScreen} */
		const screen = { kind, corners, aspect: round(o.aspect ?? (o.cylinder ? cylinderAspect(o.cylinder) : quadAspect(corners, shown.width, shown.height))), box, shading: `${prefix}shading.${enc.ext}`, noise: maps.noise };
		// the surface's shape, the light's direction, cloth and a finish, as given
		if (o.shape && o.shape !== 'quad') screen.shape = o.shape;
		if (o.cylinder) screen.cylinder = o.cylinder;
		for (const f of /** @type {const} */ (['light', 'displace', 'finish', 'background'])) if (o[f] !== undefined) screen[f] = o[f];
		if (maps.mask) {
			files.set(`${prefix}mask.${enc.mask.ext}`, await enc.mask.encode(raw(maps.mask, 1)).toBuffer());
			screen.mask = `${prefix}mask.${enc.mask.ext}`;
		}
		if (maps.reflection) {
			files.set(`${prefix}reflection.${enc.ext}`, await enc.map(raw(maps.reflection, 3), 88).toBuffer());
			screen.reflection = `${prefix}reflection.${enc.ext}`;
		}
		for (const f of /** @type {const} */ (['soften', 'black', 'glow', 'sheen'])) if (o[f] !== undefined && o[f] !== KIND_LOOKS[kind][f]) screen[f] = o[f];
		made.push(screen);
	}
	const plate = checkPlate({ name, width: shown.width, height: shown.height, photo: `photo.${enc.ext}`, screens: made, ...(source ? { source } : {}) });
	// keep the description lean: only what was set, not every default checkPlate filled in
	return { plate: { ...plate, screens: made }, files };
}

/**
 * A made plate written out as a directory: its files and `plate.json`.
 *
 * @param {string} dir The directory (made if it isn't there).
 * @param {{ plate: import('./format.js').Plate, files: Map<string, Uint8Array> }} made What `makePlate` gave.
 * @returns {Promise<string>} The `plate.json` path.
 */
export async function savePlate(dir, { plate, files }) {
	await mkdir(dir, { recursive: true });
	for (const [file, bytes] of files) await writeFile(join(dir, file), bytes);
	const json = join(dir, 'plate.json');
	// arrays of numbers (corners, the box) on one line each
	await writeFile(json, JSON.stringify(plate, null, '\t').replace(/\[\s+(-?[\d.]+(?:,\s+-?[\d.]+)*)\s+\]/g, (_, list) => `[${list.split(/,\s+/).join(', ')}]`) + '\n');
	return json;
}
