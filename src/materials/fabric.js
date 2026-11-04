/**
 * @module @arraypress/mockups/materials/fabric
 *
 * Cloth: the garment colours, the four fabrics (cotton jersey for a tee,
 * brushed fleece for a hoodie, canvas for a tote, twill for a cap) and the
 * texture each lays over the garment and its print, in its true size (a
 * jersey's wales, a canvas's crossing threads, a twill's diagonal), and
 * how ink sits in it: soaked into a light cloth (multiplied, so the weave
 * shows through), on top of a dark one (a plastisol layer, a touch less
 * saturated than on paper).
 */

import { el } from '../render/svg.js';
import { speckTile, mottle } from './desk.js';
import { isHex, luma } from '../util/color.js';
import { hash } from '../util/rng.js';

/** The named garment colours. */
export const GARMENT_COLORS = Object.freeze({
	white: '#f3f2ef',
	natural: '#e8e0cf',
	heather: '#a9a8a5',
	sand: '#d6c6a8',
	sage: '#9aa58e',
	navy: '#1f2840',
	black: '#1d1d1f',
});

/** The fabrics, and how strongly each shows its texture. */
export const FABRICS = Object.freeze({
	jersey: Object.freeze({ texture: 0.8, fuzz: 0.2 }),
	fleece: Object.freeze({ texture: 0.55, fuzz: 1 }),
	canvas: Object.freeze({ texture: 1.1, fuzz: 0.1 }),
	twill: Object.freeze({ texture: 0.9, fuzz: 0.15 }),
});

/**
 * A garment colour from its option.
 *
 * @param {string | undefined} c A named colour (`'white'`, `'natural'`, `'heather'`, `'sand'`, `'sage'`, `'navy'`, `'black'`) or a hex colour.
 * @param {string} fallback The name or hex when there's none.
 * @param {string} object The object, for the error.
 * @returns {{ color: string, name: string | null, dark: boolean }} The colour, its name, and whether it reads dark.
 * @throws {TypeError} For anything else.
 */
export function resolveGarment(c, fallback, object) {
	const v = c ?? fallback;
	const named = Object.hasOwn(GARMENT_COLORS, v);
	if (!named && !isHex(v)) throw new TypeError(`${object}: color is ${Object.keys(GARMENT_COLORS).map((k) => `'${k}'`).join(', ')} or a hex colour (got ${JSON.stringify(c)})`);
	const color = named ? GARMENT_COLORS[/** @type {keyof typeof GARMENT_COLORS} */ (v)] : v;
	return { color, name: named ? v : null, dark: luma(color) < 0.45 };
}

/**
 * The fabric's texture over a region, in pixels: fine light and dark threads at the cloth's own scale, a broad heathered mottle, and (fleece) a soft fuzz.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The cloth.
 * @param {'jersey' | 'fleece' | 'canvas' | 'twill'} o.kind The fabric.
 * @param {number} o.mm Pixels per millimetre.
 * @param {boolean} o.dark Whether the cloth is dark (the threads' light catches more than their shadow).
 * @param {string} o.seed The seed.
 * @param {{ x: number, y: number, w: number, h: number }} o.box The region to cover, in pixels.
 * @param {boolean} [o.heather=false] Whether the yarn is heathered (a melange of light and dark fibres).
 * @returns {string} The layers, to clip to the garment.
 */
