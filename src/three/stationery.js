/**
 * @module @logomarks/mockups/three/stationery
 *
 * A stationery set laid flat in a tidy grid on a solid colour, as a brand
 * presentation shoots it from above: a letterhead, a DL envelope, and a
 * business card's front and back. Each piece is its own sheet of stock at
 * its true size and thickness, its tooth in the light, its soft shadow on
 * the ground. Print files can be given for the letterhead and the card;
 * whatever isn't given is composed from the mark, the name and the colour.
 */

import { reader } from '../util/reader.js';
import { brandOf } from '../util/brand.js';
import { mix } from '../util/color.js';
import { resolveStock } from '../materials/paper.js';
import { shoot } from './shot.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg, trimCanvas } from './printart.js';
import { cardMesh } from './card.js';
import { stockMaterial, boardMaterial, toothMap } from './board.js';
import { UNIT, contactMesh } from './deskplane.js';
import { letterSvg, cardFrontSvg, cardBackSvg, envelopeSvg } from '../parts/stationery.js';

/** The exposure under which the studio's lamps print a sheet its own colour. */
export const STATIONERY_EXPOSURE = 1.12;

/** Each piece's size and thickness, mm. */
export const PIECES = Object.freeze({
	letter: Object.freeze({ width: 210, height: 297, thickness: 0.12 }),
	envelope: Object.freeze({ width: 220, height: 110, thickness: 0.7 }),
	front: Object.freeze({ width: 85, height: 55, thickness: 0.45 }),
	back: Object.freeze({ width: 85, height: 55, thickness: 0.45 }),
});

/**
 * Where the pieces lie, in mm about the set's centre (z towards the camera): the letterhead on the left; the envelope and, under it, the card's front and back in a column on the right, the gutters even.
 *
 * @param {number} [gutter=24] The space between pieces, mm.
 * @returns {{ piece: keyof typeof PIECES, x: number, z: number }[]} The pieces' centres.
 */
export function stationeryGrid(gutter = 24) {
	const P = PIECES;
	const colW = P.envelope.width;
	const colH = P.envelope.height + gutter + P.front.height;
	const total = P.letter.width + gutter + colW;
	const left = -total / 2;
	const right = left + P.letter.width + gutter;
	const top = -colH / 2;
	return [
		{ piece: 'letter', x: left + P.letter.width / 2, z: 0 },
		{ piece: 'envelope', x: right + colW / 2, z: top + P.envelope.height / 2 },
		{ piece: 'front', x: right + P.front.width / 2, z: colH / 2 - P.front.height / 2 },
		{ piece: 'back', x: right + colW - P.back.width / 2, z: colH / 2 - P.back.height / 2 },
	];
}

/**
 * A stationery set laid flat, in 3D on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./stationery.js').StationerySceneOptions} options The mark (inline), the brand, any print files, and how to show them.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option.
 */
export async function stationeryScene(canvas, options) {
	const o = reader('stationeryScene', options);
	const brand = brandOf(o, { color: '#0b2a45', paper: '#f2f0ea' });
	const { letter, card, back } = /** @type {import('./stationery.js').StationerySceneOptions} */ (options);
	const bleed = o.num('bleed', 0, 0, 10);
	const ground = o.color('ground', mix(brand.color, '#0c1620', 0.7));
	const light = o.num('light', 0.35, -1, 1);
	const seed = o.text('seed', 'stationery');
	const stock = resolveStock(/** @type {import('../materials/paper.js').StockName} */ (o.raw('stock') ?? 'uncoated'), 'stationeryScene');
	const cardStock = resolveStock('matte');
	const P = PIECES;
	const draw = (svg, size, px) => drawSvg(svg, size.width * px, size.height * px);
	const prints = {
		letter: letter ? await trimCanvas(letter, { trim: [P.letter.width, P.letter.height], bleed, px: 6 }) : await draw(letterSvg(brand), P.letter, 6),
		envelope: await draw(envelopeSvg(brand), P.envelope, 6),
		front: card ? await trimCanvas(card, { trim: [P.front.width, P.front.height], bleed, px: 12 }) : await draw(cardFrontSvg(brand), P.front, 12),
		back: back ? await trimCanvas(back, { trim: [P.back.width, P.back.height], bleed, px: 12 }) : await draw(cardBackSvg(brand), P.back, 12),
	};
	const grid = stationeryGrid();
	const span = P.letter.width + 24 + P.envelope.width;
	const base = shotOf(o, { ground, light, layout: 'flat', fit: 0.84, view: { tilt: 0, turn: 0 } });
	// a fixed exposure, so the inks come out true on any ground (measured on a dark ground, tone mapping's toe would brighten everything else)
	const shot = { ...base, exposure: base.exposure ?? STATIONERY_EXPOSURE, lens: lensOf(o, { aperture: 0.004, blur: 0.3 }) };

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const u = 1 / UNIT;
		const tooth = keep(toothMap(THREE, seed));
		tooth.repeat.set(4, 4);
		for (const { piece, x, z } of grid) {
			const size = P[piece];
			const map = keep(new THREE.CanvasTexture(prints[piece]));
			map.colorSpace = THREE.SRGBColorSpace;
			map.anisotropy = 8;
			const isCard = piece === 'front' || piece === 'back';
			const face = keep(stockMaterial(THREE, isCard ? cardStock : stock, map, tooth));
			const under = keep(stockMaterial(THREE, isCard ? cardStock : stock, null, tooth));
			const edge = keep(boardMaterial(THREE, mix(isCard && piece === 'front' ? brand.color : brand.paper, '#000000', 0.05)));
			const m = cardMesh(THREE, { w: size.width * u, h: size.height * u, t: size.thickness * u, r: 0, top: face, bottom: under, edge });
			m.position.set(x * u, 0.0008, z * u);
			scene.add(m);
		}
		const feet = grid.map(({ piece, x, z }) => ({ x, z, w: P[piece].width, d: P[piece].height, lift: piece === 'envelope' ? 0.4 : 0.22 }));
		scene.add(await contactMesh(THREE, { feet, light, strength: 1.1 }));
		return { width: span * u, height: P.letter.height * u, center: [0, 0, 0] };
	});
}
