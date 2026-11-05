/**
 * @module @logomarks/mockups/parts/cassette/shell
 *
 * A compact cassette, front on: the 100.4 × 63.8 mm shell in black, white,
 * clear, smoke or any colour; its label (the cover across it, with the
 * side letter and the title) and the window cut through it, showing the
 * hubs and the tape wound on them; the head area along the bottom with
 * the tape across its openings; the five screws; and the plastic's sheen
 * and lit edges. A clear shell shows the whole tape pack inside. Drawn in
 * millimetres inside a group scaled to pixels.
 */

import { el, circlePath, esc } from '../../render/svg.js';
import { isHex, luma } from '../../util/color.js';
import { clamp, n } from '../../util/num.js';

/** A cassette shell's size, in mm (IEC 60094). */
export const SHELL = Object.freeze({ width: 100.4, height: 63.8 });

/** The named shells: colour and opacity. */
export const SHELLS = Object.freeze({
	black: Object.freeze({ color: '#151517', opacity: 1 }),
	white: Object.freeze({ color: '#ecebe7', opacity: 1 }),
	clear: Object.freeze({ color: '#d4d9dc', opacity: 0.2 }),
	smoke: Object.freeze({ color: '#2a2b30', opacity: 0.6 }),
});

/** The type the label is set in. */
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** The hubs' centres, the window, and the label, in mm. */
const HUBS = /** @type {const} */ ([[29, 27], [71.4, 27]]);
const WINDOW = Object.freeze({ x: 18, y: 19, w: 64.4, h: 16, r: 4 });
const LABEL = Object.freeze({ x: 6, y: 4.6, w: 88.4, h: 40, r: 2.4 });

/**
 * A shell from its option.
 *
 * @param {unknown} spec `'black'`, `'white'`, `'clear'`, `'smoke'`, a hex colour (solid), or `{ color, opacity }`.
 * @returns {{ color: string, opacity: number }} Its colour, and how much light it stops.
 * @throws {TypeError} For anything else.
 */
export function resolveShell(spec = 'black') {
	if (typeof spec === 'string' && Object.hasOwn(SHELLS, spec)) return { ...SHELLS[/** @type {keyof typeof SHELLS} */ (spec)] };
	if (isHex(spec)) return { color: /** @type {string} */ (spec), opacity: 1 };
	if (spec && typeof spec === 'object' && 'color' in spec && isHex(spec.color)) {
		const o = /** @type {{ color: string, opacity?: unknown }} */ (spec);
		return { color: o.color, opacity: clamp(typeof o.opacity === 'number' ? o.opacity : 0.6) };
	}
	throw new TypeError(`cassette: shell is 'black', 'white', 'clear', 'smoke', a hex colour or { color, opacity } (got ${JSON.stringify(spec)})`);
}

/**
 * A cassette shell.
 *
 * @param {import('../../render/scene.js').Scene} sc The document.
 * @param {object} o The cassette.
 * @param {number} o.x Its left edge (px).
 * @param {number} o.y Its top edge (px).
 * @param {number} o.mm Pixels per millimetre.
 * @param {{ color: string, opacity: number }} o.shell Its plastic.
 * @param {import('../../render/scene.js').PlaceArt | null} o.label The label's art, placed in its box (`null`: a plain label).
 * @param {string} o.paper The label's paper colour.
 * @param {string} o.title The title on the label.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @returns {string} The markup.
 */
