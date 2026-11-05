/**
 * @module @logomarks/mockups/parts/screen/ui
 *
 * The small pieces every screen is built from, drawn on a 1080-unit-wide
 * screen: the type, the light and dark themes, a status bar (time, signal,
 * battery: no maker's icons), placeholder text as soft bars, and a round
 * avatar. Placeholders stand in for anything that isn't the brand's.
 */

import { el, esc } from '../../render/svg.js';
import { rng } from '../../util/rng.js';

/** The screens' typeface: the system sans. */
export const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** The two themes: background, raised surface, ink, muted ink, hairlines and placeholder bars. */
export const THEMES = Object.freeze({
	light: Object.freeze({ bg: '#ffffff', raised: '#f2f3f5', ink: '#121418', muted: '#6b7079', line: '#e6e7ea', bar: '#dfe1e5' }),
	dark: Object.freeze({ bg: '#0e1013', raised: '#1b1e23', ink: '#f2f3f5', muted: '#969ba3', line: '#24272c', bar: '#2c3036' }),
});

/**
 * One line of type.
 *
 * @param {string} text The words.
 * @param {number} x Where it starts (or its middle, or its end, by `anchor`).
 * @param {number} y Its baseline.
 * @param {number} size Its size.
 * @param {string} fill Its colour.
 * @param {{ weight?: number, anchor?: 'start' | 'middle' | 'end', opacity?: number, spacing?: number }} [o] Its weight (400), anchor, opacity and letter-spacing.
 * @returns {string} The markup.
 */
export const text = (text, x, y, size, fill, { weight = 400, anchor = 'start', opacity, spacing } = {}) =>
	el('text', { x, y, fill, 'font-family': FONT, 'font-size': size, 'font-weight': weight, 'text-anchor': anchor, opacity, 'letter-spacing': spacing }, esc(text));

/**
 * Placeholder text: soft rounded bars of seeded lengths.
 *
 * @param {object} o The block.
 * @param {number} o.x Its left edge.
 * @param {number} o.y The first bar's top.
 * @param {number} o.width The longest a bar may be.
 * @param {number} o.lines How many bars.
 * @param {number} o.size A bar's height (a line of type's x-height, roughly).
 * @param {string} o.fill Their colour.
 * @param {string} o.seed Seeds their lengths.
 * @param {number} [o.gap] Line spacing (2.1 × size).
 * @returns {string} The markup.
 */
export function bars({ x, y, width, lines, size, fill, seed, gap = size * 2.1 }) {
	const r = rng(`${seed}:bars`);
	let out = '';
	for (let i = 0; i < lines; i++) {
		const w = width * (i === lines - 1 && lines > 1 ? r.range(0.35, 0.6) : r.range(0.82, 1));
		out += el('rect', { x, y: y + i * gap, width: w, height: size, rx: size / 2, fill });
	}
	return out;
}

/**
 * A status bar: the time on the left; signal, wireless and battery on the right.
 *
 * @param {number} width The screen's width.
 * @param {string} ink Their colour.
 * @param {number} [top=0] Where the bar starts.
 * @returns {string} The markup.
 */
export function statusBar(width, ink, top = 0) {
	const s = width / 1080;
	const y = top + 74 * s;
	const right = width - 70 * s;
	let sig = '';
	for (let i = 0; i < 4; i++) sig += el('rect', { x: right - 250 * s + i * 15 * s, y: y - (12 + i * 7) * s, width: 10 * s, height: (12 + i * 7) * s, rx: 2.5 * s, fill: ink });
	const arc = (r) => `M${-r * 0.75} ${-r * 0.66}A${r} ${r} 0 0 1 ${r * 0.75} ${-r * 0.66}`;
	const wifi = el(
		'g',
		{ transform: `translate(${right - 150 * s} ${y + 1 * s}) scale(${s})`, fill: 'none', stroke: ink, 'stroke-width': 6, 'stroke-linecap': 'round' },
		el('path', { d: arc(32) }),
		el('path', { d: arc(20) }),
		el('circle', { cx: 0, cy: -5, r: 4.5, fill: ink, stroke: 'none' }),
	);
	const bat = el(
		'g',
		{ transform: `translate(${right - 92 * s} ${y - 26 * s}) scale(${s})` },
		el('rect', { x: 0, y: 0, width: 80, height: 30, rx: 9, fill: 'none', stroke: ink, 'stroke-width': 3, opacity: 0.45 }),
		el('rect', { x: 5, y: 5, width: 56, height: 20, rx: 5, fill: ink }),
		el('rect', { x: 83, y: 10, width: 5, height: 10, rx: 2, fill: ink, opacity: 0.45 }),
	);
	return text('10:24', 80 * s, y, 42 * s, ink, { weight: 600 }) + sig + wifi + bat;
}

/**
 * Art in a circle (an avatar), with a hairline round it.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {import('../../types.js').Art} art The picture.
 * @param {number} cx Its centre, x.
 * @param {number} cy Its centre, y.
 * @param {number} r Its radius.
 * @returns {string} The markup.
 */
export function avatar(sc, art, cx, cy, r) {
	const clip = sc.id('avatar');
	sc.def(el('clipPath', { id: clip }, el('circle', { cx, cy, r })));
	return el('g', { 'clip-path': `url(#${clip})` }, sc.image(art, 1)(cx - r, cy - r, 2 * r, 2 * r)) + el('circle', { cx, cy, r: r - 0.75, fill: 'none', stroke: '#000', 'stroke-opacity': 0.1, 'stroke-width': 1.5 });
}
