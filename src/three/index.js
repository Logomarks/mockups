/**
 * @module @arraypress/mockups/3d
 *
 * Vinyl in 3D with three.js (a peer dependency, imported only when a scene
 * is made): the sleeve a thin printed box, the records discs of physical
 * vinyl (clear and tinted transmit light), lying flat on a seamless ground
 * in a soft studio light, with a camera that looks straight down (the 2D
 * mockup's view) or across at an angle. The layout, labels, splatter and
 * marble come from the 2D modules, so the two versions match. Renders on
 * demand: `setView` re-renders, `toBlob` reads the frame.
 */

import { resolveGround } from '../materials/ground.js';
import { resolveVinyl } from '../materials/vinyl.js';
import { resolveLabels } from '../parts/label.js';
import { placements, RECORD } from '../objects/vinyl.js';
import { clamp } from '../util/num.js';
import { texture, coverCanvas, labelCanvas, bodyCanvas, grooveMaps, shadowCanvas } from './textures.js';
import { recordMesh, THICKNESS } from './record.js';
import { sleeveMesh } from './sleeve.js';
import { makeRenderer, makeStage, expose } from './stage.js';
import { place, FRONT } from './view.js';

/**
 * A vinyl scene on a canvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas to draw on.
 * @param {import('./index.js').VinylSceneOptions} options The artwork (inline), the same options as the 2D `vinyl`, and the view.
 * @returns {Promise<import('./index.js').VinylScene>} The scene, drawn once.
 * @throws {TypeError} For a bad option (as `vinyl` does).
 */
export async function vinylScene(canvas, options) {
	const { art, format = 'double', vinyl: spec = 'clear', labels = 'auto', title = '', seed = 'vinyl' } = options;
	if (!art) throw new TypeError('vinylScene: art is required');
	const side = options.side ?? (format === 'double' ? 'both' : 'right');
	const peek = clamp(options.peek ?? 0.53, 0.1, 0.9);
	const light = clamp(options.light ?? 0.35, -1, 1);
	const width = options.width ?? canvas.width;
	const height = options.height ?? canvas.height;
	const g = resolveGround(options.ground);
	const specs = Array.isArray(spec) ? spec : [spec, spec];
	const materials = [resolveVinyl(specs[0]), resolveVinyl(specs[1] ?? specs[0])];
	const sides = resolveLabels(labels, title);
	const recs = placements(format, side, peek);

	const THREE = await import('three');
	const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
	const renderer = makeRenderer(THREE, canvas, { width, height, pixelRatio: options.pixelRatio ?? 1, exposure: options.exposure ?? 1 });
	const stage = makeStage(THREE, renderer, RoomEnvironment, { ground: g.color, light });
	const { scene } = stage;
	/** @type {{ dispose(): void }[]} */
	const owned = [];
	const keep = (t) => (owned.push(t), t);

	// layout: the 2D mockup's, in sleeve units, on the ground (its y is our -z)
	const R = RECORD / 2;
	const left = Math.max(0.5, ...recs.filter((r) => r.dir < 0).map((r) => 0.5 + r.peek * RECORD));
	const right = Math.max(0.5, ...recs.filter((r) => r.dir > 0).map((r) => 0.5 + r.peek * RECORD));
	const cx = (left - right) / 2;
	const cover = keep(texture(THREE, await coverCanvas(art)));
	const labelTex = await Promise.all(sides.map(async (lb) => keep(texture(THREE, await labelCanvas(art, lb)))));
	let y = THICKNESS / 2;
	/** @type {{ x: number, r: number, opacity: number }[]} */
	const casters = [];
	for (const [i, p] of recs.entries()) {
		const m = materials[p.label];
		const s = `${seed}:${i}`;
		const drawn = m.kind === 'splatter' || m.kind === 'marble' ? await bodyCanvas(art, m, s) : null;
		const body = drawn && { color: keep(texture(THREE, drawn.color)), mask: drawn.mask && keep(texture(THREE, drawn.mask, false)) };
		const maps = grooveMaps(THREE, s);
		Object.values(maps).forEach(keep);
		const rec = recordMesh(THREE, { radius: R, material: m, maps, label: labelTex[p.label], body });
		rec.position.set(cx + p.dir * (0.5 + p.peek * 2 * R - R), y, 0);
		casters.push({ x: rec.position.x, r: R, opacity: m.kind === 'splatter' && m.base ? m.base.opacity : m.opacity });
		rec.rotation.y = (i * 1.7 + 0.4) % (Math.PI * 2); // labels' type at different angles, as records are put down
		scene.add(rec);
		if (side !== 'both') y += THICKNESS;
	}
	const sleeve = sleeveMesh(THREE, cover, format);
	const depth = /** @type {import('three').BoxGeometry} */ (sleeve.geometry).parameters.height;
	sleeve.position.set(cx, y + THICKNESS / 2 + depth / 2 + 0.002, 0);
	scene.add(sleeve);

	// the contact shadows: the 2D mockup's, laid on the ground just under everything
	const area = { width: left + right + 0.8, depth: 1.8 };
	const contact = keep(texture(THREE, await shadowCanvas(art, { ...area, cx, records: casters, light, strength: clamp(options.shadow ?? 1, 0, 3) * 0.8 })));
	const catcher = new THREE.Mesh(new THREE.PlaneGeometry(area.width, area.depth), new THREE.MeshBasicMaterial({ map: contact, transparent: true, depthWrite: false, toneMapped: false }));
	catcher.rotation.x = -Math.PI / 2;
	catcher.position.y = 0.0004;
	catcher.renderOrder = -1;
	scene.add(catcher);

	const camera = new THREE.PerspectiveCamera();
	const group = { width: left + right, depth: 1, aspect: width / height, fit: clamp(options.fit ?? 0.89, 0.2, 1) };
	let view = { ...FRONT, ...options.view };
	const render = () => {
		place(camera, view, group);
		renderer.render(scene, camera);
	};
	// the ground the colour asked for: measured in the straight-on view, near the top corner
	if (options.exposure === undefined) {
		const asked = view;
		view = { ...FRONT };
		expose(renderer, render, g.color, [0.03, 0.03]);
		view = asked;
	}
	render();
	return {
		canvas,
		render,
		setView(next) {
			view = { ...view, ...next };
			render();
		},
		async toBlob(type = 'image/png', quality = 0.92) {
			render();
			if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality });
			return new Promise((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error('toBlob: the canvas gave no image'))), type, quality));
		},
		dispose() {
			scene.traverse((o) => {
				if (o instanceof THREE.Mesh) {
					o.geometry.dispose();
					for (const mat of [o.material].flat()) mat.dispose();
				}
			});
			owned.forEach((t) => t.dispose());
			stage.dispose();
			renderer.dispose();
		},
	};
}