export function shell(sc, { x, y, mm, shell: s, label, paper, title, light }) {
	const { width: W, height: H } = SHELL;
	const lx = clamp(light, -1, 1);
	const see = s.opacity < 0.98;
	const dark = !see && luma(s.color) < 0.35;
	const ids = { clip: sc.id('shell'), win: sc.id('window'), lab: sc.id('tlabel'), edge: sc.id('tedge'), sheen: sc.id('tsheen'), tape: sc.id('tape') };
	const body = `M3.5 0H${n(W - 3.5)}A3.5 3.5 0 0 1 ${n(W)} 3.5V${n(H - 3.5)}A3.5 3.5 0 0 1 ${n(W - 3.5)} ${n(H)}H3.5A3.5 3.5 0 0 1 0 ${n(H - 3.5)}V3.5A3.5 3.5 0 0 1 3.5 0Z`;
	const win = rounded(WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h, WINDOW.r);
	sc.def(el('clipPath', { id: ids.clip }, el('path', { d: body })));
	sc.def(el('clipPath', { id: ids.win }, el('path', { d: win })));
	sc.def(el('clipPath', { id: ids.lab }, el('path', { d: rounded(LABEL.x, LABEL.y, LABEL.w, LABEL.h, LABEL.r) + win, 'clip-rule': 'evenodd' })));
	sc.def(
		el(
			'linearGradient',
			{ id: ids.edge, x1: 0.5 + 0.5 * lx, y1: 0, x2: 0.5 - 0.5 * lx, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': dark ? 0.45 : 0.8 }),
			el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0.1 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.35 }),
		),
	);
	sc.def(
		el(
			'linearGradient',
			{ id: ids.sheen, x1: 0.5 + 0.4 * lx, y1: 0, x2: 0.5 - 0.4 * lx, y2: 1 },
			el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': dark ? 0.12 : 0.18 }),
			el('stop', { offset: 0.45, 'stop-color': '#fff', 'stop-opacity': 0 }),
			el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.14 }),
		),
	);
	sc.def(
		el(
			'radialGradient',
			{ id: ids.tape },
			el('stop', { offset: 0.3, 'stop-color': '#3a2a22' }),
			el('stop', { offset: 0.8, 'stop-color': '#2a1d17' }),
			el('stop', { offset: 0.97, 'stop-color': '#4a3a30' }),
			el('stop', { offset: 1, 'stop-color': '#1c130f' }),
		),
	);
	// inside: the tape wound on its hubs (a full reel left, a little right), the hubs and their teeth
	const pack = HUBS.map(([hx, hy], i) => el('circle', { cx: hx, cy: hy, r: i ? 10.5 : 19.5, fill: `url(#${ids.tape})` })).join('');
	const hubs = HUBS.map(([hx, hy]) => hub(hx, hy)).join('');
	const tapeRun = el('path', { d: `M6 57H${n(W - 6)}`, stroke: '#2a1d17', 'stroke-width': 0.9, fill: 'none' });
	// a clear shell shows its works: the inner walls, the rollers, the tape's path to the head
	const works = see
		? el('rect', { x: 2.2, y: 2.2, width: W - 4.4, height: H - 4.4, rx: 2.5, fill: 'none', stroke: '#000', 'stroke-opacity': 0.12, 'stroke-width': 0.5 }) +
			[[8.6, 54.5], [W - 8.6, 54.5]].map(([rx, ry]) => el('circle', { cx: rx, cy: ry, r: 2, fill: '#fff', 'fill-opacity': 0.5, stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': 0.3 })).join('') +
			el('path', { d: `M${HUBS[0][0] - 19.3} 30L6.8 54.5L27 ${n(H - 1.2)}M${HUBS[1][0] + 10.3} 29L${n(W - 6.8)} 54.5L73 ${n(H - 1.2)}`, stroke: '#2a1d17', 'stroke-width': 0.7, fill: 'none', 'stroke-opacity': 0.8 }) +
			HUBS.map(([hx, hy]) => el('circle', { cx: hx, cy: hy, r: 8.5, fill: 'none', stroke: '#000', 'stroke-opacity': 0.1, 'stroke-width': 0.4 })).join('')
		: '';
	// a clear shell tints and hazes whatever's behind it; a solid one is dark inside
	const inside = el('g', {}, see ? el('rect', { width: W, height: H, fill: s.color, opacity: s.opacity }) + el('rect', { width: W, height: H, fill: '#fff', opacity: 0.12 }) : el('rect', { width: W, height: H, fill: '#141414' }), pack, works, see ? '' : tapeRun, hubs);
	// the face: the plastic with the window cut out (a clear shell is plastic all over)
	const face = see
		? el('path', { d: body, fill: '#fff', 'fill-opacity': 0.08 })
		: el('path', { d: body + win, fill: s.color, 'fill-rule': 'evenodd' });
	const ink = '#1a1a1c';
	const labelArt = el(
		'g',
		{ 'clip-path': `url(#${ids.lab})` },
		el('rect', { x: LABEL.x, y: LABEL.y, width: LABEL.w, height: LABEL.h, fill: paper }),
		label ? label(LABEL.x, LABEL.y, LABEL.w, LABEL.h) : '',
		// a band for the writing, as printed labels have
		el('rect', { x: LABEL.x, y: LABEL.y, width: LABEL.w, height: 9.5, fill: paper, opacity: label ? 0.88 : 0 }),
		el('circle', { cx: LABEL.x + 5.5, cy: LABEL.y + 4.8, r: 3.1, fill: ink }),
		el('text', { x: LABEL.x + 5.5, y: LABEL.y + 6.25, 'font-family': FONT, 'font-size': 4, 'font-weight': 700, fill: paper, 'text-anchor': 'middle' }, 'A'),
		title ? el('text', { x: LABEL.x + 11, y: LABEL.y + 6.2, 'font-family': FONT, 'font-size': 3.3, 'font-weight': 600, 'letter-spacing': 0.35, fill: ink }, esc(title.toUpperCase())) : '',
		el('text', { x: LABEL.x + LABEL.w - 3, y: LABEL.y + 6.2, 'font-family': FONT, 'font-size': 2.4, 'font-weight': 500, 'letter-spacing': 0.3, fill: ink, opacity: 0.75, 'text-anchor': 'end' }, 'NR [ ] · TYPE I'),
		el('path', { d: rounded(LABEL.x, LABEL.y, LABEL.w, LABEL.h, LABEL.r), fill: 'none', stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': 0.2 }),
	);
	// the window's clear sheet, its frame catching the light
	const glassSheet = el('g', { 'clip-path': `url(#${ids.win})` }, el('rect', { x: WINDOW.x, y: WINDOW.y, width: WINDOW.w, height: WINDOW.h, fill: '#fff', 'fill-opacity': 0.1 }), el('path', { d: `M${WINDOW.x + 30} ${WINDOW.y}l-9 ${WINDOW.h}h5l9 ${-WINDOW.h}z`, fill: '#fff', 'fill-opacity': 0.12, filter: sc.blur(0.8) }));
	const winEdge = el('path', { d: win, fill: 'none', stroke: '#000', 'stroke-opacity': 0.45, 'stroke-width': 0.35 }) + el('path', { d: win, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.25, 'stroke-width': 0.2, transform: 'translate(0 0.35)' });
	// the head area: a raised trapezoid along the bottom, its openings showing the tape running past
	const head = `M22 ${n(H)}L25.6 51.5H74.8L78.4 ${n(H)}Z`;
	const holes = [27.5, 37, 47.4, 57.8, 67.4].map((hx, i) => el('rect', { x: hx, y: H - (i === 2 ? 6 : 4.4), width: i === 2 ? 5.6 : 5, height: i === 2 ? 6 : 4.4, rx: 0.5, fill: '#120d0a' })).join('');
	const headArea =
		el('path', { d: head, fill: s.color, opacity: see ? 0.25 : 1 }) +
		el('path', { d: head, fill: '#fff', 'fill-opacity': dark ? 0.05 : 0.08 }) +
		el('path', { d: head, fill: 'none', stroke: '#fff', 'stroke-opacity': dark ? 0.18 : 0.4, 'stroke-width': 0.3 }) +
		holes +
		el('line', { x1: 27, y1: H - 1.2, x2: 73, y2: H - 1.2, stroke: '#3a2a22', 'stroke-width': 0.8 }) +
		[31.5, 68.8].map((hx) => el('circle', { cx: hx, cy: H - 7.3, r: 1.3, fill: '#0e0b09' })).join('');
	const screws = [[4.8, 4.8], [W - 4.8, 4.8], [4.8, H - 4.8], [W - 4.8, H - 4.8], [W / 2, H - 9.6]].map(([sx, sy]) => screw(sx, sy)).join('');
	return el(
		'g',
		{ transform: `translate(${n(x)} ${n(y)}) scale(${n(mm)})` },
		el('g', { 'clip-path': `url(#${ids.clip})` }, inside, face, headArea, el('path', { d: body, fill: `url(#${ids.sheen})` }), labelArt, glassSheet, winEdge, screws),
		// the seam where the halves meet, and the lit edge
		el('path', { d: body, fill: 'none', stroke: `url(#${ids.edge})`, 'stroke-width': 0.6, transform: 'translate(0.3 0.3) scale(0.994)' }),
		el('path', { d: body, fill: 'none', stroke: '#000', 'stroke-opacity': 0.35, 'stroke-width': 0.2 }),
	);
}

/**
 * A rounded rectangle as path data.
 *
 * @param {number} x Left.
 * @param {number} y Top.
 * @param {number} w Width.
 * @param {number} h Height.
 * @param {number} r Corner radius.
 * @returns {string} Path data.
 */
function rounded(x, y, w, h, r) {
	return `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${r} ${r} 0 0 1 ${n(x + w)} ${n(y + r)}V${n(y + h - r)}A${r} ${r} 0 0 1 ${n(x + w - r)} ${n(y + h)}H${n(x + r)}A${r} ${r} 0 0 1 ${n(x)} ${n(y + h - r)}V${n(y + r)}A${r} ${r} 0 0 1 ${n(x + r)} ${n(y)}Z`;
}

/**
 * A hub: a white plastic ring with six teeth inside.
 *
 * @param {number} x Its centre, x.
 * @param {number} y Its centre, y.
 * @returns {string} The markup.
 */
function hub(x, y) {
	let teeth = '';
	for (let i = 0; i < 6; i++) teeth += el('rect', { x: -0.7, y: -4.6, width: 1.4, height: 1.8, fill: '#e9e7e2', transform: `translate(${x} ${y}) rotate(${i * 60})` });
	return el('path', { d: circlePath(x, y, 6.6) + circlePath(x, y, 4.6), fill: '#efede8', 'fill-rule': 'evenodd' }) + el('circle', { cx: x, cy: y, r: 6.6, fill: 'none', stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': 0.25 }) + teeth;
}

/**
 * A screw head, a cross cut in it.
 *
 * @param {number} x Its centre, x.
 * @param {number} y Its centre, y.
 * @returns {string} The markup.
 */
function screw(x, y) {
	return (
		el('circle', { cx: x, cy: y, r: 1.75, fill: '#000', 'fill-opacity': 0.35 }) +
		el('circle', { cx: x, cy: y, r: 1.45, fill: '#a8acb0' }) +
		el('circle', { cx: x - 0.35, cy: y - 0.35, r: 0.8, fill: '#e4e6e8', 'fill-opacity': 0.7 }) +
		el('path', { d: `M${n(x - 0.9)} ${n(y)}H${n(x + 0.9)}M${n(x)} ${n(y - 0.9)}V${n(y + 0.9)}`, stroke: '#3c3f42', 'stroke-width': 0.35 })
	);
}
