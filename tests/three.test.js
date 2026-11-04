/**
 * @arraypress/mockups — the 3D entry without a GPU: three.js is only
 * imported when a scene is made, and the camera's placement for a view.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { place, placeUpright, FRONT, LEVEL } from '../src/three/view.js';
import { cdScene } from '../src/three/cd.js';
import { vinylScene } from '../src/three/index.js';

const group = { width: 2, depth: 1, aspect: 1, fit: 0.89 };

describe('3d', () => {
	it('imports three.js only when a scene is made', async () => {
		for (const f of ['index', 'textures', 'materials', 'record', 'sleeve', 'stage', 'view', 'shot', 'sweep', 'foot', 'vinyl', 'cd']) {
			const src = await readFile(new URL(`../src/three/${f}.js`, import.meta.url), 'utf8');
			assert.doesNotMatch(src, /^import .* from 'three/m, `${f}.js imports three statically`);
		}
		await assert.rejects(vinylScene(/** @type {any} */ ({ width: 10, height: 10 }), /** @type {any} */ ({})), /art is required/);
	});

	it('looks straight down by default, the far side up', () => {
		const cam = new THREE.PerspectiveCamera();
		place(cam, {}, group);
		assert.equal(cam.fov, FRONT.fov);
		assert.ok(Math.abs(cam.position.x) < 1e-9 && Math.abs(cam.position.z) < 1e-9);
		const dir = new THREE.Vector3();
		cam.getWorldDirection(dir);
		assert.ok(dir.y < -0.999);
		const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
		assert.ok(up.z < -0.999, 'the top of the frame is the far side');
	});

	it('fits the group, and tilts and turns round it', () => {
		const cam = new THREE.PerspectiveCamera();
		place(cam, {}, group);
		const d = cam.position.length();
		const half = Math.tan(((FRONT.fov / 2) * Math.PI) / 180);
		assert.ok(Math.abs(d - 1 / half / 0.89) < 1e-9);
		place(cam, { tilt: 90, turn: 90, distance: 2 }, group);
		assert.ok(Math.abs(cam.position.length() - 2 * d) < 1e-9);
		assert.ok(cam.position.y > 0, 'tilt stops short of the ground');
		assert.ok(cam.position.x > cam.position.z, 'turned to the side');
	});

	it('looks at things standing level and straight on by default, and raises and walks round them', () => {
		const cam = new THREE.PerspectiveCamera();
		const g = { width: 2.2, height: 1, aspect: 1, fit: 0.89, center: /** @type {[number, number, number]} */ ([0, 0.5, 0]) };
		placeUpright(cam, {}, g);
		assert.equal(cam.fov, LEVEL.fov);
		assert.ok(Math.abs(cam.position.y - 0.5) < 1e-9 && Math.abs(cam.position.x) < 1e-9 && cam.position.z > 0, 'level, in front');
		const d = cam.position.z;
		const half = Math.tan(((LEVEL.fov / 2) * Math.PI) / 180);
		assert.ok(Math.abs(d - 1.1 / half / 0.89) < 1e-9, 'fits the width');
		placeUpright(cam, { tilt: 20, turn: 30 }, g);
		assert.ok(cam.position.y > 0.5 && cam.position.x > 0, 'raised and turned');
		assert.ok(Math.abs(cam.position.distanceTo(new THREE.Vector3(0, 0.5, 0)) - d) < 1e-9);
	});

	it('refuses a bad layout or packaging before loading three.js', async () => {
		await assert.rejects(cdScene(/** @type {any} */ ({ width: 10, height: 10 }), /** @type {any} */ ({})), /art is required/);
		await assert.rejects(cdScene(/** @type {any} */ ({ width: 10, height: 10 }), { art: '<svg/>', packaging: /** @type {any} */ ('slim') }), /packaging/);
		await assert.rejects(cdScene(/** @type {any} */ ({ width: 10, height: 10 }), { art: '<svg/>', layout: /** @type {any} */ ('hung') }), /layout/);
	});
});
