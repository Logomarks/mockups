/**
 * @logomarks/mockups — the café and takeaway scenes without a GPU: three.js
 * is only imported when a scene is made, options are checked before
 * anything is drawn, and the shapes and layouts (napkin stacks, the cup's
 * profiles, the chopstick sleeve, the pizza box, the bag) are sound and
 * the same for the same seed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { napkinScene, napkinStack, NAPKIN, NAPKIN_COLORS } from '../src/three/napkin.js';
import { cupScene, cupProfile, lidProfile, cupRadius, CUP } from '../src/three/cup.js';
import { chopsticksScene, sleeveSection, chopstickPoses, CHOPSTICKS } from '../src/three/chopsticks.js';
import { takeawayScene, TAKEAWAY, pleat } from '../src/three/takeaway.js';
import { pizzaScene, pizzaLid } from '../src/three/pizza.js';
import { BOXES, BOX_KINDS, lidPose, boxExtent } from '../src/three/box.js';

const ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10"/></svg>';
const canvas = /** @type {any} */ ({ width: 10, height: 10 });

describe('café scenes', () => {
	it('import three.js only when a scene is made', async () => {
		for (const f of ['napkin', 'cup', 'chopsticks', 'takeaway', 'pizza', 'tabletop']) {
			const src = await readFile(new URL(`../src/three/${f}.js`, import.meta.url), 'utf8');
			assert.doesNotMatch(src, /^import .* from 'three/m, `${f}.js imports three statically`);
		}
	});

	it('check their options before drawing anything', async () => {
		for (const scene of [napkinScene, cupScene, chopsticksScene, takeawayScene, pizzaScene]) await assert.rejects(scene(canvas, /** @type {any} */ ({})), /art is required/);
		await assert.rejects(napkinScene(canvas, { art: ART, color: /** @type {any} */ ('teal') }), /color is 'white'/);
		await assert.rejects(napkinScene(canvas, { art: ART, print: /** @type {any} */ ('edge') }), /print/);
		await assert.rejects(napkinScene(canvas, { art: ART, ink: 'black' }), /ink is a hex colour/);
		await assert.rejects(cupScene(canvas, { art: ART, lid: /** @type {any} */ ('clear') }), /lid is 'white'/);
		await assert.rejects(cupScene(canvas, { art: ART, sleeve: /** @type {any} */ ('foil') }), /board is/);
		await assert.rejects(chopsticksScene(canvas, { art: ART, layout: /** @type {any} */ ('fan') }), /layout/);
		await assert.rejects(chopsticksScene(canvas, { art: ART, wood: 'oak' }), /wood is a hex colour/);
		await assert.rejects(takeawayScene(canvas, { art: ART, seal: 'red' }), /seal is a hex colour/);
		await assert.rejects(takeawayScene(canvas, { art: ART, paper: /** @type {any} */ ('foil') }), /board is/);
		await assert.rejects(pizzaScene(canvas, { art: ART, ink: 'red' }), /ink is a hex colour/);
		await assert.rejects(pizzaScene(canvas, { art: ART, board: /** @type {any} */ ('foil') }), /board is/);
	});

	it('stack napkins upwards, each a little askew, the same for the same seed', () => {
		const s = napkinStack(12, 'a');
		assert.equal(s.length, 12);
		assert.deepEqual(napkinStack(12, 'a'), s);
		assert.notDeepEqual(napkinStack(12, 'b'), s);
		s.forEach((n, i) => {
			assert.equal(n.y, i * NAPKIN.thick);
			assert.ok(Math.abs(n.x) <= 1.4 && Math.abs(n.z) <= 1.4);
		});
		assert.ok(Math.abs(s[11].turn) >= 2.5, 'the top one lies more turned');
		assert.ok(Object.values(NAPKIN_COLORS).every((c) => /^#[0-9a-f]{6}$/.test(c)));
	});

	it('turn a cup that tapers to its rim, rolled over, under a lid that covers it', () => {
		const p = cupProfile();
		assert.deepEqual(p[0], [0, 4], 'the base is recessed');
		assert.equal(cupRadius(0), CUP.base);
		assert.equal(cupRadius(CUP.height), CUP.rim);
		const top = Math.max(...p.map(([, y]) => y));
		assert.ok(top > CUP.height && top < CUP.height + 2 * CUP.roll, 'the rim rolls over the top');
		const lid = lidProfile();
		assert.ok(lid[0][0] > CUP.rim + CUP.roll * 1.4 - 0.5, 'the skirt clears the rolled rim');
		assert.ok(Math.max(...lid.map(([, y]) => y)) > top);
		assert.deepEqual(lid.at(-1)?.[0], 0);
	});

	it('round a chopstick sleeve over the sticks and press it flat at the folded end', () => {
		const C = CHOPSTICKS;
		const [x, top] = sleeveSection(0.5, 0);
		assert.ok(Math.abs(x) < 1e-9 && Math.abs(top - C.height) < 1e-9);
		assert.ok(Math.abs(sleeveSection(0.5, Math.PI / 2)[0] - C.width / 2) < 1e-9);
		assert.ok(sleeveSection(1, 0)[1] < C.height * 0.3, 'pressed flat at the far end');
		// the sticks stop inside the sleeve, before it's pressed flat
		assert.ok(C.stick - C.out < C.length * 0.92);
		assert.equal(chopstickPoses('single', 's').length, 1);
		assert.deepEqual(chopstickPoses('pair', 's'), chopstickPoses('pair', 's'));
	});

	it('make the pizza box a flat hinged mailer, its lid printed in one ink', () => {
		assert.ok(BOX_KINDS.includes('pizza'));
		assert.ok(BOXES.pizza.width === BOXES.pizza.depth && BOXES.pizza.height < 60);
		assert.deepEqual(lidPose('pizza', 1), lidPose('mailer', 1));
		assert.ok(boxExtent('pizza', 0).height > BOXES.pizza.height);
		const lid = pizzaLid({ mark: ART, name: 'Gecko', ink: '#c83a22' });
		assert.match(lid, /Gecko/);
		assert.match(lid, /stroke="#c83a22"/);
		assert.equal(pizzaLid({ mark: ART, name: 'Gecko', ink: '#c83a22' }), lid);
		assert.doesNotMatch(pizzaLid({ mark: ART, name: '', ink: '#000000', roundel: false }), /<circle/);
	});

	it('stand the takeaway bag square, its gussets pleated in, the seal straddling the flap', () => {
		assert.equal(pleat(0), TAKEAWAY.pleat[0]);
		assert.equal(pleat(TAKEAWAY.height), TAKEAWAY.pleat[1]);
		assert.ok(pleat(TAKEAWAY.height / 2) < pleat(TAKEAWAY.height * 0.9), 'the V deepens towards the top');
		assert.ok(TAKEAWAY.pleat[1] < TAKEAWAY.depth / 2, 'a shallow V, not folded flat');
		assert.ok(TAKEAWAY.seal < TAKEAWAY.width && TAKEAWAY.seal / 2 < TAKEAWAY.flap);
	});
});
