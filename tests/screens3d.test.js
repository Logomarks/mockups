/**
 * @logomarks/mockups — the 3D screens without a GPU: the phone (corner and pair), the dark-room laptop and the
 * keynote check their options before drawing anything, import three.js only when a scene is made, and their
 * layouts and geometry are fixed and sound.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { phoneScene, phoneMesh, iconPoint, tileGrid, TILE, PHONE_SCENE_LAYOUTS, PHONE_SCREENS } from '../src/three/phone.js';
import { laptopScene, laptopScreen, LAPTOP_SCREENS } from '../src/three/laptop.js';
import { keynoteScene, audience, HALL, KEYNOTE_SCREENS } from '../src/three/keynote.js';
import { PHONE } from '../src/objects/phone.js';
import { LAPTOP } from '../src/objects/laptop.js';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor"/></svg>';
const canvas = /** @type {any} */ ({ width: 10, height: 10 });

describe('3d screens', () => {
	it('import three.js only when a scene is made', async () => {
		for (const f of ['phone', 'laptop', 'keynote', 'glow']) {
			const src = await readFile(new URL(`../src/three/${f}.js`, import.meta.url), 'utf8');
			assert.doesNotMatch(src, /^import .* from 'three/m, `${f}.js imports three statically`);
		}
	});

	it('refuse bad options before drawing', async () => {
		await assert.rejects(phoneScene(canvas, /** @type {any} */ ({})), /art is required/);
		await assert.rejects(phoneScene(canvas, { art: MARK, layout: /** @type {any} */ ('fan') }), /layout/);
		await assert.rejects(phoneScene(canvas, { art: MARK, screen: /** @type {any} */ ('video') }), /screen/);
		await assert.rejects(phoneScene(canvas, { art: MARK, color: 'green' }), /color/);
		await assert.rejects(phoneScene(canvas, { art: MARK, fill: /** @type {any} */ ('contain') }), /fill/);
		await assert.rejects(phoneScene(canvas, { art: MARK, finish: 'gold' }), /finish/);
		await assert.rejects(phoneScene(canvas, { art: MARK, blur: /** @type {any} */ ('lots') }), /blur/);
		await assert.rejects(laptopScene(canvas, { art: MARK, screen: /** @type {any} */ ('page') }), /screen/);
		await assert.rejects(laptopScene(canvas, { art: MARK, style: /** @type {any} */ ('flat') }), /style/);
		await assert.rejects(laptopScene(canvas, { art: MARK, ground: 'dark' }), /ground/);
		await assert.rejects(keynoteScene(canvas, /** @type {any} */ ({ name: 'x' })), /art is required/);
		await assert.rejects(keynoteScene(canvas, { art: MARK, wash: 'green' }), /wash/);
		await assert.rejects(keynoteScene(canvas, { art: MARK, view: /** @type {any} */ ({ tilt: 'up' }) }), /view.tilt/);
		assert.deepEqual([PHONE_SCENE_LAYOUTS, PHONE_SCREENS, LAPTOP_SCREENS, KEYNOTE_SCREENS], [['corner', 'pair'], ['ui', 'art'], ['splash', 'art'], ['splash', 'art']]);
	});

	it('puts the brand first on the home screen, near the phone\'s top corner', () => {
		const [x, y] = iconPoint();
		assert.ok(x < -PHONE.width / 4 && x > -PHONE.width / 2, 'on the left');
		assert.ok(y > PHONE.height / 4 && y < PHONE.height / 2, 'near the top');
	});

	it('tiles a wall evenly, the same every time', () => {
		const a = tileGrid({ width: 200, height: 100 });
		assert.deepEqual(a, tileGrid({ width: 200, height: 100 }));
		const pitch = TILE.width + TILE.grout;
		assert.equal(a.length, Math.ceil(200 / pitch) * Math.ceil(100 / (TILE.height + TILE.grout)));
		assert.ok(a.every((t) => t.shade >= -1 && t.shade <= 1));
		assert.ok(Math.abs(a.reduce((s, t) => s + t.x, 0)) < 1e-6, 'centred');
		assert.ok(new Set(a.map((t) => t.shade.toFixed(3))).size > a.length / 2, 'shades vary');
	});

	it('builds a phone its true size, buttons on its sides', () => {
		const g = phoneMesh(THREE, RoundedBoxGeometry, { face: new THREE.Texture(), metal: new THREE.MeshStandardMaterial(), u: 1 });
		const box = new THREE.Box3().setFromObject(g, true);
		const size = box.getSize(new THREE.Vector3());
		assert.ok(Math.abs(size.y - PHONE.height) < 0.5, 'its height');
		assert.ok(size.x > PHONE.width && size.x < PHONE.width + 3, 'its width, and the buttons standing proud');
		assert.ok(Math.abs(size.z - PHONE.depth) < 0.5, 'its depth');
	});

	it('stands the laptop\'s screen on the lid, leaning back from the hinge', () => {
		const s = laptopScreen();
		assert.ok(Math.abs(s.width / s.height - 1.6) < 1e-9);
		assert.ok(s.center[1] > LAPTOP.base + s.height / 2, 'above the deck');
		assert.ok(s.center[2] < s.hinge[2], 'leaning back');
		assert.ok(s.lean > 0 && s.lean < Math.PI / 4);
	});

	it('seats an audience behind the stage with an aisle, the same for the same seed', () => {
		const a = audience('k');
		assert.deepEqual(a, audience('k'));
		assert.notDeepEqual(a, audience('other'));
		assert.ok(a.length > 150);
		assert.ok(a.every((p) => p.z >= HALL.rows[0] - 0.1 && p.z <= HALL.rows[1] + 0.1 && p.z > HALL.stageDepth + 1));
		assert.ok(a.every((p) => Math.abs(p.x) > 0.3), 'the aisle is clear');
		assert.ok(a.every((p) => p.head > 0.08 && p.head < 0.13 && p.height > 1 && p.height < 1.4));
	});
});
