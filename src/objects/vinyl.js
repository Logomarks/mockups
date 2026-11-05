/**
 * @module @logomarks/mockups/objects/vinyl
 *
 * Vinyl, front on: a square sleeve carrying the artwork with one or two
 * records peeking out from behind it, on a seamless ground. A double LP
 * shows a record each side (or both fanned out on one side); a single shows
 * one. The sleeve's side is the unit everything is laid out in: a 12"
 * record is 0.965 of it, and `peek` is how much of a record's diameter
 * shows past the sleeve's edge. The ground can be any of the surfaces
 * (oak, slate, linen…), and the sleeve can be printed in one ink.
 */

import { scene } from '../render/scene.js';
import { el } from '../render/svg.js';
import { groundLayer } from '../materials/ground.js';
import { resolveSurface, surfaceLayer } from '../materials/desk.js';
import { resolvePrint } from '../materials/ink.js';
import { castShadow } from '../materials/shadow.js';
import { grainLayer } from '../materials/grain.js';
import { resolveVinyl } from '../materials/vinyl.js';
import { RADII } from '../materials/surface.js';
import { resolveLabels } from '../parts/label.js';
import { record, silhouette, punch } from '../parts/record.js';
import { sleeve } from '../parts/sleeve.js';
import { resolveSize } from '../util/size.js';
import { clamp } from '../util/num.js';

/** A 12" record's diameter, as a fraction of its sleeve's side (302 of 314 mm). */
export const RECORD = 0.965;

/** The record sizes, in mm: the sleeve's side, the record's diameter, its label's, its thickness, and its speed. */
export const VINYL_SIZES = Object.freeze({
	'12in': Object.freeze({ sleeve: 314, record: 302, label: 100, thickness: 1.4, speed: '33⅓ RPM' }),
	'7in': Object.freeze({ sleeve: 184, record: 175, label: 86, thickness: 1.3, speed: '45 RPM' }),
});

/** How far the sleeve stands off its records, for its shadow: it lies on them, so the shadow is tight and faint. */
const SLEEVE_LIFT = 0.3;

/** How much further the back record of a fanned pair peeks, as a fraction of its diameter. */
const FAN = 0.17;

/**
 * Where each record goes, back to front.
 *
 * @param {'single' | 'double'} format One record or two.
 * @param {'both' | 'left' | 'right'} side Where they peek out.
 * @param {number} peek How much of a record's diameter shows.
 * @returns {{ dir: -1 | 1, peek: number, label: 0 | 1 }[]} Each record's side (-1 left, 1 right), how much of it shows, and its label.
 */
export function placements(format, side, peek) {
	if (format === 'single') return [{ dir: side === 'left' ? -1 : 1, peek, label: 0 }];
	if (side === 'both') return [{ dir: -1, peek, label: 0 }, { dir: 1, peek, label: 1 }];
	const dir = side === 'left' ? -1 : 1;
	return [{ dir, peek: Math.min(0.92, peek + FAN), label: 1 }, { dir, peek, label: 0 }];
}

/**
 * A vinyl mockup.
 *
 * @param {import('./vinyl.js').VinylOptions} options The artwork and how to show it.
 * @returns {import('../types.js').Mockup} The layered SVG and its size.
 * @throws {TypeError} When an option is out of range or of the wrong kind.
 */
