/**
 * @module @arraypress/mockups/three/sleeve
 *
 * The sleeve as a thin box lying flat, the cover printed on its top face.
 * A double LP's gatefold is thicker than a single's.
 */

import { paperMaterial } from './materials.js';

/**
 * A sleeve, one unit square.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('three').Texture} cover The cover's texture.
 * @param {'single' | 'double'} format One record or two (a gatefold).
 * @param {number} [depth] Its thickness in its own units (a 12" single's, or a gatefold's).
 * @returns {import('three').Mesh} The sleeve, centred on the origin, its cover up.
 */
export function sleeveMesh(THREE, cover, format, depth = format === 'double' ? 0.016 : 0.009) {
	const edge = paperMaterial(THREE, null, '#ece9e2');
	const m = new THREE.Mesh(new THREE.BoxGeometry(1, depth, 1), [edge, edge, paperMaterial(THREE, cover), edge, edge, edge]);
	m.castShadow = true;
	m.receiveShadow = true;
	return m;
}
