/**
 * @module @arraypress/mockups/three/shot
 *
 * What every 3D scene shares: three.js loaded on first use, the renderer
 * and studio, the camera for a flat lay or for things standing, the
 * exposure measured so bare ground comes out its own colour, and the
 * handle a caller gets back (`render`, `setView`, `toBlob`, `dispose`).
 * Each object only builds its meshes into the scene.
 */

import { clamp } from '../util/num.js';
import { makeRenderer, makeStage, expose } from './stage.js';
import { place, placeUpright, FRONT, LEVEL } from './view.js';

/**
 * A scene on a canvas, drawn once.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas.
 * @param {object} o How to shoot it.
 * @param {{ color: string }} o.ground The ground, resolved.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {'flat' | 'upright'} o.layout Lying on the ground, or standing on a sweep.
 * @param {number} [o.width] The drawing's width (the canvas's own).
 * @param {number} [o.height] The drawing's height (the canvas's own).
 * @param {number} [o.pixelRatio=1] Device pixels per CSS pixel.
 * @param {number} [o.exposure] The exposure (measured by default).
 * @param {number} [o.fit=0.89] How much of the frame the group fills.
 * @param {import('./view.js').View} [o.view] The view.
 * @param {(THREE: typeof import('three'), scene: import('three').Scene, keep: <T extends { dispose(): void }>(t: T) => T) => Promise<{ width: number, height: number, center: [number, number, number] }>} build Adds the meshes; resolves to the group's size (width and height standing, width and depth lying) and centre.
 * @returns {Promise<import('./shot.js').Shot>} The scene's handle.
 */
export async function shoot(canvas, o, build) {
	const width = o.width ?? canvas.width;
	const height = o.height ?? canvas.height;
	const upright = o.layout === 'upright';
	const THREE = await import('three');
	const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
	const renderer = makeRenderer(THREE, canvas, { width, height, pixelRatio: o.pixelRatio ?? 1, exposure: o.exposure ?? 1 });
	const stage = makeStage(THREE, renderer, RoomEnvironment, { ground: o.ground.color, light: o.light, layout: o.layout });
	const { scene } = stage;
	/** @type {{ dispose(): void }[]} */
	const owned = [];
	const group = await build(THREE, scene, (t) => (owned.push(t), t));
	const camera = new THREE.PerspectiveCamera();
	const frame = { aspect: width / height, fit: clamp(o.fit ?? 0.89, 0.2, 1) };
	const home = upright ? LEVEL : FRONT;
	let view = { ...home, ...o.view };
	const render = () => {
		if (upright) placeUpright(camera, view, { ...group, ...frame });
		else place(camera, view, { width: group.width, depth: group.height, ...frame });
		renderer.render(scene, camera);
	};
	// the ground the colour asked for: measured in the front-on view, on bare paper near the top corner
	if (o.exposure === undefined) {
		const asked = view;
		view = { ...home };
		expose(renderer, render, o.ground.color, [0.03, 0.03]);
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
