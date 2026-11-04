/**
 * @module @arraypress/mockups/three/vinyl
 *
 * Vinyl in 3D: the sleeve a thin printed box, the records discs of
 * physical vinyl (clear and tinted transmit light). By default they stand
 * on a paper sweep as in a product shot, the sleeve in front and the
 * records behind it peeking out, all leaning back a touch; or they lie
 * flat on the ground (`layout: 'flat'`), the 2D mockup's view. The layout,
 * labels, splatter and marble come from the 2D modules, so the two
 * versions match.
 */

import { resolveGround } from '../materials/ground.js';
import { resolveVinyl } from '../materials/vinyl.js';
import { resolveLabels } from '../parts/label.js';
import { placements, RECORD } from '../objects/vinyl.js';
import { clamp } from '../util/num.js';
import { texture, coverCanvas, labelCanvas, bodyCanvas, grooveMaps, shadowCanvas } from './textures.js';
import { recordMesh, THICKNESS } from './record.js';
import { sleeveMesh } from './sleeve.js';
import { footShadow } from './foot.js';
import { shoot } from './shot.js';

/** How far the records and sleeve lean back when standing, degrees. */
const LEAN = 3;

/**
 * A vinyl scene on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas to draw on.
 * @param {import('./vinyl.js').VinylSceneOptions} options The artwork (inline), the same options as the 2D `vinyl`, the layout and the view.
 * @returns {Promise<import('./shot.js').Shot>} The scene, drawn once.
 * @throws {TypeError} For a bad option (as `vinyl` does).
 */
export async function vinylScene(canvas, options) {
	const { art, format = 'double', vinyl: spec = 'clear', labels = 'auto', title = '', seed = 'vinyl', layout = 'upright' } = options;
	if (!art) throw new TypeError('vinylScene: art is required');
	if (layout !== 'upright' && layout !== 'flat') throw new TypeError(`vinylScene: layout is 'upright' or 'flat' (got ${JSON.stringify(layout)})`);
	const side = options.side ?? (format === 'double' ? 'both' : 'right');
	const peek = clamp(options.peek ?? 0.53, 0.1, 0.9);
	const light = clamp(options.light ?? 0.35, -1, 1);
	const g = resolveGround(options.ground);
	const specs = Array.isArray(spec) ? spec : [spec, spec];
	const materials = [resolveVinyl(specs[0]), resolveVinyl(specs[1] ?? specs[0])];
	const sides = resolveLabels(labels, title, art);
	const recs = placements(format, side, peek);
	const strength = clamp(options.shadow ?? 1, 0, 3);

	// the 2D layout, in sleeve units
	const R = RECORD / 2;
	const left = Math.max(0.5, ...recs.filter((r) => r.dir < 0).map((r) => 0.5 + r.peek * RECORD));
	const right = Math.max(0.5, ...recs.filter((r) => r.dir > 0).map((r) => 0.5 + r.peek * RECORD));
	const cx = (left - right) / 2;
	const xs = recs.map((p) => cx + p.dir * (0.5 + p.peek * 2 * R - R));

	return shoot(canvas, { ...options, ground: g, light, layout }, async (THREE, scene, keep) => {
		const cover = keep(texture(THREE, await coverCanvas(art)));
		const labelTex = await Promise.all(sides.map(async (lb) => keep(texture(THREE, await labelCanvas(art, lb)))));
		const discs = [];
		for (const [i, p] of recs.entries()) {
			const m = materials[p.label];
			const s = `${seed}:${i}`;
			const drawn = m.kind === 'splatter' || m.kind === 'marble' ? await bodyCanvas(art, m, s) : null;
			const body = drawn && { color: keep(texture(THREE, drawn.color)), mask: drawn.mask && keep(texture(THREE, drawn.mask, false)) };
			const maps = grooveMaps(THREE, s);
			Object.values(maps).forEach(keep);
			discs.push({ mesh: recordMesh(THREE, { radius: R, material: m, maps, label: labelTex[p.label], body }), m });
		}
		const sleeve = sleeveMesh(THREE, cover, format);
		const depth = /** @type {import('three').BoxGeometry} */ (sleeve.geometry).parameters.height;
		const stand = layout === 'upright';
		/** @type {{ x: number, r: number, opacity: number }[]} */
		const casters = [];
		const lean = new THREE.Group();
		if (stand) lean.rotation.x = (-LEAN * Math.PI) / 180;
		scene.add(lean);
		let z = 0;
		for (const [i, { mesh, m }] of discs.entries()) {
			const back = recs.length - 1 - i;
			const see = m.opacity < 0.98 || (m.base !== null && m.base.opacity < 0.98);
			if (stand) {
				// standing behind the sleeve, the back one furthest back; turned a little so their type isn't level
				mesh.rotation.set(Math.PI / 2, ((i * 2.3 + 0.7) % 1.4) - 0.7, 0);
				mesh.position.set(xs[i], R + 0.002, -(THICKNESS * 1.5 + back * THICKNESS * 1.6));
				lean.add(mesh);
				const foot = footShadow(THREE, { width: 0.26, depth: 0.02, soft: 0.03, strength: (see ? 0.3 : 0.5) * Math.min(1, strength) });
				foot.position.set(xs[i], foot.position.y, mesh.position.z);
				scene.add(foot);
			} else {
				mesh.position.set(xs[i], THICKNESS / 2 + z, 0);
				mesh.rotation.y = (i * 1.7 + 0.4) % (Math.PI * 2); // labels' type at different angles, as records are put down
				if (side !== 'both') z += THICKNESS;
				scene.add(mesh);
			}
			casters.push({ x: xs[i], r: R, opacity: m.kind === 'splatter' && m.base ? m.base.opacity : m.opacity });
		}
		if (stand) {
			sleeve.rotation.x = Math.PI / 2;
			sleeve.position.set(cx, 0.5 + 0.001, depth / 2);
			lean.add(sleeve);
			const foot = footShadow(THREE, { width: 1, depth, soft: 0.03, strength: 0.6 * Math.min(1, strength) });
			foot.position.set(cx, foot.position.y, depth / 2);
			scene.add(foot);
			return { width: left + right, height: 1, center: [0, 0.5, 0] };
		}
		sleeve.position.set(cx, z + THICKNESS + depth / 2 + 0.002, 0);
		scene.add(sleeve);
		// the contact shadows: the 2D mockup's, laid on the ground just under everything
		const area = { width: left + right + 0.8, depth: 1.8 };
		const contact = keep(texture(THREE, await shadowCanvas(art, { ...area, cx, records: casters, light, strength: strength * 0.8 })));
		const catcher = new THREE.Mesh(new THREE.PlaneGeometry(area.width, area.depth), new THREE.MeshBasicMaterial({ map: contact, transparent: true, depthWrite: false, toneMapped: false }));
		catcher.rotation.x = -Math.PI / 2;
		catcher.position.y = 0.0004;
		catcher.renderOrder = -1;
		scene.add(catcher);
		return { width: left + right, height: 1, center: [0, 0, 0] };
	});
}
