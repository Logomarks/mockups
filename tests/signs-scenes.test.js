/**
 * @logomarks/mockups — the 3D signs (lightbox, neon, shop window, billboard over a hedge) without a GPU: their
 * options refused before anything is drawn, and the pure pieces they're built from (the type poster, the
 * station's panels, the mark's outlines and tubes, the hedge's leaves), deterministic.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lightboxScene, posterSize, panelGrid, LIGHTBOX, STATION } from '../src/three/lightbox.js';
import { neonScene, neonTubes, alongTubes, svgMarkup, NEON } from '../src/three/neon.js';
import { windowScene } from '../src/three/window.js';
import { billboardScene, boardSize, hedgeLeaves, HEDGE } from '../src/three/billboard.js';
import { pathPoints, arcPoints, svgOutlines, resample, runLength } from '../src/util/pathpoints.js';
import { typePoster, breakLines } from '../src/parts/typeposter.js';
import { scene } from '../src/render/scene.js';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M32 32h200v200H32z M280 32h200v200H280z"/></svg>';
const canvas = /** @type {any} */ ({ width: 10, height: 10 });

describe('signs in 3D', () => {
	it('never imports three.js statically', async () => {
		for (const f of ['lightbox', 'neon', 'window', 'billboard', 'streetenv']) {
			const src = await readFile(new URL(`../src/three/${f}.js`, import.meta.url), 'utf8');
			assert.doesNotMatch(src, /^import .* from 'three/m, `${f}.js imports three statically`);
		}
	});

	it('refuses bad options before drawing', async () => {
		await assert.rejects(lightboxScene(canvas, /** @type {any} */ ({})), /art is required/);
		await assert.rejects(lightboxScene(canvas, { art: MARK, wall: /** @type {any} */ ('pink') }), /wall/);
		await assert.rejects(lightboxScene(canvas, { art: MARK, layout: /** @type {any} */ ('grid') }), /layout/);
		await assert.rejects(lightboxScene(canvas, { art: MARK, color: 'teal' }), /color/);
		await assert.rejects(neonScene(canvas, { art: 'data:image/png;base64,AAAA' }), /as SVG/);
		await assert.rejects(neonScene(canvas, { art: MARK, color: 'neon' }), /color/);
		await assert.rejects(neonScene(canvas, { art: MARK, wall: 'stone' }), /wall/);
		await assert.rejects(windowScene(canvas, { art: MARK, vinyl: 'silver' }), /vinyl/);
		await assert.rejects(windowScene(canvas, { art: MARK, time: /** @type {any} */ ('noon') }), /time/);
		await assert.rejects(billboardScene(canvas, { art: MARK, hedge: /** @type {any} */ ('privet') }), /hedge/);
		await assert.rejects(billboardScene(canvas, { art: MARK, density: /** @type {any} */ ('thick') }), /density/);
	});
});

describe('lightbox pieces', () => {
	it('sizes the poster from the art, 1016 mm high, within bounds', () => {
		assert.deepEqual(posterSize(2 / 3), [677, LIGHTBOX.height]);
		assert.equal(posterSize(10)[0], LIGHTBOX.widest);
		assert.equal(posterSize(0.1)[0], Math.round(LIGHTBOX.height * 0.6));
	});

	it('covers the wall with panels above the skirting, the same for the same seed', () => {
		const a = panelGrid({ width: 6000, height: 3600, seed: 's' });
		assert.deepEqual(panelGrid({ width: 6000, height: 3600, seed: 's' }), a);
		assert.notDeepEqual(panelGrid({ width: 6000, height: 3600, seed: 't' }), a);
		assert.ok(a.every((p) => p.y - STATION.panel[1] / 2 >= STATION.skirting));
		assert.ok(a.some((p) => p.x <= -3000) && a.some((p) => p.x >= 3000));
	});

	it('composes a type poster with its grid showing', () => {
		const sc = scene({ width: 1830, height: 1016, key: 't' });
		const svg = typePoster(sc, { width: 1830, height: 1016, mark: MARK, name: 'Covehaus', headline: 'Rooms by the sea, booked in a minute.', url: 'covehaus.example', color: '#12201f', ink: '#8fe3c6' });
		assert.equal((svg.match(/<line /g) ?? []).length, 6);
		assert.match(svg, /Covehaus/);
		assert.match(svg, /covehaus\.example/);
		assert.match(svg, /fill="#12201f"/);
	});

	it('breaks a headline into lines that fit', () => {
		const lines = breakLines('Rooms by the sea, booked in a minute.', 100, 1200);
		assert.ok(lines.length >= 2);
		assert.equal(lines.join(' '), 'Rooms by the sea, booked in a minute.');
	});
});

describe('outlines', () => {
	it('parses every path command, absolute and relative', () => {
		const [box] = pathPoints('M10 10h20v20h-20z');
		assert.equal(box.closed, true);
		assert.deepEqual(box.points, [[10, 10], [30, 10], [30, 30], [10, 30]]);
		const [curve] = pathPoints('m0 0c0 10 10 10 10 0q5 -5 10 0l5 5');
		assert.deepEqual(curve.points.at(-1), [25, 5]);
		assert.equal(curve.closed, false);
		assert.equal(pathPoints('M0 0L1 1ZM5 5L6 6Z').length, 2);
	});

	it('flattens arcs onto their circle', () => {
		const pts = arcPoints([0, 0], [20, 0], 10, 10, 0, false, true);
		assert.deepEqual(pts.at(-1), [20, 0]);
		for (const [x, y] of pts) assert.ok(Math.abs(Math.hypot(x - 10, y) - 10) < 1e-6);
		assert.ok(pts.every(([, y]) => y <= 1e-9), 'the sweep goes the short way round, above');
	});

	it('reads a document\'s paths and viewBox', () => {
		const { box, outlines } = svgOutlines(MARK);
		assert.deepEqual(box, [0, 0, 512, 512]);
		assert.equal(outlines.length, 2);
		assert.equal(runLength(outlines[0].points, true), 800);
		assert.throws(() => svgOutlines('<svg viewBox="0 0 1 1"></svg>'), /no <path>/);
	});

	it('resamples evenly', () => {
		const pts = resample([[0, 0], [10, 0]], 2.5, false);
		assert.deepEqual(pts, [[0, 0], [2.5, 0], [5, 0], [7.5, 0], [10, 0], [10, 0]].slice(0, pts.length));
		assert.equal(resample([[0, 0], [10, 0], [10, 10], [0, 10]], 5, true).length, 8);
	});
});

describe('neon pieces', () => {
	it('bends a tube round each outline, at the sign\'s size, centred', () => {
		const tubes = neonTubes(MARK, { size: 700 });
		assert.equal(tubes.length, 2);
		const xs = tubes.flatMap((t) => t.points.map((p) => p[0]));
		assert.ok(Math.min(...xs) > -350 && Math.max(...xs) < 350);
		assert.deepEqual(neonTubes(MARK, { size: 700 }), tubes);
	});

	it('leaves out outlines too short to bend', () => {
		const dot = MARK.replace('"/>', ' M300 300h2v2h-2z"/>');
		assert.equal(neonTubes(dot).length, 2);
	});

	it('spaces standoffs along the tubes', () => {
		const tubes = neonTubes(MARK, { size: 700 });
		const total = tubes.reduce((s, t) => s + runLength(t.points, t.closed), 0);
		const pts = alongTubes(tubes, NEON.spacing);
		assert.ok(Math.abs(pts.length - total / NEON.spacing) <= tubes.length);
	});

	it('reads SVG from markup, data URIs and bytes, and nothing else', () => {
		assert.equal(svgMarkup(MARK), MARK);
		assert.equal(svgMarkup(`data:image/svg+xml;base64,${Buffer.from(MARK).toString('base64')}`), MARK);
		assert.equal(svgMarkup(`data:image/svg+xml,${encodeURIComponent(MARK)}`), MARK);
		assert.equal(svgMarkup(new TextEncoder().encode(MARK)), MARK);
		assert.equal(svgMarkup('data:image/png;base64,AAAA'), null);
	});
});

describe('hedge pieces', () => {
	it('sizes the board between 2:1 and 3:1', () => {
		assert.deepEqual(boardSize(3), [HEDGE.board, Math.round(HEDGE.board / 3)]);
		assert.equal(boardSize(1)[1], HEDGE.board / 2);
		assert.equal(boardSize(9)[1], Math.round(HEDGE.board / 3));
	});

	it('grows leaves over the front and top, facing out, the same for the same seed', () => {
		const o = { width: 2000, height: 1000, depth: 600, leaf: 62, seed: 'h' };
		const leaves = hedgeLeaves(o);
		assert.deepEqual(hedgeLeaves(o), leaves);
		assert.ok(leaves.length > 1000);
		assert.ok(hedgeLeaves({ ...o, density: 2 }).length > leaves.length * 1.8);
		for (const l of leaves) {
			assert.ok(Math.abs(Math.hypot(...l.n) - 1) < 1e-9);
			assert.ok(l.depth >= 0 && l.depth <= 1);
			assert.ok(Math.abs(l.p[0]) <= 1000 && l.p[1] <= 1000 + 1e-9);
		}
		assert.ok(leaves.filter((l) => l.n[2] > 0.3).length > leaves.length * 0.6, 'most face out of the front');
	});
});
