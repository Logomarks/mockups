/**
 * @module @logomarks/mockups/three/tabletop
 *
 * What the café and takeaway scenes share: a studio shot of things on a
 * table, through a lens. Lying things (napkins, a sleeve of chopsticks, a
 * pizza box) are seen on the desk; standing things (a cup, a bag) stand on
 * a sweep printed with the same surface, so there's no horizon. A studio
 * environment gives paper and plastic soft, long highlights; the 2D
 * contact shadows ground each thing where it touches. Also the print every
 * one of them carries: the brand's mark (and name) set on a canvas in one
 * ink.
 */

import { scene as doc } from '../render/scene.js';
import { el } from '../render/svg.js';
import { lockupIn } from '../parts/lockup.js';
import { resolveSurface } from '../materials/desk.js';
import { shotOf } from './printshot.js';
import { lensOf } from './lens.js';
import { drawSvg } from './printart.js';
import { deskCanvas, deskMesh, contactMesh, UNIT } from './deskplane.js';
import { studioEnvironment } from './studioenv.js';

/**
 * A table scene's shot and its desk, from its options.
 *
 * @param {import('../util/reader.js').Reader} o The scene's options.
 * @param {import('./tabletop.js').TableDefaults} d The scene's own defaults.
 * @returns {Promise<import('./tabletop.js').Table>} The shot, the surface and its drawing, and the light, shadow and seed read.
 * @throws {TypeError} For a bad option.
 */
export async function tableShot(o, { layout, fit, view, surface = 'oak', aperture, span = 1000, seed = 'table' }) {
	const light = o.num('light', 0.35, -1, 1);
	const strength = o.num('shadow', 1, 0, 3);
	const s = o.text('seed', seed);
	const surf = resolveSurface(/** @type {import('../materials/desk.js').SurfaceOption} */ (o.raw('surface')), surface);
	const desk = surf.texture ? await deskCanvas(surf, { span, light, seed: s }) : null;
	const shot = shotOf(o, { ground: desk?.color ?? surf.color, light, layout, fit, view });
	// standing things stand on a sweep printed with the surface, so the table runs up into the backdrop without a horizon
	if (layout === 'upright' && desk) shot.backdrop = { canvas: desk.canvas, span: desk.span / UNIT };
	shot.lens = lensOf(o, { aperture });
	return { shot, surf, desk, light, strength, seed: s };
}

/**
 * Dresses a table scene: the studio for gloss to reflect, the desk under lying things, and the contact shadows.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('three').Scene} scene The scene.
 * @param {<T extends { dispose(): void }>(t: T) => T} keep Keeps what's made, to free with the scene.
 * @param {import('./tabletop.js').Table} t The table.
 * @param {{ feet: import('./deskplane.js').Footprint[], shade?: number, gloss?: number }} o The footprints to shadow, how dark (× the scene's shadow, 1), and how strongly the studio reflects (1.2).
 * @returns {Promise<void>}
 */
export async function dressTable(THREE, scene, keep, t, { feet, shade = 1, gloss = 1.2 }) {
	scene.environment = keep(studioEnvironment(THREE, { light: t.light }));
	scene.environmentIntensity = gloss;
	if (t.desk && t.shot.layout === 'flat') scene.add(deskMesh(THREE, t.desk, t.surf.texture, 5));
	if (feet.length && t.strength > 0) scene.add(await contactMesh(THREE, { feet, light: t.light, strength: t.strength * t.surf.shadow * shade }));
}

/**
 * The brand printed on a panel in one ink: its mark (and name), as large as fits a box on the panel, on the panel's colour or clear.
 *
 * @param {import('./tabletop.js').PrintSpec} o The panel and what's printed on it.
 * @returns {Promise<HTMLCanvasElement>} The canvas, the panel's proportions.
 */
export function brandPrint({ mark, name = '', ink, size, box, color = null, layout = 'stack', turn = 0, px = 8 }) {
	const w = Math.round(size[0] * px);
	const h = Math.round(size[1] * px);
	const sc = doc({ width: w, height: h, key: `print:${name}:${ink}` });
	if (color) sc.add(el('rect', { width: w, height: h, fill: color }));
	const [bx, by, bw, bh] = box.map((v) => v * px);
	// turned a quarter, the lockup is set in the box's turned frame and rotated back into it
	const quarter = Math.abs(turn) === 90;
	const inner = lockupIn(sc, { mark, name, ink, size: quarter ? bw : bh, layout, x: quarter ? -bh / 2 : bx, y: quarter ? -bw / 2 : by, width: quarter ? bh : bw, height: quarter ? bw : bh });
	sc.add(quarter ? el('g', { transform: `translate(${bx + bw / 2} ${by + bh / 2}) rotate(${turn})` }, inner) : inner);
	return drawSvg(sc.svg(), w, h);
}
