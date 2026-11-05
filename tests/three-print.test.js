/**
 * @logomarks/mockups — the 3D print scenes without a GPU: three.js is only
 * imported when a scene is made, options are checked before anything is
 * drawn, and the layout maths (cards, box lids, mug prints, studio lights).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cardScene, cardPoses, CARD_SCENE_LAYOUTS } from '../src/three/card.js';
import { boxScene, lidPose, boxExtent, BOXES, BOX_KINDS } from '../src/three/box.js';
import { mugScene, printMode, decalBoxes, MUG, MUG_PRINTS } from '../src/three/mug.js';
import { softboxes } from '../src/three/studioenv.js';
import { lidPose as sharedLidPose } from '../src/parts/lid.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#2f6b4f"/></svg>';
const canvas = /** @type {any} */ ({ width: 10, height: 10 });
const C = 2 * Math.PI * MUG.radius;

describe('3d print scenes', () => {
	it('import three.js only when a scene is made', async () => {
		for (const f of ['card', 'box', 'mug', 'printart', 'deskplane', 'board', 'printshot', 'studioenv']) {
			const src = await readFile(new URL(`../src/three/${f}.js`, import.meta.url), 'utf8');
			assert.doesNotMatch(src, /^import .* from 'three/m, `${f}.js imports three statically`);
		}
	});

	it('check their options before drawing anything', async () => {
		await assert.rejects(cardScene(canvas, /** @type {any} */ ({})), /art is required/);
		await assert.rejects(cardScene(canvas, { art: ART, layout: /** @type {any} */ ('hand') }), /layout/);
		await assert.rejects(cardScene(canvas, { art: ART, edge: 'red' }), /edge/);
		await assert.rejects(cardScene(canvas, { art: ART, stock: /** @type {any} */ ('vellum') }), /stock/);
		await assert.rejects(boxScene(canvas, { art: ART, kind: /** @type {any} */ ('crate') }), /kind/);
		await assert.rejects(boxScene(canvas, { art: ART, view: /** @type {any} */ ({ tilt: 'high' }) }), /view.tilt/);
		await assert.rejects(boxScene(canvas, { art: ART, print: /** @type {any} */ ('tile') }), /print/);
		await assert.rejects(boxScene(canvas, { art: ART, board: /** @type {any} */ ('pink') }), /boxScene: board is 'kraft', 'white', 'black' or a hex colour/);
		await assert.rejects(boxScene(canvas, { art: ART, lining: 'beige' }), /lining/);
		await assert.rejects(boxScene(canvas, { art: ART, open: /** @type {any} */ ('wide') }), /open/);
		await assert.rejects(mugScene(canvas, { art: ART, handle: /** @type {any} */ ('up') }), /handle/);
		await assert.rejects(mugScene(canvas, { art: ART, color: 'white' }), /color/);
		await assert.rejects(mugScene(canvas, { art: ART, surface: /** @type {any} */ ('marble') }), /surface/);
	});

	it('lay cards out as the 2D mockup does, centred, each resting on the one under it', () => {
		assert.deepEqual([...CARD_SCENE_LAYOUTS], ['flat', 'pair', 'stack', 'fan']);
		const pair = cardPoses('pair', true, 5, 's', 0.5);
		assert.equal(pair.cards.length, 2);
		assert.equal(pair.cards[1].side, 'back');
		assert.ok(pair.cards[1].y > pair.cards[0].y);
		const xs = pair.cards.map((c) => c.x);
		assert.ok(Math.abs(Math.min(...xs) + Math.max(...xs)) < 20, 'roughly centred');
		const stack = cardPoses('stack', true, 8, 's', 1);
		assert.equal(stack.cards.length, 9);
		assert.ok(Math.abs(stack.cards[7].y - 7 * 1.02) < 1e-9, 'the top of the pile');
		assert.equal(stack.cards[8].y, 0, 'the back beside it, on the desk');
	});

	it('opens a mailer about its hinge and lifts a lid, as the 2D box does', () => {
		assert.deepEqual([...BOX_KINDS], ['mailer', 'lid', 'pizza']);
		assert.equal(lidPose('mailer', 0).hinge, 0);
		assert.ok(lidPose('mailer', 1).hinge > 90);
		assert.equal(lidPose('lid', 0).lift, 0);
		assert.ok(lidPose('lid', 1).lift > 100);
		assert.ok(boxExtent('mailer', 1).height > boxExtent('mailer', 0).height);
		assert.ok(BOXES.mailer.width === 250 && BOXES.lid.height === 110);
		assert.equal(lidPose, sharedLidPose, 'one lid pose for 2D and 3D');
	});

	it('wraps wide art round the mug to the handle, and puts other art on the front', () => {
		assert.deepEqual([...MUG_PRINTS], ['auto', 'front', 'both', 'wrap']);
		assert.equal(printMode('auto', 2.5), 'wrap');
		assert.equal(printMode('auto', 1), 'front');
		assert.equal(printMode('both', 3), 'both');
		const [front] = decalBoxes('front', 1, 'right');
		assert.ok(Math.abs(front.x + front.w / 2 - C / 2) < 1e-9, 'centred on the front');
		// the wrap's middle is opposite the handle, so its ends meet under it
		const [wrap] = decalBoxes('wrap', 2.6, 'right');
		assert.ok(Math.abs(wrap.x + wrap.w / 2 - C * 0.25) < 1e-9);
		assert.ok(wrap.w <= C - 30);
		assert.equal(decalBoxes('both', 1, 'left').length, 2);
	});

	it('puts the studio key in front, on the light’s side', () => {
		const [left] = softboxes(-1);
		const [right] = softboxes(1);
		assert.ok(left.u > 0.75 && right.u < 0.75);
	});
});
