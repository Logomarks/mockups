/**
 * @module @arraypress/mockups/three/record
 *
 * One record as geometry, lying flat: its two faces (rings round the
 * spindle hole, planar UVs so the groove maps centre on it), its edge, the
 * labels on both sides, and the hole through all of them. A clear record
 * casts a shadow only where it stops light: its edge and its labels.
 */

import { RADII } from '../materials/surface.js';
import { vinylMaterial } from './materials.js';

/** A 12" record's thickness, as a fraction of its sleeve's side (1.4 of 314 mm). */
export const THICKNESS = 0.0045;

/**
 * A record.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {object} o The record.
 * @param {number} o.radius Its radius.
 * @param {import('../materials/vinyl.js').Material} o.material What it's pressed in.
 * @param {ReturnType<typeof import('./textures.js').grooveMaps>} o.maps The groove maps.
 * @param {import('three').Texture} o.label The label's texture.
 * @param {{ color: import('three').Texture, mask: import('three').Texture | null } | null} [o.body] The body's colours (splatter, marble), and where light passes.
 * @param {number} [o.labelRadius] The label's radius as a fraction of the record's (a 12"'s).
 * @param {number} [o.thickness] Its thickness (a 12"'s, in its sleeve's units).
 * @returns {import('three').Group} The record, centred on the origin, its faces up and down.
 */
export function recordMesh(THREE, { radius, material: m, maps, label, body = null, labelRadius = RADII.label, thickness = THICKNESS }) {
	const g = new THREE.Group();
	const hole = RADII.hole * radius;
	const THICK = thickness;
	const mat = vinylMaterial(THREE, m, maps, body);
	const face = new THREE.RingGeometry(hole, radius, 192, 1);
	planarUv(face, radius);
	for (const side of [1, -1]) {
		const f = new THREE.Mesh(face, mat);
		f.rotation.x = -side * (Math.PI / 2);
		f.position.y = (side * THICK) / 2;
		g.add(f);
		const lg = new THREE.RingGeometry(hole, labelRadius * radius, 96, 1);
		planarUv(lg, labelRadius * radius);
		const l = new THREE.Mesh(lg, new THREE.MeshPhysicalMaterial({ map: label, roughness: 0.55, clearcoat: 0.15 }));
		l.rotation.x = -side * (Math.PI / 2);
		l.position.y = side * (THICK / 2 + 0.0002);
		if (side < 0) l.rotation.z = Math.PI;
		g.add(l);
	}
	const edge = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, THICK, 192, 1, true), mat);
	g.add(edge);
	const clear = m.opacity < 0.98 || (m.base !== null && m.base.opacity < 0.98);
	g.traverse((o) => {
		if (!(o instanceof THREE.Mesh)) return;
		// a clear face lets the light through: only its edge and labels cast (a masked face would alias into rings)
		o.castShadow = !(clear && o.material === mat && o !== edge);
		o.receiveShadow = true;
	});
	return g;
}

/**
 * A flat ring's UVs, mapped across its square (centre at 0.5, 0.5), as a texture of the whole face expects.
 *
 * @param {import('three').BufferGeometry} geo The ring.
 * @param {number} r The square's half side.
 */
function planarUv(geo, r) {
	const p = geo.attributes.position;
	const uv = geo.attributes.uv;
	for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2 * r) + 0.5, p.getY(i) / (2 * r) + 0.5);
	uv.needsUpdate = true;
}
