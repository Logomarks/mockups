/**
 * @logomarks/mockups — the lockup: the mark and the name, sized and set in a box.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lockup, lockupIn, lockupSize, typeWidth } from '../src/parts/lockup.js';
import { scene } from '../src/render/scene.js';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="currentColor"/></svg>';

describe('lockup', () => {
	it('measures a row wider than its mark, and a stack taller', () => {
		assert.deepEqual(lockupSize({ size: 100 }), { width: 100, height: 100 });
		const row = lockupSize({ name: 'Gecko', size: 100 });
		assert.ok(row.width > 200 && row.height === 100);
		const stack = lockupSize({ name: 'Gecko', size: 100, layout: 'stack' });
		assert.ok(stack.height > 100 && stack.width < row.width);
		assert.ok(typeWidth('mmm', 10) > typeWidth('iii', 10));
	});

	it('inks a currentColor mark and sets the name', () => {
		const sc = scene({ width: 400, height: 100 });
		const out = lockup(sc, { mark: MARK, name: 'Gecko & Co', ink: '#e2552c', size: 80, x: 0, y: 0 });
		assert.match(out, /Gecko &amp; Co/);
		assert.match(out, /fill="#e2552c"/);
		assert.match(sc.svg(), /data:image\/svg\+xml;base64/);
	});

	it('fits a box, centred or at its start', () => {
		const at = (align) => {
			const sc = scene({ width: 1000, height: 200 });
			return lockupIn(sc, { mark: MARK, name: 'Railkin', ink: '#000000', size: 500, x: 100, y: 0, width: 800, height: 200, align });
		};
		const x = (s) => Number(/<text[^>]* x="([\d.]+)"/.exec(s)?.[1]);
		assert.ok(x(at('middle')) > x(at('start')));
		assert.equal(at('middle'), at('middle'), 'the same every time');
	});
});