export function weave(sc, { kind, mm, dark, seed, box, heather = false }) {
	const s = hash(seed) % 900;
	const f = FABRICS[kind];
	const k = f.texture * (dark ? 0.75 : 1);
	const lite = dark ? 1.6 : 1;
	// the smallest feature a pixel can carry: half a cycle a pixel
	const per = (lenMm) => Math.min(0.42, 1 / Math.max(0.5, lenMm * mm));
	const rect = (fill, opacity = 1) => el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, fill, opacity });
	let out = '';
	if (kind === 'jersey') {
		// wales: columns of loops, ~0.7 mm apart, each a little irregular down its length
		out += rect(speckTile(sc, { size: 256, freq: [per(0.7), per(5)], octaves: 2, dark: 0.07 * k, light: 0.05 * k * lite, seed: s }));
		out += rect(speckTile(sc, { size: 256, freq: [per(0.45), per(0.45)], octaves: 1, dark: 0.05 * k, light: 0.04 * k * lite, seed: s + 1 }));
	} else if (kind === 'fleece') {
		out += rect(speckTile(sc, { size: 256, freq: [per(0.9), per(0.9)], octaves: 3, dark: 0.06 * k, light: 0.06 * k * lite, seed: s }));
		out += rect(speckTile(sc, { size: 384, freq: [per(4), per(4)], octaves: 2, dark: 0.04, light: 0.035 * lite, seed: s + 2 }));
	} else if (kind === 'canvas') {
		// plain weave: warp and weft crossing at ~0.6 mm, with slubs
		out += rect(speckTile(sc, { size: 384, freq: [per(0.6), per(2.4)], octaves: 1, dark: 0.055 * k, light: 0.045 * k * lite, seed: s }));
		out += rect(speckTile(sc, { size: 384, freq: [per(2.4), per(0.6)], octaves: 1, dark: 0.055 * k, light: 0.045 * k * lite, seed: s + 3 }));
		out += rect(speckTile(sc, { size: 256, freq: [per(0.5), per(0.5)], octaves: 1, dark: 0.04 * k, light: 0.04 * k * lite, seed: s + 4 }));
		out += rect(speckTile(sc, { size: 512, freq: [per(40), per(1.2)], octaves: 2, dark: 0.08 * k, light: 0.04 * k, cut: 0.64, seed: s + 5, type: 'turbulence' }));
	} else {
		// twill: a diagonal rib every ~0.9 mm
		const p = sc.id('twill');
		const step = Math.max(2, 0.9 * mm);
		sc.def(
			el(
				'pattern',
				{ id: p, patternUnits: 'userSpaceOnUse', width: step, height: step, patternTransform: 'rotate(-35)' },
				el('rect', { width: step, height: step * 0.45, fill: dark ? '#fff' : '#000', opacity: dark ? 0.05 : 0.06 }),
			),
		);
		out += rect(`url(#${p})`);
		out += rect(speckTile(sc, { size: 256, freq: [per(0.6), per(0.6)], octaves: 2, dark: 0.05 * k, light: 0.04 * k * lite, seed: s }));
	}
	// heathered yarn: light and dark fibres spun together, short streaks along the knit
	if (heather) out += rect(speckTile(sc, { size: 384, freq: [per(1.1), per(4.5)], octaves: 2, dark: 0.11, light: 0.11, seed: s + 7 }));
	const melange = (0.045 * f.fuzz + 0.02) * (dark ? 0.55 : 1);
	return el('g', {}, out, el('g', { transform: `translate(${box.x} ${box.y})` }, mottle({ ...sc, width: box.w, height: box.h }, `${seed}:yarn`, box.w / mm / 40, melange, 3)));
}

/**
 * The filter steps that make a print sit in the cloth, appended after the print has been warped (`in` names the warped print).
 *
 * @param {object} o How the ink behaves.
 * @param {boolean} o.dark Whether the cloth is dark.
 * @param {string | null} o.ink A colour to print a one-colour artwork in (its shape kept, its colour replaced), or `null`.
 * @returns {{ before: string, after: string }} Steps before the warp (recolouring the art, result `art`) and after it (from `warped`).
 */
export function inkSteps({ dark, ink }) {
	const before = ink
		? el('feFlood', { 'flood-color': ink, result: 'ink' }) + el('feComposite', { in: 'ink', in2: 'SourceAlpha', operator: 'in', result: 'art' })
		: el('feOffset', { in: 'SourceGraphic', dx: 0, dy: 0, result: 'art' });
	// on a dark cloth the ink layer is a touch flatter and less saturated than the file
	const after = dark ? el('feColorMatrix', { in: 'warped', type: 'saturate', values: 0.86 }) : el('feOffset', { in: 'warped', dx: 0, dy: 0 });
	return { before, after };
}
