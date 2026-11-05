/**
 * @module @logomarks/mockups/three/materials
 *
 * Vinyl as a physical material. Clear vinyl is nearly invisible: thin,
 * smooth, all transmission at glass's index, seen by its reflections.
 * Coloured translucent vinyl transmits light tinted by the colour, a
 * little rough so the ground behind softens; solid vinyl is glossy with a
 * clearcoat; splatter and marble take their colours from a texture drawn
 * by the 2D material. Every kind gets the groove maps: fine rings in the
 * normal, glossier gaps, and anisotropy running along the grooves.
 */

import { mix } from '../util/color.js';

/**
 * A record's face material.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('../materials/vinyl.js').Material} m The material.
 * @param {ReturnType<typeof import('./textures.js').grooveMaps>} maps The groove maps.
 * @param {{ color: import('three').Texture, mask: import('three').Texture | null } | null} [body] The body's colours (splatter, marble), and where light passes through it.
 * @returns {import('three').MeshPhysicalMaterial} The material.
 */
export function vinylMaterial(THREE, m, maps, body = null) {
	const grooves = {
		normalMap: maps.normal,
		normalScale: new THREE.Vector2(0.6, 0.6),
		roughnessMap: maps.roughness,
		anisotropy: 0.85,
		anisotropyMap: maps.anisotropy,
		clearcoat: 0.6,
		clearcoatRoughness: 0.18,
		envMapIntensity: 0.9,
	};
	if (m.kind === 'splatter' || m.kind === 'marble') {
		const see = m.kind === 'splatter' && m.base ? m.base.opacity < 0.98 : m.opacity < 0.98;
		return new THREE.MeshPhysicalMaterial({
			...grooves,
			color: '#ffffff',
			map: body?.color ?? null,
			transmission: see ? 1 : 0,
			transmissionMap: body?.mask ?? null,
			roughness: 0.28,
			thickness: 0.004,
		});
	}
	if (m.kind === 'clear') {
		// nearly invisible: thin, glassy and smooth, so it shows mostly as reflections, the grooves streaking them
		return new THREE.MeshPhysicalMaterial({
			...grooves,
			normalScale: new THREE.Vector2(0.9, 0.9),
			anisotropy: 0.95,
			color: '#e8ebed',
			clearcoat: 0,
			transmission: 1,
			roughness: 0.07,
			thickness: 0.0025,
			ior: 1.5,
			specularIntensity: 1,
			envMapIntensity: 2.6,
		});
	}
	if (m.opacity < 0.98) {
		// a filter: the colour through tinted vinyl
		return new THREE.MeshPhysicalMaterial({
			...grooves,
			color: mix('#ffffff', m.color, Math.min(1, 0.4 + m.opacity)),
			clearcoat: 0,
			transmission: 1,
			roughness: 0.16,
			thickness: 0.004,
			ior: 1.5,
			attenuationColor: new THREE.Color(m.color),
			attenuationDistance: 0.01,
			specularIntensity: 0.6,
			envMapIntensity: 0.45,
		});
	}
	return new THREE.MeshPhysicalMaterial({ ...grooves, color: m.color, roughness: 0.34, clearcoat: 0.8 });
}

/**
 * Printed paper: a little rough, a faint sheen.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {import('three').Texture | null} [map] What's printed on it.
 * @param {string} [color='#f2f0ea'] Its colour where nothing is.
 * @returns {import('three').MeshPhysicalMaterial} The material.
 */
export function paperMaterial(THREE, map = null, color = '#f2f0ea') {
	return new THREE.MeshPhysicalMaterial({ map, color: map ? '#ffffff' : color, roughness: 0.62, clearcoat: 0.12, clearcoatRoughness: 0.5 });
}
