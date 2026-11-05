/**
 * @module @logomarks/mockups/three/vinyl
 *
 * Vinyl in 3D: the sleeve a thin printed box, the records discs of
 * physical vinyl (clear and tinted transmit light), 12" or 7". By default
 * they stand on a paper sweep as in a product shot, the sleeve in front and
 * the records behind it peeking out, all leaning back a touch; or they lie
 * flat on the ground (`layout: 'flat'`, the 2D mockup's view), or lie as
 * they were tipped out of the sleeve (`'scatter'`). Printed props (an
 * insert, a signed card) go with them. The ground is a plain colour or a
 * drawn surface; the light is the studio's or a phone's flash; the camera
 * can drift. The layout, labels, surfaces, splatter and marble come from
 * the 2D modules, so the two versions match.
 */

import { resolveSurface } from '../materials/desk.js';
import { resolveVinyl } from '../materials/vinyl.js';
import { resolvePrint, inkCanvas } from '../materials/ink.js';
import { resolveLabels } from '../parts/label.js';
import { placements, VINYL_SIZES } from '../objects/vinyl.js';
import { clamp } from '../util/num.js';
import { turnedBox, union } from '../util/fit.js';
import { texture, coverCanvas, labelCanvas, bodyCanvas, grooveMaps, shadowCanvas } from './textures.js';
import { recordMesh } from './record.js';
import { sleeveMesh } from './sleeve.js';
import { paperMaterial } from './materials.js';
import { cardMesh } from './card.js';
import { footShadow } from './foot.js';
import { trimCanvas } from './printart.js';
import { deskCanvas, deskMesh, contactMesh, UNIT } from './deskplane.js';
import { shoot } from './shot.js';

/** How far the records and sleeve lean back when standing, degrees. */
const LEAN = 3;

/** The layouts. */
export const VINYL_SCENE_LAYOUTS = /** @type {const} */ (['upright', 'flat', 'scatter']);

/** A prop card's thickness, in mm. */
const CARD_MM = 0.4;

/**
 * A vinyl scene on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas to draw on.
 * @param {import('./vinyl.js').VinylSceneOptions} options The artwork (inline), the same options as the 2D `vinyl`, the record's size, the layout, props, the light, the view and the drift.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once (and frame by frame while it drifts).
 * @throws {TypeError} For a bad option (as `vinyl` does).
 */