export function vinyl(options) {
	if (!options || typeof options !== 'object') throw new TypeError('vinyl: pass { art, … }');
	const { art, format = 'double', vinyl: spec = 'clear', labels = 'auto', ground, title = '', seed = 'vinyl' } = options;
	if (art === undefined || art === null) throw new TypeError('vinyl: art is required');
	if (format !== 'single' && format !== 'double') throw new TypeError(`vinyl: format is 'single' or 'double' (got ${JSON.stringify(format)})`);
	const side = options.side ?? (format === 'double' ? 'both' : 'right');
	if (!['both', 'left', 'right'].includes(side)) throw new TypeError(`vinyl: side is 'both', 'left' or 'right' (got ${JSON.stringify(side)})`);
	if (format === 'single' && side === 'both') throw new TypeError("vinyl: a single LP peeks out on one side: 'left' or 'right'");
	const peek = clamp(num(options.peek, 0.53, 'peek'), 0.1, 0.9);
	const light = clamp(num(options.light, 0.35, 'light'), -1, 1);
	const strength = clamp(num(options.shadow, 1, 'shadow'), 0, 3);
	const fit = clamp(num(options.fit, 0.89, 'fit'), 0.2, 1);
	const { width, height } = resolveSize(options.size);
	const g = resolveSurface(ground, 'light', 'ground');
	const print = resolvePrint(options.print, 'vinyl');
	const specs = Array.isArray(spec) ? spec : [spec, spec];
	const materials = [resolveVinyl(specs[0]), resolveVinyl(specs[1] ?? specs[0])];
	const sides = resolveLabels(labels, title, art);
	const recs = placements(format, side, peek);

	// lay out in sleeve units, then fit the group into the frame
	const left = Math.max(0.5, ...recs.filter((r) => r.dir < 0).map((r) => 0.5 + r.peek * RECORD));
	const right = Math.max(0.5, ...recs.filter((r) => r.dir > 0).map((r) => 0.5 + r.peek * RECORD));
	const k = Math.min((width * fit) / (left + right), height * fit * 0.72);
	const cx = width / 2 + ((left - right) / 2) * k;
	const cy = height / 2;
	const R = (RECORD * k) / 2;

	const sc = scene({ width, height, art, key: JSON.stringify({ format, side, spec, peek, seed }) });
	const shine = { x: light, strength: strength * g.shadow, unit: k };
	sc.add(g.texture ? surfaceLayer(sc, g, { light, seed, mm: k / VINYL_SIZES['12in'].sleeve }) : groundLayer(sc, g));
	recs.forEach((p, i) => {
		const x = cx + p.dir * (0.5 * k + p.peek * 2 * R - R);
		const m = materials[p.label];
		sc.add(
			punch(sc, x, cy, R, castShadow(sc, shine, { shape: (fill) => silhouette(x, cy, R, m.opacity, fill), foot: { x, bottom: cy + R, width: 2 * R } })),
			record(sc, {
				cx: x,
				cy,
				r: R,
				material: m,
				label: sides[p.label],
				ground: g.color,
				light,
				seed: `${seed}:${i}`,
				shift: textShift(p.dir, x - (cx + p.dir * 0.5 * k), R),
			}),
		);
	});
	sc.add(
		castShadow(sc, shine, { shape: (fill) => el('rect', { x: cx - k / 2, y: cy - k / 2, width: k, height: k, fill }), foot: { x: cx, bottom: cy + k / 2, width: k }, lift: SLEEVE_LIFT }),
		sleeve(sc, { x: cx - k / 2, y: cy - k / 2, size: k, light, sheen: num(options.sheen, 1, 'sheen'), print }),
		grainLayer(sc, clamp(num(options.grain, 0.2, 'grain'), 0, 1), seed),
	);
	return { svg: sc.svg(), width, height, object: 'vinyl' };
}

/**
 * How far to move a label's type away from the sleeve so it isn't hidden behind it.
 *
 * @param {number} dir The side the record peeks out on.
 * @param {number} gap How far the record's centre is past the sleeve's edge (positive: outside it).
 * @param {number} R The record's radius.
 * @returns {number} The shift.
 */
function textShift(dir, gap, R) {
	const need = 0.2 * R; // half the width of "SIDE A", plus a margin
	const clear = gap * dir;
	return clear >= need ? 0 : dir * Math.min(need - clear, RADII.label * R * 0.5);
}

/**
 * A number option, or its default.
 *
 * @param {unknown} v The option.
 * @param {number} fallback Its default.
 * @param {string} name Its name, for the error.
 * @returns {number} The number.
 */
function num(v, fallback, name) {
	if (v === undefined) return fallback;
	if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`vinyl: ${name} is a number (got ${JSON.stringify(v)})`);
	return v;
}
