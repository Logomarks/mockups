/**
 * Rebuilds the kraft board textures without their seams and writes them to
 * `assets/textures/` as WebP. Run once, by hand, when the sources change:
 *
 *   node tools/heal-textures.mjs <source-dir> [preview-dir]
 *
 * The sources (1024² PNGs, tileable) carry the marks of how they were made
 * tileable: a dashed line about an eighth of the way down, another the same
 * distance in from the left, faint block edges, and broad patches of
 * slightly different tone. Tiled, those repeat as a visible grid. So each
 * is flattened (its broad tone divided out, wrapping round the edges), then
 * resynthesised: a new tile is laid from overlapping windows of the clean
 * middle of the source, each from a random place, blended so the grain
 * keeps its contrast (variance-preserving: the windows' deviations are
 * summed and divided by the root of their squared weights, so the blend
 * neither blurs nor flattens). The windows wrap, so the tile is seamless.
 * Last, each is pulled most of the way to a shared kraft colour, so the
 * four can sit on one box. With a preview directory, it writes each
 * tiled 3 × 3 there, to check for seams.
 */

import { createRequire } from 'node:module';
import { readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const sharp = createRequire(import.meta.url)('sharp');
const [src, preview] = process.argv.slice(2);
if (!src) throw new Error('usage: node tools/heal-textures.mjs <source-dir> [preview-dir]');
const OUT = new URL('../assets/textures/', import.meta.url).pathname;
const N = 1024;
/** The shared kraft colour (linear-ish sRGB, 0–255) the four are pulled towards, and how far. */
const KRAFT = [190, 150, 104];
const PULL = 0.85;
/** The windows' spacing: each pixel of the new tile is blended from the four windows round it. */
const STEP = 128;
/** Where a window's source centre may sit, clear of the dashed lines (rows and columns 90–175) and the wrap seams. */
const CLEAR = [175 + STEP, N - 40 - STEP];

/**
 * A wrapping box blur of one channel, three passes each way (close to a Gaussian).
 *
 * @param {Float32Array} c The channel, N × N.
 * @param {number} r The radius.
 * @returns {Float32Array} The blurred channel.
 */
function blurWrap(c, r) {
	let a = Float32Array.from(c);
	const tmp = new Float32Array(N);
	for (let pass = 0; pass < 3; pass++) {
		for (const dir of [0, 1]) {
			for (let k = 0; k < N; k++) {
				const at = (i) => (dir ? i * N + k : k * N + i);
				let acc = 0;
				for (let i = -r; i <= r; i++) acc += a[at((i + N) % N)];
				for (let i = 0; i < N; i++) {
					tmp[i] = acc / (2 * r + 1);
					acc += a[at((i + r + 1) % N)] - a[at((i - r + N) % N)];
				}
				for (let i = 0; i < N; i++) a[at(i)] = tmp[i];
			}
		}
	}
	return a;
}

/**
 * A new seamless tile from windows of the source's clean middle, blended so the grain keeps its contrast.
 *
 * @param {Float32Array[]} ch The channels, flattened.
 * @param {string} seed The seed.
 * @returns {Float32Array[]} The new channels.
 */
function synthesise(ch, seed) {
	// mulberry32, seeded from the file name
	let h = [...seed].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
	const rand = () => {
		h = (h + 0x6d2b79f5) >>> 0;
		let t = h;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const cells = N / STEP;
	// each window: where in the source it comes from, and turned or mirrored (paper's grain is near enough the same every way)
	const src = Array.from({ length: cells * cells }, () => ({ x: Math.round(CLEAR[0] + rand() * (CLEAR[1] - CLEAR[0])), y: Math.round(CLEAR[0] + rand() * (CLEAR[1] - CLEAR[0])), turn: Math.floor(rand() * 8) }));
	const turned = (dx, dy, t) => {
		const [a, b] = t & 1 ? [dy, dx] : [dx, dy];
		return [t & 2 ? -a : a, t & 4 ? -b : b];
	};
	const mean = ch.map((c) => c.reduce((s, v) => s + v, 0) / c.length);
	const out = ch.map(() => new Float32Array(N * N));
	// cos² windows: each spans two steps, and the four over a pixel sum to 1
	const win = (d) => Math.cos((d / STEP) * (Math.PI / 2)) ** 2;
	for (let y = 0; y < N; y++) {
		const gy = Math.floor(y / STEP);
		for (let x = 0; x < N; x++) {
			const gx = Math.floor(x / STEP);
			const acc = [0, 0, 0];
			let w2 = 0;
			for (const j of [gy, gy + 1]) {
				for (const i of [gx, gx + 1]) {
					const w = win(x - i * STEP) * win(y - j * STEP);
					if (w <= 0) continue;
					const p = src[(j % cells) * cells + (i % cells)];
					const [dx, dy] = turned(x - i * STEP, y - j * STEP, p.turn);
					const o = (p.y + dy) * N + (p.x + dx);
					for (let c = 0; c < 3; c++) acc[c] += w * (ch[c][o] - mean[c]);
					w2 += w * w;
				}
			}
			const k = 1 / Math.sqrt(w2);
			for (let c = 0; c < 3; c++) out[c][y * N + x] = mean[c] + acc[c] * k;
		}
	}
	return out;
}

/**
 * A texture tiled 3 × 3, for checking seams.
 *
 * @param {Buffer} webp The texture.
 * @param {string} file Where to write it.
 */
async function tiled(webp, file) {
	const t = await sharp(webp).resize(512).toBuffer();
	const composite = [];
	for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) composite.push({ input: t, left: x * 512, top: y * 512 });
	await sharp({ create: { width: 1536, height: 1536, channels: 3, background: '#000' } }).composite(composite).jpeg({ quality: 88 }).toFile(file);
}

mkdirSync(OUT, { recursive: true });
if (preview) mkdirSync(preview, { recursive: true });
const files = readdirSync(src).filter((f) => /cardboard/.test(f) && f.endsWith('.png')).sort();
let total = 0;
for (const [n, f] of files.entries()) {
	const { data } = await sharp(path.join(src, f)).removeAlpha().resize(N, N).raw().toBuffer({ resolveWithObject: true });
	const ch = [0, 1, 2].map((c) => Float32Array.from({ length: N * N }, (_, i) => data[i * 3 + c]));
	// the broad patches: divide out tone wider than about 50 px, most of the way
	const lum = ch[0].map((v, i) => 0.2126 * v + 0.7152 * ch[1][i] + 0.0722 * ch[2][i]);
	const broad = blurWrap(lum, 24);
	const mean = broad.reduce((s, v) => s + v, 0) / broad.length;
	for (const c of ch) for (let i = 0; i < c.length; i++) c[i] *= 1 + 0.8 * (mean / broad[i] - 1);
	const fresh = synthesise(ch, f);
	// most of the way to the shared kraft
	const own = fresh.map((c) => c.reduce((s, v) => s + v, 0) / c.length);
	const out = Buffer.alloc(N * N * 3);
	for (let i = 0; i < N * N; i++) for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.max(0, Math.min(255, Math.round(fresh[c][i] * (1 + PULL * (KRAFT[c] / own[c] - 1)))));
	const webp = await sharp(out, { raw: { width: N, height: N, channels: 3 } }).webp({ quality: 82, effort: 6 }).toBuffer();
	await sharp(webp).toFile(path.join(OUT, `kraft-${n}.webp`));
	total += webp.length;
	console.log(`kraft-${n}.webp  ${(webp.length / 1024).toFixed(0)} KB  (from ${f.slice(-12)}, mean ${own.map((v) => v.toFixed(0)).join(' ')})`);
	if (preview) await tiled(webp, path.join(preview, `kraft-${n}-3x3.jpg`));
}
console.log(`total ${(total / 1024).toFixed(0)} KB`);