export async function vinylScene(canvas, options) {
	const { art, vinyl: spec = 'clear', labels = 'auto', title = '', seed = 'vinyl', layout = 'upright' } = options;
	if (!art) throw new TypeError('vinylScene: art is required');
	if (!VINYL_SCENE_LAYOUTS.includes(layout)) throw new TypeError(`vinylScene: layout is 'upright', 'flat' or 'scatter' (got ${JSON.stringify(layout)})`);
	const size = options.size ?? '12in';
	if (!Object.hasOwn(VINYL_SIZES, size)) throw new TypeError(`vinylScene: size is '12in' or '7in' (got ${JSON.stringify(size)})`);
	const dims = VINYL_SIZES[size];
	const format = options.format ?? (size === '7in' ? 'single' : 'double');
	const side = options.side ?? (format === 'double' ? 'both' : 'right');
	const peek = clamp(options.peek ?? 0.53, 0.1, 0.9);
	const { light, lighting } = resolveLight(options.light);
	const surf = resolveSurface(options.ground, 'light', 'ground');
	const print = resolvePrint(options.print, 'vinylScene');
	const props = resolveProps(options.props, dims, print);
	const drift = resolveDrift(options.drift);
	const specs = Array.isArray(spec) ? spec : [spec, spec];
	const materials = [resolveVinyl(specs[0]), resolveVinyl(specs[1] ?? specs[0])];
	const sides = resolveLabels(labels, title, art, dims.speed);
	const recs = placements(format, side, peek);
	const strength = clamp(options.shadow ?? 1, 0, 3);
	const flash = lighting === 'flash';

	// sizes in sleeve units
	const RECORD = dims.record / dims.sleeve;
	const R = RECORD / 2;
	const THICK = dims.thickness / dims.sleeve;
	const labelRadius = dims.label / dims.record;
	const tracks = /** @type {[number, number]} */ (size === '7in' ? [1, 3] : [5, 8]);
	const depth = size === '7in' ? 0.006 : format === 'double' ? 0.016 : 0.009;

	// the 2D layout, in sleeve units
	const left = Math.max(0.5, ...recs.filter((r) => r.dir < 0).map((r) => 0.5 + r.peek * RECORD));
	const right = Math.max(0.5, ...recs.filter((r) => r.dir > 0).map((r) => 0.5 + r.peek * RECORD));
	const cx = (left - right) / 2;
	const xs = recs.map((p) => cx + p.dir * (0.5 + p.peek * 2 * R - R));
	const loose = layout === 'scatter' ? scatter(recs.length, R, props) : null;

	// a drawn surface: the desk under a lay, or the sweep's paper standing
	const desk = surf.texture ? await deskCanvas(surf, { span: dims.sleeve * 3.2, light, seed }) : null;
	const stand = layout === 'upright';
	const shot = {
		...options,
		ground: { color: desk?.color ?? surf.color },
		light,
		layout: stand ? /** @type {const} */ ('upright') : /** @type {const} */ ('flat'),
		lighting,
		backdrop: stand && desk ? { canvas: desk.canvas, span: desk.span / dims.sleeve } : null,
		drift,
	};

	return shoot(canvas, shot, async (THREE, scene, keep) => {
		const cover = keep(texture(THREE, await printed(coverCanvas(art), print)));
		const labelTex = await Promise.all(sides.map(async (lb) => keep(texture(THREE, await labelCanvas(art, lb)))));
		const discs = [];
		for (const [i, p] of recs.entries()) {
			const m = materials[p.label];
			const s = `${seed}:${i}`;
			const drawn = m.kind === 'splatter' || m.kind === 'marble' ? await bodyCanvas(art, m, s) : null;
			const body = drawn && { color: keep(texture(THREE, drawn.color)), mask: drawn.mask && keep(texture(THREE, drawn.mask, false)) };
			const maps = grooveMaps(THREE, s, 1024, { label: labelRadius, tracks });
			Object.values(maps).forEach(keep);
			discs.push({ mesh: recordMesh(THREE, { radius: R, material: m, maps, label: labelTex[p.label], body, labelRadius, thickness: THICK }), m });
		}
		const sleeve = sleeveMesh(THREE, cover, format, depth);
		const cards = [];
		for (const p of props) {
			const map = keep(texture(THREE, await printed(trimCanvas(p.art, { trim: [p.w * dims.sleeve, p.h * dims.sleeve], bleed: p.bleed, px: 12 }), p.print)));
			const back = paperMaterial(THREE, null, p.print?.paper ?? '#f2f0ea');
			cards.push(cardMesh(THREE, { w: p.w, h: p.h, t: CARD_MM / dims.sleeve, r: 0.6 / dims.sleeve, top: paperMaterial(THREE, map), bottom: back, edge: back }));
		}
		/** Sleeve units to mm. */
		const mm = (v) => v * dims.sleeve;
		/** The 2D contact shadows under things lying (footprints in mm round the origin), on a plane at the sleeve's scale. */
		const contact = async (feet) => {
			const mesh = await contactMesh(THREE, { feet, light: flash ? 0 : light, strength: strength * surf.shadow * (flash ? 0.5 : 0.8), px: 1200 / dims.sleeve });
			mesh.scale.setScalar(UNIT / dims.sleeve);
			scene.add(mesh);
		};
		// a drawn desk under a lay, at the sleeve's scale
		if (desk && !stand) {
			const plane = deskMesh(THREE, desk, surf.texture);
			plane.scale.setScalar(UNIT / dims.sleeve);
			scene.add(plane);
		}

		if (stand) {
			const lean = new THREE.Group();
			lean.rotation.x = (-LEAN * Math.PI) / 180;
			scene.add(lean);
			for (const [i, { mesh, m }] of discs.entries()) {
				const back = recs.length - 1 - i;
				const see = m.opacity < 0.98 || (m.base !== null && m.base.opacity < 0.98);
				// standing behind the sleeve, the back one furthest back; turned a little so their type isn't level
				mesh.rotation.set(Math.PI / 2, ((i * 2.3 + 0.7) % 1.4) - 0.7, 0);
				mesh.position.set(xs[i], R + 0.002, -(THICK * 1.5 + back * THICK * 1.6));
				lean.add(mesh);
				const foot = footShadow(THREE, { width: 0.26, depth: 0.02, soft: 0.03, strength: (see ? 0.3 : 0.5) * Math.min(1, strength) });
				foot.position.set(xs[i], foot.position.y, mesh.position.z);
				scene.add(foot);
			}
			sleeve.rotation.x = Math.PI / 2;
			sleeve.position.set(cx, 0.5 + 0.001, depth / 2);
			lean.add(sleeve);
			const foot = footShadow(THREE, { width: 1, depth, soft: 0.03, strength: 0.6 * Math.min(1, strength) });
			foot.position.set(cx, foot.position.y, depth / 2);
			scene.add(foot);
			// props stand propped against the sleeve's foot, leaning back on it
			const tip = (78 * Math.PI) / 180;
			cards.forEach((card, i) => {
				const p = props[i];
				card.rotation.set(tip, ((i % 2 ? 1 : -1) * (3 + 2 * i) * Math.PI) / 180, 0, 'YXZ');
				card.position.set(cx + 0.22 - i * 0.3, (p.h / 2) * Math.sin(tip), depth + 0.012 + (p.h / 2) * Math.cos(tip) + i * 0.01);
				scene.add(card);
				const shadow = footShadow(THREE, { width: p.w, depth: 0.01, soft: 0.02, strength: 0.45 * Math.min(1, strength) });
				shadow.position.set(card.position.x, shadow.position.y, card.position.z + (p.h / 2) * Math.cos(tip));
				scene.add(shadow);
			});
			return { width: left + right, height: 1, center: [0, 0.5, 0] };
		}

		if (loose) {
			// tipped out: everything at its own place and turn, the group centred on the origin
			const { at, width, depth: deep } = loose;
			const place = (mesh, q, y) => {
				mesh.position.set(q.x, y, q.z);
				mesh.rotation.y = (-q.angle * Math.PI) / 180;
				scene.add(mesh);
			};
			discs.forEach(({ mesh }, i) => place(mesh, at.records[i], THICK / 2 + i * THICK));
			const top = discs.length * THICK + depth + 0.0015;
			place(sleeve, at.sleeve, top - depth / 2);
			cards.forEach((card, i) => place(card, at.props[i], top + 0.001 + i * (CARD_MM / dims.sleeve)));
			await contact([
				...at.records.map((q, i) => ({ x: mm(q.x), z: mm(q.z), w: mm(2 * R), d: mm(2 * R), radius: mm(R), lift: 0.05 + 0.05 * i })),
				{ x: mm(at.sleeve.x), z: mm(at.sleeve.z), w: mm(1), d: mm(1), angle: at.sleeve.angle, lift: 0.2 },
				...at.props.map((q, i) => ({ x: mm(q.x), z: mm(q.z), w: mm(props[i].w), d: mm(props[i].h), angle: q.angle, lift: 0.3 })),
			]);
			return { width, height: deep, center: [0, 0, 0] };
		}

		let z = 0;
		for (const [i, { mesh }] of discs.entries()) {
			mesh.position.set(xs[i], THICK / 2 + z, 0);
			mesh.rotation.y = (i * 1.7 + 0.4) % (Math.PI * 2); // labels' type at different angles, as records are put down
			if (side !== 'both') z += THICK;
			scene.add(mesh);
		}
		const top = z + THICK + depth + 0.002;
		sleeve.position.set(cx, top - depth / 2, 0);
		scene.add(sleeve);
		// props lie over the sleeve's lower corner, each a little further along
		const lying = cards.map((card, i) => {
			const q = { x: cx + 0.2 - i * 0.24, z: 0.36 + i * 0.08, angle: 7 - i * 11 };
			card.position.set(q.x, top + 0.001 + i * (CARD_MM / dims.sleeve), q.z);
			card.rotation.y = (-q.angle * Math.PI) / 180;
			scene.add(card);
			return q;
		});
		// the contact shadows: the 2D mockup's, laid on the ground just under everything
		const casters = discs.map(({ m }, i) => ({ x: xs[i], r: R, opacity: m.kind === 'splatter' && m.base ? m.base.opacity : m.opacity }));
		const area = { width: left + right + 0.8, depth: 1.8 };
		const shade = keep(texture(THREE, await shadowCanvas(art, { ...area, cx, records: casters, light: flash ? 0 : light, strength: strength * surf.shadow * 0.8 })));
		const catcher = new THREE.Mesh(new THREE.PlaneGeometry(area.width, area.depth), new THREE.MeshBasicMaterial({ map: shade, transparent: true, depthWrite: false, toneMapped: false }));
		catcher.rotation.x = -Math.PI / 2;
		catcher.position.y = 0.0004;
		catcher.renderOrder = -1;
		scene.add(catcher);
		if (lying.length) await contact(lying.map((q, i) => ({ x: mm(q.x), z: mm(q.z), w: mm(props[i].w), d: mm(props[i].h), angle: q.angle, lift: 0.3 })));
		// the group: the records and sleeve, and any prop reaching past them (kept centred, so the camera's aim stays put)
		const half = (left + right) / 2;
		const reach = union([{ x0: -half, y0: -0.5, x1: half, y1: 0.5 }, ...lying.map((q, i) => turnedBox(q.x, q.z, props[i].w, props[i].h, q.angle))]);
		return { width: 2 * Math.max(-reach.x0, reach.x1), height: 2 * Math.max(-reach.y0, reach.y1), center: [0, 0, 0] };
	});
}

