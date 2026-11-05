/**
 * @module @arraypress/mockups/three/sweep
 *
 * A seamless paper sweep, as a product studio hangs one: a floor running
 * towards the camera that curves up through a cove into a wall behind, so
 * there's no horizon line, only the light falling off up the paper.
 */

/**
 * A sweep.
 *
 * @param {typeof import('three')} THREE three.js.
 * @param {object} o Its shape and colour.
 * @param {string} o.color The paper's colour.
 * @param {number} [o.back=1.6] How far behind the origin the cove starts.
 * @param {number} [o.cove=1.2] The cove's radius.
 * @param {number} [o.front=8] How far the floor runs towards the camera.
 * @param {number} [o.rise=8] How high the wall goes above the cove.
 * @param {number} [o.width=24] Its width.
 * @param {import('three').Texture | null} [o.map] A texture printed on it; its UVs are in world units (across, and along the paper from the front), so the texture's `repeat` sets its scale.
 * @returns {import('three').Mesh} The sweep, its floor at y = 0.
 */
export function sweepMesh(THREE, { color, back = 1.6, cove = 1.2, front = 8, rise = 8, width = 24, map = null }) {
	// the profile in (z, y), front to top: straight floor, a quarter circle, straight wall
	/** @type {[number, number][]} */
	const profile = [];
	for (let i = 0; i <= 8; i++) profile.push([front - ((front + back) * i) / 8, 0]);
	for (let i = 1; i <= 24; i++) {
		const a = (i / 24) * (Math.PI / 2);
		profile.push([-back - Math.sin(a) * cove, cove - Math.cos(a) * cove]);
	}
	for (let i = 1; i <= 8; i++) profile.push([-back - cove, cove + (rise * i) / 8]);
	const geo = new THREE.PlaneGeometry(width, 1, 8, profile.length - 1);
	const p = geo.attributes.position;
	for (let i = 0; i < p.count; i++) {
		const row = Math.round((0.5 - p.getY(i)) * (profile.length - 1));
		const [z, y] = profile[row];
		p.setXYZ(i, p.getX(i), y, z);
	}
	geo.computeVertexNormals();
	// UVs in world units: across, and along the profile from the front, so a texture bends up the cove with the paper
	let along = 0;
	const lengths = profile.map((q, i) => (along += i ? Math.hypot(q[0] - profile[i - 1][0], q[1] - profile[i - 1][1]) : 0));
	const uv = geo.attributes.uv;
	for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), lengths[Math.floor(i / 9)]);
	// matte paper: no sheen at grazing angles, so it stays its colour across the frame
	const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: map ? '#ffffff' : color, map, side: THREE.DoubleSide }));
	mesh.receiveShadow = true;
	return mesh;
}
