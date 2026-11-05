/**
 * @logomarks/mockups — sunglasses: the lens's outline and curve, the glasses resting on the ground, and the options.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { sunglassesScene, glassesMesh, lensPoint, lensOutline, sag, GLASSES, SUNGLASS_FRAMES } from '../src/three/sunglasses.js';
import { STREET_TIMES, POSTER } from '../src/three/streetenv.js';

const canvas = /** @type {any} */ ({ width: 10, height: 10 });

describe('sunglasses', () => {
	it('draws a lens wider than tall, narrower at the bottom, its outer top corner lifted', () => {
		const pts = lensOutline(96).map((o) => o.p);
		const xs = pts.map((p) => p[0]);
		const ys = pts.map((p) => p[1]);
		assert.ok(Math.max(...xs) - Math.min(...xs) > Math.max(...ys) - Math.min(...ys));
		assert.ok(Math.max(...xs) <= GLASSES.a + 1e-9);
		const width = (y) => {
			const near = pts.filter((p) => Math.abs(p[1] - y) < 2);
			return Math.max(...near.map((p) => p[0])) - Math.min(...near.map((p) => p[0]));
		};
		assert.ok(width(-GLASSES.b * 0.8) < width(GLASSES.b * 0.6));
		assert.ok(lensPoint(Math.PI / 4)[1] > -lensPoint(-Math.PI / 4)[1], 'the outer top corner lifted');
		for (const { p, n } of lensOutline(64)) assert.ok(p[0] * n[0] + p[1] * n[1] > 0, 'normals point out');
	});

	it('curves the lenses back from their centres', () => {
		assert.equal(sag(0, 0), 0);
		assert.ok(sag(GLASSES.a, 0) > sag(GLASSES.a / 2, 0));
		assert.equal(sag(3, 4), sag(5, 0));
	});

	it('rests on the ground on both rims and both temples’ tips', () => {
		const m = new THREE.MeshBasicMaterial();
		const g = glassesMesh(THREE, RoundedBoxGeometry, { acetate: m, glass: m, u: 0.01 });
		g.group.updateMatrixWorld(true);
		const lows = [];
		g.group.traverse((o) => {
			if (o instanceof THREE.Mesh) lows.push(new THREE.Box3().setFromObject(o, true).min.y);
		});
		const floor = Math.min(...lows);
		assert.ok(Math.abs(floor) < 1e-4, 'on the ground');
		assert.ok(lows.filter((y) => y < 5e-4).length >= 4, 'two rims and two tips touch it');
		assert.ok(g.focus[0] < 0, 'focused on the near (left) lens');
		assert.ok(g.width > 1.3 && g.width < 1.6, 'about 145 mm across');
	});

	it('puts the poster behind the camera, in each time of day', () => {
		assert.equal(POSTER.u > 0.6 && POSTER.u < 0.9, true);
		assert.deepEqual(Object.keys(STREET_TIMES), ['day', 'golden', 'dusk']);
		assert.ok(Object.keys(SUNGLASS_FRAMES).includes('havana'));
	});

	it('refuses bad options before loading three.js', async () => {
		await assert.rejects(sunglassesScene(canvas, /** @type {any} */ ({})), /sunglassesScene: art is required/);
		await assert.rejects(sunglassesScene(canvas, /** @type {any} */ ({ art: 'x', lens: 'gold' })), /lens is 'smoke' or 'mirror'/);
		await assert.rejects(sunglassesScene(canvas, /** @type {any} */ ({ art: 'x', frame: 'gold' })), /frame is 'black', 'smoke', 'havana' or a hex colour/);
		await assert.rejects(sunglassesScene(canvas, /** @type {any} */ ({ art: 'x', time: 'noon' })), /time is 'day', 'golden' or 'dusk'/);
		await assert.rejects(sunglassesScene(canvas, /** @type {any} */ ({ art: 'x', blur: 'soft' })), /blur is a number/);
	});
});
