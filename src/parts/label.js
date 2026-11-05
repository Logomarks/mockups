/**
 * @module @logomarks/mockups/parts/label
 *
 * A record's centre label. Its art is taken from the cover (a crop of it,
 * or all of it blurred) and toned dark or light, or supplied, or a plain
 * colour. On it: the side ("SIDE A") above the spindle, the speed below,
 * and a ring of small type round the edge, as pressing plants print them.
 */

import { el, esc } from '../render/svg.js';
import { artHref } from '../render/art.js';
import { ART } from '../render/scene.js';
import { clamp, n } from '../util/num.js';
import { recall } from '../render/quiet.js';

/** The type labels are set in. */
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Where each side's crop is taken from the cover, by default. */
const CROPS = Object.freeze([Object.freeze({ x: 0.4, y: 0.58, size: 0.34 }), Object.freeze({ x: 0.6, y: 0.42, size: 0.34 })]);

/** The words for a label's source. */
const SOURCES = /** @type {const} */ (['crop', 'blur', 'plain']);

/**
 * A label, resolved.
 *
 * @typedef {object} Label
 * @property {'crop' | 'blur' | 'plain' | 'art'} source Where its art comes from.
 * @property {string | null} href Its own art, for `source: 'art'`.
 * @property {'dark' | 'light'} tone Dark (light type) or light (dark type).
 * @property {string} color The plain colour, and the tone's wash.
 * @property {string} ink The type's colour.
 * @property {string | false} text The words above the spindle.
 * @property {string | false} ring The ring of small type.
 * @property {import('../types.js').Crop} crop The crop window, for `source: 'crop'`.
 * @property {number} scale Its own art's size, as a share of the label's diameter.
 * @property {string} speed The speed printed under the spindle.
 */

/**
 * The labels from the option, one per side.
 *
 * @param {import('./label.js').LabelsOption | undefined} labels `'auto'` (a crop of the cover, the first dark and the second light), `'crop'`, `'blur'`, `'plain'`, or `{ a, b }`, each its own art or a `LabelSpec`.
 * @param {string} title Words for the ring of type.
 * @param {import('../types.js').Art} [art] The cover: when `loadArt` measured it, crops with no window of their own go where it's quietest.
 * @param {string} [speed='33⅓ RPM'] The speed printed on it.
 * @returns {[Label, Label]} Side A's and side B's.
 * @throws {TypeError} For anything else.
 */
export function resolveLabels(labels = 'auto', title = '', art, speed = '33⅓ RPM') {
	const quiet = typeof art === 'string' ? recall(art.trim()) : null;
	const word = labels === 'auto' ? 'crop' : labels;
	if (typeof word === 'string') {
		if (!SOURCES.includes(/** @type {'crop'} */ (word))) throw new TypeError(`labels: 'auto', 'crop', 'blur', 'plain' or { a, b } (got ${JSON.stringify(labels)})`);
		return [resolveLabel({ art: /** @type {'crop'} */ (word) }, 0, title, quiet, speed), resolveLabel({ art: /** @type {'crop'} */ (word) }, 1, title, quiet, speed)];
	}
	if (!labels || typeof labels !== 'object') throw new TypeError('labels: an object of { a, b }');
	const a = labels.a ?? 'crop';
	return [resolveLabel(a, 0, title, quiet, speed), resolveLabel(labels.b ?? a, 1, title, quiet, speed)];
}

/**
 * One side's label.
 *
 * @param {import('./label.js').LabelSpec | import('../types.js').Art} spec Its art, or its spec.
 * @param {number} i The side (0 for A).
 * @param {string} title Words for the ring of type.
 * @param {import('../types.js').Crop[] | null} [quiet] Where the cover is quiet, quietest first (the default crops otherwise).
 * @param {string} [speed='33⅓ RPM'] The speed printed on it.
 * @returns {Label} The label.
 */
export function resolveLabel(spec, i, title, quiet = null, speed = '33⅓ RPM') {
	const o = typeof spec === 'object' && !(spec instanceof Uint8Array) && !(spec instanceof ArrayBuffer) ? spec : { art: spec };
	const art = o.art ?? 'crop';
	const keyword = typeof art === 'string' && SOURCES.includes(/** @type {'crop'} */ (art));
	const tone = o.tone ?? (i ? 'light' : 'dark');
	if (tone !== 'dark' && tone !== 'light') throw new TypeError(`label tone: 'dark' or 'light' (got ${JSON.stringify(tone)})`);
	const side = i ? 'B' : 'A';
	const crop = o.crop ?? quiet?.[i % quiet.length] ?? CROPS[i % 2];
	const scale = o.scale ?? 1;
	if (typeof scale !== 'number' || !(scale > 0 && scale <= 1)) throw new TypeError(`label scale: a share of the label, above 0 up to 1 (got ${JSON.stringify(o.scale)})`);
	const ring = `${title ? title.toUpperCase() + ' · ' : ''}SIDE ${side} · ${speed} · STEREO · ALL RIGHTS OF THE PRODUCER AND OWNER OF THE RECORDED WORK RESERVED · `;
	return {
		source: keyword ? /** @type {'crop' | 'blur' | 'plain'} */ (art) : 'art',
		href: keyword ? null : artHref(/** @type {import('../types.js').Art} */ (art)),
		tone,
		color: o.color ?? (tone === 'dark' ? '#141416' : '#f1efe9'),
		ink: o.ink ?? (tone === 'dark' ? '#f4f3ef' : '#19191b'),
		text: o.text === undefined ? `SIDE ${side}` : o.text,
		ring: o.ring === undefined ? ring : o.ring,
		crop: { x: clamp(crop.x), y: clamp(crop.y), size: clamp(crop.size, 0.05, 1) },
		scale,
		speed,
	};
}