/**
 * Where things lie when tipped out of the sleeve, in sleeve units, centred on the origin: the sleeve up and to the right, the records beside it to the left, the props in front, each turned a little.
 *
 * @param {number} count How many records.
 * @param {number} R A record's radius.
 * @param {{ w: number, h: number }[]} props The props' sizes.
 * @returns {import('./vinyl.js').Scatter} Each thing's centre (x across, z towards the camera) and turn in degrees, and the group's width and depth.
 */
export function scatter(count, R, props) {
	const sleeve = { x: 0.3, z: -0.22, angle: -8 };
	const records = [
		{ x: -0.3, z: 0.04, angle: 23 },
		{ x: -0.5, z: -0.36, angle: -40 },
	].slice(0, count);
	// two records: the one further back is under the other
	if (count > 1) records.reverse();
	const cards = props.map((p, i) => ({ x: 0.06 + 0.2 * i, z: 0.28 + p.h / 2 + 0.06 * i, angle: 6 - 11 * i }));
	const box = union([
		turnedBox(sleeve.x, sleeve.z, 1, 1, sleeve.angle),
		...records.map((q) => ({ x0: q.x - R, y0: q.z - R, x1: q.x + R, y1: q.z + R })),
		...cards.map((q, i) => turnedBox(q.x, q.z, props[i].w, props[i].h, q.angle)),
	]);
	const ox = (box.x0 + box.x1) / 2;
	const oz = (box.y0 + box.y1) / 2;
	const centre = (q) => ({ ...q, x: q.x - ox, z: q.z - oz });
	return { at: { sleeve: centre(sleeve), records: records.map(centre), props: cards.map(centre) }, width: box.x1 - box.x0, depth: box.y1 - box.y0 };
}

