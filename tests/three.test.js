/**
 * @logomarks/mockups — the 3D entry without a GPU: three.js is only
 * imported when a scene is made, and the camera's placement for a view.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { place, placeUpright, FRONT, LEVEL } from '../src/three/view.js';
import { cdScene } from '../src/three/cd.js';
import { vinylScene, tvScene, VINYL_SCENE_LAYOUTS, TV_KINDS } from '../src/three/index.js';
import { resolveLight, resolveDrift, resolveProps, scatter } from '../src/three/vinyl.js';
import { resolveCrt, CRT_LOOK } from '../src/three/crt.js';
import { loop, drifted, reducedMotion } from '../src/three/loop.js';
import { VINYL_SIZES } from '../src/objects/vinyl.js';

const group = { width: 2, depth: 1, aspect: 1, fit: 0.89 };

describe('3d', () => {
	it('imports three.js only when a scene is made', async () => {
		for (const f of ['index', 'textures', 'materials', 'record', 'sleeve', 'stage', 'view', 'shot', 'sweep', 'foot', 'vinyl', 'cd', 'tv', 'crt', 'screen', 'loop']) {
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

	it('lays vinyl out three ways, and takes a 7-inch', async () => {
		assert.deepEqual([...VINYL_SCENE_LAYOUTS], ['upright', 'flat', 'scatter']);
		const art = '<svg xmlns="http://www.w3.org/2000/svg"/>';
		await assert.rejects(vinylScene(/** @type {any} */ ({}), { art, layout: /** @type {any} */ ('pile') }), /layout is 'upright', 'flat' or 'scatter'/);
		await assert.rejects(vinylScene(/** @type {any} */ ({}), { art, size: /** @type {any} */ ('10in') }), /size is '12in' or '7in'/);
	});

	it('reads the light, the drift and the props', () => {
		assert.deepEqual(resolveLight('flash'), { light: 0.35, lighting: 'flash' });
		assert.deepEqual(resolveLight(-0.5), { light: -0.5, lighting: 'studio' });
		assert.throws(() => resolveLight('sun'), /light is 'studio', 'flash' or a number/);
		assert.deepEqual([resolveDrift(undefined), resolveDrift(true), resolveDrift(0.4), resolveDrift(3)], [0, 1, 0.4, 1]);
		assert.throws(() => resolveDrift('slow'), /drift/);
		const ink = { ink: '#3d051a', paper: '#ec3a95' };
		const [a, b] = resolveProps(['<svg/>', { art: '<svg/>', width: 92, height: 92, print: 'full' }], VINYL_SIZES['7in'], ink);
		assert.ok(Math.abs(a.w - 0.62) < 1e-9 && a.print === ink, 'a prop shares the sleeve\'s print');
		assert.ok(Math.abs(b.w - 0.5) < 1e-9 && b.print === null);
		assert.throws(() => resolveProps('<svg/>', VINYL_SIZES['12in'], null), /props is a list/);
		assert.throws(() => resolveProps([{ width: 10 }], VINYL_SIZES['12in'], null), /props\[0\] has no art/);
	});

	it('tips a record out beside its sleeve, the props in front, all centred', () => {
		const { at, width, depth } = scatter(1, 0.475, [{ w: 0.6, h: 0.5 }]);
		assert.ok(at.records[0].x < at.sleeve.x, 'the record lies left of the sleeve');
		assert.ok(at.props[0].z > at.sleeve.z, 'the prop lies in front');
		assert.ok(width > 1 && depth > 1);
		assert.equal(scatter(2, 0.475, []).at.records.length, 2);
	});

	it('shows a TV screen through a CRT, or not', async () => {
		assert.deepEqual([...TV_KINDS], ['crt', 'flat']);
		assert.deepEqual(resolveCrt(undefined), { ...CRT_LOOK });
		assert.equal(resolveCrt(false).scanlines, 0);
		assert.equal(resolveCrt({ roll: 0.5, noise: 4 }).noise, 1);
		assert.throws(() => resolveCrt({ curve: 'lots' }), /crt\.curve/);
		await assert.rejects(tvScene(/** @type {any} */ ({}), /** @type {any} */ ({ screen: '<svg/>', kind: 'plasma' })), /kind is 'crt' or 'flat'/);
		await assert.rejects(tvScene(/** @type {any} */ ({}), /** @type {any} */ ({ screen: '<svg/>', cabinet: 'teak' })), /cabinet/);
	});

	it('drifts round the view, and draws no frames outside a page', () => {
		const v = drifted({ tilt: 10, turn: 0 }, 3, 1);
		assert.ok(Math.abs(/** @type {number} */ (v.turn)) < 6 && Math.abs(/** @type {number} */ (v.tilt) - 10) < 3);
		assert.deepEqual(drifted({ tilt: 10, turn: 5 }, 3, 0), { tilt: 10, turn: 5, distance: 1 });
		assert.equal(reducedMotion(), false);
		let n = 0;
		loop(/** @type {any} */ ({}), () => n++).stop();
		assert.equal(n, 0);
	});
});
