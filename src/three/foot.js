/**
 * @module @logomarks/mockups/three/foot
 *
 * The dark, soft line where something standing meets the floor: light
 * can't get under it, so a photo shows a narrow shadow hugging its foot
 * that a shadow map's single light misses. Drawn as a blurred shape on a
 * transparent plane lying just above the floor.
 */

import { canvas2d } from '../render/image.js';
import { texture } from './textures.js';

/**
 * A contact shadow under a footprint.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {object} o The footprint.
 * @param {number} o.width Its width (x).
 * @param {number} o.depth Its depth (z).
 * @param {number} [o.soft=0.03] How far the shadow spreads past it.
 * @param {number} [o.strength=0.5] How dark it is at its darkest, 0–1.
 * @param {boolean} [o.round=false] A round footprint (where a disc stands on its edge) rather than a box's.
 * @returns {import('three').Mesh} A plane on the floor, centred on the footprint.
 */
export function footShadow(THREE, { width, depth, soft = 0.03, strength = 0.5, round = false }) {
	const W = width + 4 * soft;
	const D = depth + 4 * soft;
	const scale = 512 / Math.max(W, D);
	const [c, g] = canvas2d(Math.max(8, Math.round(W * scale)), Math.max(8, Math.round(D * scale)));
	g.filter = `blur(${Math.max(1, soft * scale * 0.6)}px)`;
	g.fillStyle = `rgba(0,0,0,${strength})`;
	g.beginPath();
	if (round) g.ellipse(c.width / 2, c.height / 2, (width / 2) * scale, (depth / 2) * scale, 0, 0, Math.PI * 2);
	else g.rect(2 * soft * scale, 2 * soft * scale, width * scale, depth * scale);
	g.fill();
	const mesh = new THREE.Mesh(
		new THREE.PlaneGeometry(W, D),
		new THREE.MeshBasicMaterial({ map: texture(THREE, c), transparent: true, depthWrite: false, toneMapped: false, color: '#ffffff' }),
	);
	mesh.rotation.x = -Math.PI / 2;
	mesh.position.y = 0.0006;
	mesh.renderOrder = -1;
	return mesh;
}
