/**
 * @logomarks/mockups — the perspective machinery the screens and signs
 * share: the camera, the projective warp, art sizes and fits, inking.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { camera, frame, onPlane, horizon, clipNear, seen } from '../src/util/camera.js';
import { affine, grow, hull, roundRect, clipRect } from '../src/util/shape.js';
import { cells, warp } from '../src/render/warp.js';
import { artSize, svgSize } from '../src/render/dims.js';
import { fitArt } from '../src/render/fit.js';
import { ink } from '../src/render/ink.js';
import { artHref } from '../src/render/art.js';
import { scene } from '../src/render/scene.js';
import { lit, keyLight } from '../src/materials/light.js';
import { resolveBody } from '../src/materials/body.js';
import { num, oneOf, viewOf } from '../src/util/options.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

describe('camera', () => {
	it('looks straight down at 90° pitch, with +z towards the bottom of the picture', () => {
		const cam = camera({ pitch: 90, distance: 10 });
		const [, yNear] = cam.project([0, 0, 1]);
		const [, yFar] = cam.project([0, 0, -1]);
		assert.ok(yNear > yFar);
		close(cam.project([0, 0, 0])[0], 0);
	});

	it('frames points to fill the frame, centred', () => {
		const vw = frame(camera({ turn: 30, pitch: 20 }), { width: 800, height: 600, points: [[-1, 0, 0], [1, 0, 0], [-1, 1, 0], [1, 1, 0]], fit: 0.5 });
		const xs = [[-1, 0, 0], [1, 0, 0], [-1, 1, 0], [1, 1, 0]].map((p) => vw.at(/** @type {[number, number, number]} */ (p)));
		const [x0, x1] = [Math.min(...xs.map((p) => p[0])), Math.max(...xs.map((p) => p[0]))];
		const [y0, y1] = [Math.min(...xs.map((p) => p[1])), Math.max(...xs.map((p) => p[1]))];
		assert.ok(Math.abs(x1 - x0 - 400) < 1e-6 || Math.abs(y1 - y0 - 300) < 1e-6);
		close((x0 + x1) / 2, 400);
		close((y0 + y1) / 2, 300);
	});

	it('maps a plane projectively: straight lines stay straight, parallel ones converge', () => {
		const vw = frame(camera({ turn: -40, pitch: 10 }), { width: 1000, height: 1000, points: [[-1, 0, 0], [1, 1, 0]] });
		const map = onPlane(vw, [-1, 1, 0], [0.01, 0, 0], [0, -0.01, 0]);
		const [a, b, c] = [map(0, 0), map(100, 0), map(50, 0)];
		const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
		close(cross, 0, 1e-6);
		const top = map(100, 0)[1] - map(0, 0)[1];
		const bottom = map(100, 100)[1] - map(0, 100)[1];
		assert.notEqual(Math.sign(top) * Math.abs(top), Math.sign(bottom) * Math.abs(bottom));
	});

	it('finds the horizon at the eye: level with the target when the camera is level', () => {
		const vw = frame(camera({ pitch: 0, target: [0, 1.6, 0] }), { width: 500, height: 500, points: [[-1, 0.6, 0], [1, 2.6, 0]] });
		close(horizon(vw), vw.at([0, 1.6, -1e6])[1], 1e-3);
	});

	it('cuts what passes behind the camera, and finds what of a line it sees', () => {
		const vw = frame(camera({ distance: 5 }), { width: 400, height: 400, points: [[-1, -1, 0], [1, 1, 0]] });
		const cut = clipNear(vw, [[0, 0, 0], [0, 0, 20], [1, 0, 20], [1, 0, 0]], 0.5);
		assert.ok(cut.every((p) => vw.depth(p) >= 0.5 - 1e-9));
		const [lo, hi] = seen(vw, 0, 0, [-100, 100]);
		assert.ok(lo > -100 && hi < 100 && lo < 0 && hi > 0);
	});
});

describe('shape', () => {
	it('carries a triangle exactly onto another', () => {
		const s = [[0, 0], [10, 0], [0, 10]];
		const d = [[5, 5], [25, 8], [3, 30]];
		const [a, b, c, dd, e, f] = affine(/** @type {any} */ (s), /** @type {any} */ (d));
		s.forEach(([x, y], i) => {
			close(a * x + c * y + e, d[i][0]);
			close(b * x + dd * y + f, d[i][1]);
		});
	});

	it('grows a triangle by a margin, keeps hulls convex, rounds rectangles, clips to a box', () => {
		const g = grow([[0, 0], [10, 0], [0, 10]], 1);
		close(g[0][0], -1);
		close(g[0][1], -1);
		assert.equal(hull([[0, 0], [2, 0], [1, 1], [2, 2], [0, 2]]).length, 4);
		assert.equal(roundRect(0, 0, 10, 10, 2, 4).length, 20);
		assert.deepEqual(clipRect([[-5, -5], [5, -5], [5, 5], [-5, 5]], 0, 0, 10, 10).map((p) => p.map((v) => Math.round(v))), [[5, 0], [5, 5], [0, 5], [0, 0]]);
	});
});

