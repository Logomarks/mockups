/**
 * @module @logomarks/mockups/three/shot
 *
 * What every 3D scene shares: three.js loaded on first use, the renderer
 * and studio, the camera for a flat lay or for things standing, the
 * exposure measured so bare ground comes out its own colour, and the
 * handle a caller gets back (`render`, `setView`, `toBlob`, `dispose`).
 * Each object only builds its meshes into the scene. A scene that moves
 * (the camera drifting, a builder's own `tick`) draws its frames through
 * the loop: on screen only, and not at all with reduced motion.
 */

import { clamp } from '../util/num.js';
import { makeRenderer, makeStage, expose } from './stage.js';
import { place, placeUpright, FRONT, LEVEL } from './view.js';
import { loop, drifted } from './loop.js';

/**
 * A scene on a canvas, drawn once.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {import('./shot.js').ShotOptions} o How to shoot it: the ground (resolved), the light, the layout, the lighting, a backdrop for the sweep, the drawing's size, the exposure (measured by default under the studio's lights), the fit, the view, and how far the camera drifts.
 * @param {(THREE: typeof import('three'), scene: import('three').Scene, keep: <T extends { dispose(): void }>(t: T) => T) => Promise<import('./shot.js').Group>} build Adds the meshes; resolves to the group's size (width and height standing, width and depth lying), its centre, and what changes each frame.
 * @returns {Promise<import('./shot.js').Shot>} The scene's handle.
 */
export async function shoot(canvas, o, build) {
	const width = o.width ?? canvas.width;
	const height = o.height ?? canvas.height;
	const upright = o.layout === 'upright';
	const THREE = await import('three');
	const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
	const renderer = makeRenderer(THREE, canvas, { width, height, pixelRatio: o.pixelRatio ?? 1, exposure: o.exposure ?? 1 });
	const lighting = o.lighting ?? 'studio';
	if (o.toneMapping === 'aces') renderer.toneMapping = THREE.ACESFilmicToneMapping;
	const stage = makeStage(THREE, renderer, RoomEnvironment, { ground: o.ground.color, light: o.light, layout: o.layout, lighting, backdrop: o.backdrop ?? null });
	const { scene } = stage;
	/** @type {{ dispose(): void }[]} */
	const owned = [];
	const group = await build(THREE, scene, (t) => (owned.push(t), t));
	const camera = new THREE.PerspectiveCamera();
	const frame = { aspect: width / height, fit: clamp(o.fit ?? 0.89, 0.2, 1) };
	const home = upright ? LEVEL : FRONT;
	let view = { ...home, ...o.view };
	let shown = view;
	const look = /** @type {[number, number, number]} */ (upright ? group.center : [0, 0, 0]);
	const render = () => {
		if (upright) placeUpright(camera, shown, { ...group, ...frame });
		else place(camera, shown, { width: group.width, depth: group.height, ...frame });
		camera.updateMatrixWorld();
		stage.follow(camera, look);
		renderer.render(scene, camera);
	};
	// the ground the colour asked for: measured in the front-on view, on bare paper near the top corner
	if (o.exposure === undefined && lighting === 'studio') {
		shown = { ...home };
		expose(renderer, render, o.ground.color, [0.03, 0.03]);
		shown = view;
	}
	group.tick?.(0);
	render();
	// the camera drifting, or the builder's own changes: frame by frame
	const drift = Math.max(0, o.drift ?? 0);
	const moving = drift > 0 || group.tick ? loop(canvas, (t) => {
		shown = drift > 0 ? drifted(view, t, drift) : view;
		group.tick?.(t);
		render();
	}, { fps: o.fps }) : null;
	return {
		canvas,
		render,
		setView(next) {
			view = shown = { ...view, ...next };
			render();
		},
		async toBlob(type = 'image/png', quality = 0.92) {
			render();
			if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality });
			return new Promise((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error('toBlob: the canvas gave no image'))), type, quality));
		},
		dispose() {
			moving?.stop();
			scene.traverse((m) => {
				if (m instanceof THREE.Mesh) {
					m.geometry.dispose();
					for (const mat of [m.material].flat()) mat.dispose();
				}
			});
			owned.forEach((t) => t.dispose());
			stage.dispose();
			renderer.dispose();
		},
	};
}