/**
 * A label's face, centred on the origin.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {Label} lb The label.
 * @param {number} rl Its radius.
 * @param {number} shift How far to move the type sideways, to keep it clear of the sleeve.
 * @returns {string} The markup.
 */
export function label(sc, lb, rl, shift = 0) {
	const clip = sc.id('label');
	sc.def(el('clipPath', { id: clip }, el('circle', { r: rl })));
	let art = '';
	if (lb.source === 'crop') {
		const w = (2 * rl) / lb.crop.size;
		art = sc.useArt(-rl - (lb.crop.x - lb.crop.size / 2) * w, -rl - (lb.crop.y - lb.crop.size / 2) * w, w, w);
	} else if (lb.source === 'blur') {
		art = el('g', { filter: sc.blur(rl * 0.08) }, sc.useArt(-rl * 1.25, -rl * 1.25, rl * 2.5, rl * 2.5));
	} else if (lb.source === 'art' && lb.href) {
		const id = sc.id('labelart');
		sc.def(el('image', { id, width: ART, height: ART, href: lb.href, preserveAspectRatio: 'xMidYMid slice' }));
		const k = rl * (lb.scale ?? 1);
		art = el('use', { href: `#${id}`, transform: `translate(${n(-k)} ${n(-k)}) scale(${n((2 * k) / ART)})` });
	}
	const wash = lb.source === 'crop' || lb.source === 'blur' ? el('circle', { r: rl, fill: lb.color, opacity: lb.tone === 'dark' ? 0.42 : 0.5 }) : '';
	const sheen = sc.id('lsheen');
	sc.def(
		el(
			'radialGradient',
			{ id: sheen, cx: 0.3, cy: 0.22, r: 0.9 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.1 }),
			el('stop', { offset: 0.7, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.12 }),
		),
	);
	const type = { fill: lb.ink, 'font-family': FONT, 'text-anchor': 'middle' };
	return el(
		'g',
		{ 'clip-path': `url(#${clip})` },
		el('circle', { r: rl, fill: lb.color }),
		art,
		wash,
		el('circle', { r: rl * 0.94, fill: 'none', stroke: lb.ink, 'stroke-opacity': 0.35, 'stroke-width': rl * 0.006 }),
		lb.ring && ring(lb.ring, rl * 0.85, rl * 0.052, type),
		lb.text && el('text', { ...type, x: shift, y: -rl * 0.36, 'font-size': rl * 0.125, 'font-weight': 700, 'letter-spacing': rl * 0.02 }, esc(lb.text)),
		el('text', { ...type, x: shift, y: rl * 0.48, 'font-size': rl * 0.075, 'font-weight': 500, 'letter-spacing': rl * 0.01, opacity: 0.85 }, esc(lb.speed ?? '33⅓ RPM')),
		el('circle', { r: rl * 0.1, fill: 'none', stroke: lb.ink, 'stroke-opacity': 0.18, 'stroke-width': rl * 0.008 }),
		el('circle', { r: rl, fill: `url(#${sheen})` }),
	);
}

/**
 * A ring of small type round a circle, one glyph at a time (so it renders the same everywhere, without `textPath`).
 *
 * @param {string} words The words; they repeat to go all the way round.
 * @param {number} radius The ring's radius (the glyphs' baseline).
 * @param {number} size The type's size.
 * @param {Record<string, string>} type The type's attributes.
 * @returns {string} The markup.
 */
export function ring(words, radius, size, type) {
	const count = Math.floor((2 * Math.PI * radius) / (size * 0.66));
	const text = words.repeat(Math.ceil(count / Math.max(1, words.length)) + 1).slice(0, count);
	let out = '';
	for (let i = 0; i < count; i++) {
		if (text[i] === ' ') continue;
		out += el('text', { transform: `rotate(${n((i / count) * 360 - 90)}) translate(0 ${n(-radius)})`, 'font-size': size, 'font-weight': 500 }, esc(text[i]));
	}
	return el('g', { ...type, opacity: 0.8 }, out);
}
