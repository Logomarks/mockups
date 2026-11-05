/**
 * @module @logomarks/mockups/materials/wall
 *
 * The wall a poster goes up on: painted plaster (any colour) or brick. The
 * wall fills the frame; its relief (the plaster's bumps, the bricks' faces
 * and recessed joints) can be laid again over paper pasted flat to it, so
 * a wheatpasted poster takes the wall's texture as real ones do.
 */

import { el } from '../render/svg.js';
import { isHex } from '../util/color.js';
import { clamp } from '../util/num.js';
import { plasterWall, plasterFilter } from './plaster.js';
import { brickWall, BRICK } from '../parts/brick.js';

/** The named walls. */
export const WALLS = Object.freeze({ plaster: '#e8e5df', brick: '#9b5b45' });

/**
 * A wall from its option.
 *
 * @param {unknown} spec `'plaster'` (off-white), `'brick'`, or a hex colour (painted plaster).
 * @param {string} object The object asking, for the error.
 * @returns {{ kind: 'plaster' | 'brick', color: string }} The wall.
 * @throws {TypeError} For anything else.
 */
export function resolveWall(spec = 'plaster', object = 'wall') {
	if (spec === 'plaster' || spec === 'brick') return { kind: spec, color: WALLS[spec] };
	if (isHex(spec)) return { kind: 'plaster', color: /** @type {string} */ (spec) };
	throw new TypeError(`${object}: wall is 'plaster', 'brick' or a hex colour (got ${JSON.stringify(spec)})`);
}

/**
 * The relief of a brick wall's joints, lit from above: the brick's top edge catches the light, the joint under it is in its shadow, as a tile repeating with the bricks.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {number} k Pixels per metre.
 * @param {number} light Where the light is, left (-1) to right (1).
 * @returns {string} A fill (`url(#…)`).
 */
function joints(sc, k, light) {
	const bl = (BRICK.length + BRICK.joint) * k;
	const bh = (BRICK.height + BRICK.joint) * k;
	const j = BRICK.joint * k;
	const p = sc.id('joints');
	const lx = clamp(light, -1, 1);
	const row = (y, x0) =>
		[x0 - bl, x0, x0 + bl]
			.map(
				(x) =>
					el('rect', { x, y, width: bl - j, height: Math.max(0.6, j * 0.18), fill: '#fff', 'fill-opacity': 0.22 }) +
					el('rect', { x, y: y + bh - j, width: bl, height: j * 0.55, fill: '#000', 'fill-opacity': 0.32 }) +
					el('rect', { x: lx >= 0 ? x - j : x + bl - j, y, width: j * 0.5, height: bh - j, fill: '#000', 'fill-opacity': 0.22 }),
			)
			.join('');
	sc.def(el('pattern', { id: p, patternUnits: 'userSpaceOnUse', width: bl, height: 2 * bh }, row(0, 0), row(bh, bl / 2)));
	return `url(#${p})`;
}

/**
 * The wall, filling `[0, width] × [0, height]`.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {{ kind: 'plaster' | 'brick', color: string }} wall The wall.
 * @param {{ width: number, height: number, mm: number, light: number, seed: string }} o Its size (px), pixels per millimetre, the light, the seed.
 * @returns {string} The markup.
 */
export function wallLayer(sc, wall, { width, height, mm, light, seed }) {
	if (wall.kind === 'plaster') return plasterWall(sc, { width, height, mm, color: wall.color, light, seed });
	const k = mm * 1000;
	return el(
		'g',
		{},
		brickWall(sc, { width, height, scale: k, color: wall.color, light, seed }),
		el('rect', { width, height, fill: joints(sc, k, light) }),
		el('rect', { width, height, fill: '#fff', filter: plasterFilter(sc, { mm: mm * 1.6, light, seed, depth: 1.5 }), style: 'mix-blend-mode:multiply', opacity: 0.5 }),
	);
}

/**
 * The wall's relief, for paper pasted flat to it: drawn in the wall's own coordinates, to clip to the paper.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {{ kind: 'plaster' | 'brick', color: string }} wall The wall.
 * @param {{ width: number, height: number, mm: number, light: number, seed: string }} o As for `wallLayer`.
 * @returns {string} The markup.
 */
export function wallRelief(sc, wall, { width, height, mm, light, seed }) {
	const bump = el('rect', { width, height, fill: '#fff', filter: plasterFilter(sc, { mm: wall.kind === 'brick' ? mm * 1.6 : mm, light, seed, depth: 0.8 }), style: 'mix-blend-mode:multiply', opacity: 0.45 });
	if (wall.kind === 'plaster') return bump;
	return el('g', {}, el('rect', { width, height, fill: joints(sc, mm * 1000, light), opacity: 0.9 }), bump);
}