describe('warp', () => {
	const flat = (x, y) => /** @type {[number, number]} */ ([x * 0.5 + 10, y * 0.5 + 20]);
	const tilted = (x, y) => {
		const w = 1 + x * 0.002;
		return /** @type {[number, number]} */ ([(x * 0.5) / w + 10, (y * 0.5) / w + 20]);
	};

	it('needs one piece for an affine map, more for perspective', () => {
		assert.deepEqual(cells(flat, 1000, 500, 0.4, 28), [1, 1]);
		const [nx, ny] = cells(tilted, 1000, 500, 0.4, 28);
		assert.ok(nx * ny > 1);
		assert.ok(nx <= 28);
	});

	it('draws one transformed use for an affine map, pattern-filled triangles otherwise', () => {
		const sc = scene({ width: 600, height: 400 });
		assert.match(warp(sc, { content: 'c', width: 1000, height: 500, map: flat }), /^<use href="#c" transform="matrix\(0\.5 0 0 0\.5 10 20\)"\/>$/);
		const out = warp(sc, { content: 'c', width: 1000, height: 500, map: tilted });
		assert.ok((out.match(/<path /g) ?? []).length >= 4);
		assert.match(sc.svg(), /<pattern [^>]*patternTransform="matrix/);
	});

	it('skips pieces that land off the frame', () => {
		const sc = scene({ width: 100, height: 100 });
		const far = (x, y) => /** @type {[number, number]} */ ([5000 + x / (1 + x * 0.002), y]);
		assert.equal((warp(sc, { content: 'c', width: 1000, height: 500, map: far }).match(/<path /g) ?? []).length, 0);
	});
});

describe('art', () => {
	const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><path fill="currentColor" d="M0 0h1v1z"/></svg>';

	it('reads sizes from SVG and from PNG and JPEG headers', () => {
		assert.deepEqual(svgSize(svg), { width: 300, height: 100 });
		assert.deepEqual(artSize(artHref(svg)), { width: 300, height: 100 });
		const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 2, 0, 0, 0, 1, 0, 8, 6, 0, 0, 0, 0, 0, 0]);
		assert.deepEqual(artSize(artHref(png)), { width: 512, height: 256 });
		const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 11, 8, 0, 120, 0, 160, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
		assert.deepEqual(artSize(artHref(jpg)), { width: 160, height: 120 });
		assert.equal(artSize('https://example.com/a.png'), null);
	});

	it('fits art by its own proportions: cover, contain, top', () => {
		const sc = scene({ width: 100, height: 100 });
		assert.match(fitArt(sc, svg, { x: 0, y: 0, width: 100, height: 100 }, 'cover'), /scale\(0\.1 0\.1\)/);
		assert.match(fitArt(sc, svg, { x: 0, y: 0, width: 100, height: 100 }, 'contain'), /translate\(0 33\.333\)/);
		assert.throws(() => fitArt(sc, svg, { x: 0, y: 0, width: 1, height: 1 }, /** @type {any} */ ('stretch')), /fit/);
	});

	it('inks a currentColor mark, and leaves other art alone', () => {
		const inked = /** @type {string} */ (ink(svg, '#ff0000'));
		assert.match(Buffer.from(inked.split(',')[1], 'base64').toString(), /fill="#ff0000"/);
		assert.equal(ink('data:image/png;base64,AAAA', '#fff'), 'data:image/png;base64,AAAA');
	});
});

describe('light and options', () => {
	it('lights a face turned to the light brighter than one turned away', () => {
		const L = keyLight(0.3);
		const o = { light: L, point: /** @type {[number, number, number]} */ ([0, 0, 0]), eye: /** @type {[number, number, number]} */ ([0, 5, 5]) };
		const toward = parseInt(lit('#808080', L, o).slice(1, 3), 16);
		const away = parseInt(lit('#808080', /** @type {[number, number, number]} */ (L.map((v) => -v)), o).slice(1, 3), 16);
		assert.ok(toward > away);
	});

	it('checks numbers, names, views and shells', () => {
		assert.equal(num('x', undefined, 3, 'n'), 3);
		assert.throws(() => num('x', 'a', 3, 'n'), /x: n is a number/);
		assert.equal(oneOf('x', 'k', 'b', ['a', 'b'], 'a'), 'b');
		assert.throws(() => oneOf('x', 'k', 'c', ['a', 'b'], 'a'), /x: k is 'a', 'b'/);
		const named = { front: { tilt: 0, turn: 0 }, angle: { tilt: 30, turn: -20 } };
		assert.deepEqual(viewOf('x', 'angle', named, 'front'), { tilt: 30, turn: -20 });
		assert.deepEqual(viewOf('x', { turn: 5 }, named, 'front'), { tilt: 0, turn: 5 });
		assert.throws(() => viewOf('x', 'up', named, 'front'), /view/);
		assert.equal(resolveBody('silver').color, '#c3c6cb');
		assert.equal(resolveBody('#123456').color, '#123456');
		assert.throws(() => resolveBody('gold'), /finish/);
	});
});