/**
 * The light from its option: a number places the studio's key, `'studio'` is the key at its usual place, `'flash'` a phone's flash.
 *
 * @param {unknown} [v=0.35] The option.
 * @returns {{ light: number, lighting: 'studio' | 'flash' }} Where the light is, and which.
 * @throws {TypeError} For anything else.
 */
export function resolveLight(v = 0.35) {
	if (v === 'studio' || v === 'flash') return { light: 0.35, lighting: v };
	if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`vinylScene: light is 'studio', 'flash' or a number from -1 to 1 (got ${JSON.stringify(v)})`);
	return { light: clamp(v, -1, 1), lighting: 'studio' };
}

/**
 * How far the camera drifts, from its option.
 *
 * @param {unknown} v `true` (1), `false` or nothing (0), or 0–1.
 * @returns {number} 0–1.
 * @throws {TypeError} For anything else.
 */
export function resolveDrift(v) {
	if (v === undefined || v === false) return 0;
	if (v === true) return 1;
	if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`drift is true, false or a number from 0 to 1 (got ${JSON.stringify(v)})`);
	return clamp(v, 0, 1);
}

/**
 * The props from their option, sized in sleeve units.
 *
 * @param {unknown} v The option: a list of artworks or `{ art, width, height, bleed, print }` (mm).
 * @param {{ sleeve: number }} dims The record's size.
 * @param {import('../materials/ink.js').InkPrint | null} print The sleeve's print, which props share unless they say otherwise.
 * @returns {import('./vinyl.js').Prop[]} The props.
 * @throws {TypeError} For anything else.
 */
export function resolveProps(v, dims, print) {
	if (v === undefined) return [];
	if (!Array.isArray(v)) throw new TypeError('vinylScene: props is a list of artworks or { art, width, height, bleed, print }');
	return v.map((p, i) => {
		const o = /** @type {Record<string, unknown>} */ (p && typeof p === 'object' && !(p instanceof Uint8Array) && !(p instanceof ArrayBuffer) ? p : { art: p });
		if (o.art === undefined || o.art === null || o.art === '') throw new TypeError(`vinylScene: props[${i}] has no art`);
		const num = (k, fallback, lo, hi) => {
			const x = o[k] ?? fallback;
			if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError(`vinylScene: props[${i}].${k} is a number (got ${JSON.stringify(o[k])})`);
			return clamp(x, lo, hi);
		};
		const w = num('width', dims.sleeve * 0.62, 20, dims.sleeve * 1.2);
		const h = num('height', w * 0.84, 20, dims.sleeve * 1.2);
		return { art: /** @type {import('../types.js').Art} */ (o.art), w: w / dims.sleeve, h: h / dims.sleeve, bleed: num('bleed', 0, 0, 10), print: o.print === undefined ? print : resolvePrint(o.print, `vinylScene: props[${i}]`) };
	});
}

/**
 * A drawn canvas, printed in one ink if asked.
 *
 * @param {Promise<HTMLCanvasElement>} drawn The art, drawn.
 * @param {import('../materials/ink.js').InkPrint | null} print The ink and stock, or `null` for full colour.
 * @returns {Promise<HTMLCanvasElement>} The canvas.
 */
async function printed(drawn, print) {
	const c = await drawn;
	return print ? inkCanvas(c, print) : c;
}
