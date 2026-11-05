/**
 * @logomarks/mockups — boxes: mailers and lid boxes, open and closed (and
 * part open), boards, prints on each face (and kept inside it), and bad
 * options.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { box, BOXES } from '../src/objects/box.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#d9502e"/></svg>';
const SIDE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#2f6b4f"/></svg>';
const WIDE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 275 100"><rect width="275" height="100" fill="#2f6b4f"/></svg>';
const images = (s) => (s.match(/<image id="[^"]+-img\d+"/g) ?? []).length;

/**
 * Every print in a box's SVG, with the face that clips it: the print's box mapped to pixels, and the clip's polygon.
 *
 * @param {string} svg The SVG.
 * @returns {{ ref: string, corners: number[][], clip: number[][] | null }[]} The prints.
 */
function prints(svg) {
	const defs = svg.slice(0, svg.indexOf('</defs>'));
	const clips = new Map([...defs.matchAll(/<clipPath id="([^"]+)"><path d="([^"]+)"/g)].map((m) => [m[1], [...m[2].matchAll(/[ML]([-\d.]+) ([-\d.]+)/g)].map((p) => [+p[1], +p[2]])]));
	const widths = new Map([...defs.matchAll(/<image id="([^"]+)" width="([\d.]+)" height="([\d.]+)"/g)].map((m) => [m[1], [+m[2], +m[3]]]));
	const body = svg.slice(svg.indexOf('</defs>'));
	/** @type {{ clip?: string, matrix?: number[] }[]} */
	const stack = [];
	const out = [];
	for (const [tag] of body.matchAll(/<\/?g\b[^>]*>|<use\b[^>]*>/g)) {
		if (tag === '</g>') stack.pop();
		else if (tag.startsWith('<g')) {
			stack.push({ clip: /clip-path="url\(#([^)]+)\)"/.exec(tag)?.[1], matrix: /transform="matrix\(([^)]+)\)"/.exec(tag)?.[1].split(' ').map(Number) });
			if (tag.endsWith('/>')) stack.pop();
		} else {
			const ref = /href="#([^"]+-img\d+)"/.exec(tag)?.[1];
			if (!ref) continue;
			const [, x, y, sx, sy] = /translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)/.exec(tag).map(Number);
			const [iw, ih] = widths.get(ref);
			const m = [...stack].reverse().find((g) => g.matrix)?.matrix ?? [1, 0, 0, 1, 0, 0];
			const clip = [...stack].reverse().find((g) => g.clip)?.clip;
			const map = ([u, v]) => [m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5]];
			out.push({ ref, corners: [[x, y], [x + iw * sx, y], [x + iw * sx, y + ih * sy], [x, y + ih * sy]].map(map), clip: clip ? clips.get(clip) : null });
		}
	}
	return out;
}

/**
 * Whether a point is inside a convex polygon, give or take a pixel.
 *
 * @param {number[]} p The point.
 * @param {number[][]} poly The polygon.
 * @returns {boolean} Inside.
 */
function inside(p, poly) {
	const sides = poly.map((a, i) => {
		const b = poly[(i + 1) % poly.length];
		return ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / Math.hypot(b[0] - a[0], b[1] - a[1]);
	});
	return sides.every((d) => d >= -1) || sides.every((d) => d <= 1);
}

describe('box', () => {
	it('is a closed kraft mailer by default, in a 1600 square', () => {
		const m = box({ art: ART });
		assert.equal(m.object, 'box');
		assert.deepEqual([m.width, m.height], [1600, 1600]);
		assert.equal(images(m.svg), 1);
	});

	it('opens a mailer to show its lid’s inside and fluted edges', () => {
		const closed = box({ art: ART }).svg;
		const open = box({ art: ART, open: true, inside: SIDE }).svg;
		assert.ok((open.match(/-bface\d+"/g) ?? []).length > (closed.match(/-bface\d+"/g) ?? []).length);
		assert.match(open, /<path d="M0 [\d.]+Q/);
	});

	it('prints the top and, when given, the front', () => {
		assert.equal(images(box({ art: ART, side: SIDE, kind: 'lid' }).svg), 2);
	});

	it('clips every face’s print to that face, and fits it inside', () => {
		const looks = [
			box({ art: ART, side: WIDE }),
			box({ art: ART, side: WIDE, open: true, inside: SIDE }),
			box({ art: ART, side: WIDE, open: 0.4 }),
			box({ art: ART, side: WIDE, kind: 'lid' }),
			box({ art: ART, side: WIDE, kind: 'lid', open: true }),
		];
		for (const { svg } of looks) {
			const found = prints(svg);
			assert.ok(found.length >= 2);
			for (const { corners, clip } of found) {
				assert.ok(clip, 'drawn inside a face’s clip');
				for (const c of corners) assert.ok(inside(c, clip), `print corner ${c} inside its face`);
			}
		}
	});

	it('sets a wide print whole on a shallow lid band, at the band’s height', () => {
		const { svg } = box({ art: ART, side: WIDE, kind: 'lid' });
		// the band is 306 × 32 mm, far wider than the art's 2.75: so the art keeps its own proportions (not cropped to the band's) and sits inside the band with room round it
		const id = /<image id="([^"]+-img\d+)" width="2750"/.exec(svg)?.[1];
		assert.ok(id, 'the side art at its own aspect');
		const band = prints(svg).find((p) => p.ref === id);
		assert.ok(band?.clip);
		const wide = (pts) => Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0]));
		assert.ok(wide(band.corners) < wide(band.clip) * 0.5, 'centred, well short of the band’s ends');
	});

	it('opens part way, the same in 2D as in 3D: 0 closed, true all the way', () => {
		assert.equal(box({ art: ART, open: true }).svg, box({ art: ART, open: 1 }).svg);
		assert.equal(box({ art: ART, open: false }).svg, box({ art: ART, open: 0 }).svg);
		assert.notEqual(box({ art: ART, open: 0.4 }).svg, box({ art: ART, open: 1 }).svg);
		assert.notEqual(box({ art: ART, kind: 'lid', open: 0.5 }).svg, box({ art: ART, kind: 'lid', open: 1 }).svg);
	});

	it('takes kraft, white, black or a colour, each with its grain', () => {
		for (const board of /** @type {const} */ (['kraft', 'white', 'black', '#2f6b4f'])) {
			const { svg } = box({ art: ART, board });
			assert.match(svg, /<pattern id="[^"]+-board\d+"[^>]*patternTransform="matrix\(/, `${board} has a grain mapped to its faces`);
		}
		assert.match(box({ art: ART, board: 'black' }).svg, /fill="#212123"/);
		assert.match(box({ art: ART, open: true, lining: '#f4f1ea' }).svg, /fill="#f4f1ea"/);
	});

	it('is the same for the same options', () => {
		assert.equal(box({ art: ART, kind: 'lid', open: true }).svg, box({ art: ART, kind: 'lid', open: true }).svg);
		assert.ok(BOXES.lid.lid > 0 && BOXES.mailer.wall > 0);
	});

	it('refuses bad options', () => {
		assert.throws(() => box(/** @type {any} */ ({})), /art is required/);
		assert.throws(() => box({ art: ART, kind: /** @type {any} */ ('crate') }), /kind/);
		assert.throws(() => box({ art: ART, board: /** @type {any} */ ('pink') }), /board/);
		assert.throws(() => box({ art: ART, open: /** @type {any} */ ('yes') }), /open is true, false or a number 0–1/);
		assert.throws(() => box({ art: ART, open: 1.5 }), /open/);
	});
});
