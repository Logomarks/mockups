/**
 * @logomarks/mockups — the lens: its samples over the aperture, and the options it reads.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lensSamples, lensOf, LENS_SAMPLES } from '../src/three/lens.js';
import { reader } from '../src/util/reader.js';

describe('lens', () => {
	it('spreads its frames over the aperture, the same every time', () => {
		const s = lensSamples(32);
		assert.equal(s.length, 32);
		assert.deepEqual(lensSamples(32), s);
		for (const p of s) {
			assert.ok(Math.hypot(p.x, p.y) <= 1 + 1e-9, 'inside the disc');
			assert.ok(Math.abs(p.jx) <= 0.5 && Math.abs(p.jy) <= 0.5, 'nudged under a pixel');
		}
		// evenly: as many frames in the inner half of the area as the outer
		assert.equal(s.filter((p) => Math.hypot(p.x, p.y) < Math.SQRT1_2).length, 16);
		const mean = s.reduce((m, p) => [m[0] + p.x / 32, m[1] + p.y / 32], [0, 0]);
		assert.ok(Math.hypot(...mean) < 0.05, 'centred');
	});

	it('scales the scene’s aperture by blur, and reads samples', () => {
		assert.deepEqual(lensOf(reader('t', { art: 'x' }), { aperture: 0.02 }), { aperture: 0.01, samples: LENS_SAMPLES });
		assert.deepEqual(lensOf(reader('t', { art: 'x', blur: 0, samples: 8 }), { aperture: 0.02 }), { aperture: 0, samples: 8 });
		assert.equal(lensOf(reader('t', { art: 'x', blur: 3 }), { aperture: 0.02 }).aperture, 0.02, 'blur holds at 1');
		assert.throws(() => lensOf(reader('t', { art: 'x', blur: 'soft' }), { aperture: 0.02 }), /t: blur is a number/);
	});
});
