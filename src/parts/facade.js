/**
 * @module @logomarks/mockups/parts/facade
 *
 * A shopfront drawn flat (it's warped onto the building's face
 * afterwards): painted pilasters with consoles, the fascia carrying the
 * brand's mark and name in raised letters, a moulded cornice, a shop
 * window (a warm interior, the sky reflected, mullions), a glazed door
 * with the mark on its glass, and a panelled stallriser. Units are metres
 * times the drawing's scale, from the shopfront's top-left.
 */

import { el } from '../render/svg.js';
import { fitArt } from '../render/fit.js';
import { esc } from '../render/svg.js';
import { FONT } from './screen/ui.js';
import { mix } from '../util/color.js';
import { clamp } from '../util/num.js';

/** The shopfront's parts, in metres from its bottom-left: width, height, pilaster, fascia band, window sill, and the door's width. */
export const SHOP = Object.freeze({ width: 7, height: 4.4, pilaster: 0.38, fascia: [3.35, 4.1], cornice: 0.18, sill: 0.65, door: 1.25 });

/**
 * A shopfront.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The shopfront.
 * @param {number} o.scale Drawing units per metre.
 * @param {string} o.name The brand's name, on the fascia.
 * @param {import('../types.js').Art} [o.mark] The brand's mark, beside the name.
 * @param {import('../types.js').Art} [o.decal] The mark as a decal on the door's glass (light, to read on the dark glass).
 * @param {string} o.color The fascia's colour.
 * @param {string} o.ink The lettering's colour.
 * @param {string} o.joinery The pilasters', frames' and stallriser's paint.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @returns {string} The markup, in `[0, width] × [0, height]` (scaled).
 */
export function facade(sc, { scale: k, name, mark, decal, color, ink, joinery, light }) {
	const S = SHOP;
	const [W, H] = [S.width * k, S.height * k];
	const y = (m) => H - m * k; // metres up from the ground to drawing y
	const lx = clamp(light, -1, 1);
	const p = S.pilaster * k;
	const ids = { glass: sc.id('glass'), sky: sc.id('reflect'), warm: sc.id('warm'), lip: sc.id('lip'), paint: sc.id('paint') };
	sc.def(el('linearGradient', { id: ids.glass, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': '#2d2a26' }), el('stop', { offset: 1, 'stop-color': '#121110' })));
	sc.def(el('linearGradient', { id: ids.sky, x1: lx >= 0 ? 1 : 0, y1: 0, x2: lx >= 0 ? 0.4 : 0.6, y2: 1 }, el('stop', { offset: 0, 'stop-color': '#d6e3ef', 'stop-opacity': 0.55 }), el('stop', { offset: 0.45, 'stop-color': '#c4d2df', 'stop-opacity': 0.18 }), el('stop', { offset: 1, 'stop-color': '#c4d2df', 'stop-opacity': 0.04 })));
	sc.def(el('radialGradient', { id: ids.warm }, el('stop', { offset: 0, 'stop-color': '#ffcf8a', 'stop-opacity': 0.55 }), el('stop', { offset: 1, 'stop-color': '#ffcf8a', 'stop-opacity': 0 })));
	sc.def(el('linearGradient', { id: ids.lip, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.35 }), el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0 })));
	sc.def(el('linearGradient', { id: ids.paint, x1: lx >= 0 ? 1 : 0, y1: 0, x2: lx >= 0 ? 0 : 1, y2: 0 }, el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.08 }), el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.1 })));

	const rect = (x0, y0, x1, y1, fill, extra = {}) => el('rect', { x: x0, y: y1, width: x1 - x0, height: y0 - y1, fill, ...extra });
	// the frame of the whole front, pilasters and their consoles
	const frame = rect(0, y(0), W, y(S.fascia[1] + S.cornice), joinery);
	const pilasters = [0, W - p].map((x) => rect(x, y(0), x + p, y(S.fascia[1]), mix(joinery, '#fff', 0.06)) + rect(x + p * 0.18, y(S.fascia[0] - 0.05), x + p * 0.82, y(S.fascia[1] + 0.05), mix(joinery, '#fff', 0.12)) + el('rect', { x: x + p * 0.18, y: y(S.fascia[1] + 0.05), width: p * 0.64, height: 0.04 * k, fill: '#000', opacity: 0.25 })).join('');
	// the fascia: board, cornice above it and its shadow, the lettering
	const [f0, f1] = S.fascia;
	const fx0 = p;
	const fx1 = W - p;
	const board = rect(fx0, y(f0), fx1, y(f1), color) + rect(fx0, y(f0), fx1, y(f1), 'none', { stroke: mix(color, '#000', 0.35), 'stroke-width': 0.025 * k });
	const cornice = rect(-0.06 * k, y(f1), W + 0.06 * k, y(f1 + S.cornice), mix(joinery, '#fff', 0.1)) + rect(-0.06 * k, y(f1 + S.cornice * 0.55), W + 0.06 * k, y(f1 + S.cornice * 0.62), '#000', { opacity: 0.18 }) + rect(fx0, y(f1) + 0.001, fx1, y(f1 - 0.16), `url(#${ids.lip})`);
	const bandH = (f1 - f0) * k;
	const size = Math.min(bandH * 0.5, ((fx1 - fx0) * 0.62) / Math.max(4, name.length * 0.62));
	const markSize = mark ? size * 1.35 : 0;
	const gap = mark ? size * 0.45 : 0;
	const textW = name.length * size * 0.6;
	const startX = (W - (markSize + gap + textW)) / 2;
	const cy = (y(f0) + y(f1)) / 2;
	const shadow = { dx: -lx * size * 0.05, dy: size * 0.06 };
	const letters = (fill, dx = 0, dy = 0, opacity) => el('text', { x: startX + markSize + gap + dx, y: cy + size * 0.36 + dy, fill, opacity, 'font-family': FONT, 'font-size': size, 'font-weight': 700, 'letter-spacing': size * 0.04 }, esc(name));
	const lettering =
		(mark ? fitArt(sc, mark, { x: startX, y: cy - markSize / 2, width: markSize, height: markSize }, 'contain') : '') + letters('#000', shadow.dx, shadow.dy, 0.35) + letters(ink);
	// the window: interior, warm light, mullions, reflections
	const wx0 = p + 0.06 * k;
	const wx1 = W - p - S.door * k - 0.1 * k;
	const wy0 = S.sill;
	const wy1 = f0 - 0.12;
	const glassRect = (x0, x1, b, t) => pane(sc, { x0, x1, y0: y(t), y1: y(b), k, light: lx, ids });
	const mullions = [1 / 3, 2 / 3].map((t) => rect(wx0 + (wx1 - wx0) * t - 0.035 * k, y(wy0), wx0 + (wx1 - wx0) * t + 0.035 * k, y(wy1), joinery)).join('') + rect(wx0, y(wy1 - 0.45), wx1, y(wy1 - 0.42), joinery);
	const windowFrame = rect(wx0, y(wy0), wx1, y(wy1), 'none', { stroke: mix(joinery, '#000', 0.3), 'stroke-width': 0.05 * k });
	const riser = rect(wx0, y(0.05), wx1, y(wy0 - 0.06), mix(joinery, '#000', 0.08)) + [0, 1, 2].map((i) => rect(wx0 + ((wx1 - wx0) * (i + 0.08)) / 3, y(0.14), wx0 + ((wx1 - wx0) * (i + 0.92)) / 3, y(wy0 - 0.15), 'none', { stroke: mix(joinery, '#000', 0.3), 'stroke-width': 0.02 * k })).join('');
	// the door: glazed, a kick plate, a bar handle, the mark on its glass
	const dx0 = W - p - S.door * k;
	const dx1 = W - p - 0.05 * k;
	const door = rect(dx0, y(0), dx1, y(wy1), mix(joinery, '#000', 0.05)) + glassRect(dx0 + 0.12 * k, dx1 - 0.12 * k, 0.75, wy1 - 0.12) + rect(dx0 + 0.12 * k, y(0.08), dx1 - 0.12 * k, y(0.6), mix(joinery, '#fff', 0.04)) + rect(dx0 + 0.16 * k, y(0.95), dx0 + 0.2 * k, y(1.55), '#c9c6bf') + (decal ? fitArt(sc, decal, { x: (dx0 + dx1) / 2 - 0.16 * k, y: y(1.95), width: 0.32 * k, height: 0.32 * k }, 'contain') : '');
	return el('g', {}, frame, pilasters, glassRect(wx0, wx1, wy0, wy1), mullions, windowFrame, riser, door, board, lettering, cornice, el('rect', { width: W, height: H, fill: `url(#${ids.paint})` }));
}

/**
 * A pane of shop glass: the interior (dark, with warm pools of light), and what it reflects (the sky at the top, the buildings across the street as a dark band, a soft diagonal streak).
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The pane.
 * @param {number} o.x0 Its left edge.
 * @param {number} o.x1 Its right edge.
 * @param {number} o.y0 Its top edge.
 * @param {number} o.y1 Its bottom edge.
 * @param {number} o.k Drawing units per metre.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {{ glass: string, sky: string, warm: string }} o.ids The shared gradients.
 * @param {boolean} [o.lit=true] Whether the interior is lit (a shop is; an upstairs room mostly isn't).
 * @returns {string} The markup.
 */
export function pane(sc, { x0, x1, y0, y1, k, light, ids, lit = true }) {
	const [w, h] = [x1 - x0, y1 - y0];
	const clip = sc.id('pane');
	sc.def(el('clipPath', { id: clip }, el('rect', { x: x0, y: y0, width: w, height: h })));
	const pools = lit ? [0.22, 0.52, 0.8].map((fx, i) => el('ellipse', { cx: x0 + w * fx, cy: y0 + h * (0.42 + 0.1 * (i % 2)), rx: Math.min(w * 0.24, 1.1 * k), ry: h * 0.4, fill: `url(#${ids.warm})` })).join('') : '';
	// the far side of the street, reflected: a dark band with a ragged roofline
	const band = y0 + h * 0.34;
	let roofs = `M${x0} ${y1}V${band}`;
	for (let x = x0, i = 0; x < x1; x += 1.4 * k, i++) roofs += `H${x + 1.4 * k}V${band - (((i * 37) % 5) - 2) * 0.08 * k}`;
	roofs += `H${x1}V${y1}Z`;
	const streak = light >= 0 ? `M${x0 + w * 0.55} ${y0}L${x0 + w * 0.72} ${y0}L${x0 + w * 0.3} ${y1}L${x0 + w * 0.13} ${y1}Z` : `M${x0 + w * 0.28} ${y0}L${x0 + w * 0.45} ${y0}L${x0 + w * 0.87} ${y1}L${x0 + w * 0.7} ${y1}Z`;
	return el(
		'g',
		{ 'clip-path': `url(#${clip})` },
		el('rect', { x: x0, y: y0, width: w, height: h, fill: `url(#${ids.glass})` }),
		pools,
		el('path', { d: roofs, fill: '#0c0d10', opacity: 0.32 }),
		el('rect', { x: x0, y: y0, width: w, height: h, fill: `url(#${ids.sky})` }),
		el('path', { d: streak, fill: '#ffffff', opacity: 0.07 }),
	);
}

/**
 * The floor above the shop: sash windows with stone lintels and sills, drawn flat like the shopfront.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {object} o The floor.
 * @param {number} o.scale Drawing units per metre.
 * @param {number} o.width Its width, in metres.
 * @param {number} o.height Its height, in metres.
 * @param {number} o.light Where the light is, left (-1) to right (1).
 * @param {number} [o.count=3] How many windows.
 * @returns {string} The markup, in `[0, width] × [0, height]` (scaled).
 */
export function upperFloor(sc, { scale: k, width, height, light, count = 3 }) {
	const ids = { glass: sc.id('glass'), sky: sc.id('reflect'), warm: sc.id('warm') };
	sc.def(el('linearGradient', { id: ids.glass, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': '#3a4048' }), el('stop', { offset: 1, 'stop-color': '#1a1c20' })));
	sc.def(el('linearGradient', { id: ids.sky, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': '#dde8f2', 'stop-opacity': 0.5 }), el('stop', { offset: 0.5, 'stop-color': '#dde8f2', 'stop-opacity': 0.12 }), el('stop', { offset: 1, 'stop-color': '#dde8f2', 'stop-opacity': 0.05 })));
	sc.def(el('radialGradient', { id: ids.warm }, el('stop', { offset: 0, 'stop-color': '#ffd9a0', 'stop-opacity': 0.2 }), el('stop', { offset: 1, 'stop-color': '#ffd9a0', 'stop-opacity': 0 })));
	const [ww, wh] = [1.0 * k, 1.65 * k];
	const top = (height - 1.65) * 0.45 * k;
	let out = '';
	for (let i = 0; i < count; i++) {
		const cx = ((i + 0.5) / count) * width * k;
		const [x0, x1] = [cx - ww / 2, cx + ww / 2];
		out +=
			el('rect', { x: x0 - 0.08 * k, y: top - 0.22 * k, width: ww + 0.16 * k, height: 0.22 * k, fill: '#cfc8bb' }) +
			el('rect', { x: x0 - 0.08 * k, y: top, width: ww + 0.16 * k, height: 0.05 * k, fill: '#000', opacity: 0.22 }) +
			el('rect', { x: x0, y: top, width: ww, height: wh, fill: '#f1eee8' }) +
			pane(sc, { x0: x0 + 0.07 * k, x1: x1 - 0.07 * k, y0: top + 0.07 * k, y1: top + wh / 2 - 0.03 * k, k, light, ids, lit: false }) +
			pane(sc, { x0: x0 + 0.07 * k, x1: x1 - 0.07 * k, y0: top + wh / 2 + 0.03 * k, y1: top + wh - 0.07 * k, k, light, ids, lit: false }) +
			el('rect', { x: cx - 0.015 * k, y: top + 0.07 * k, width: 0.03 * k, height: wh - 0.14 * k, fill: '#f1eee8' }) +
			el('rect', { x: x0 - 0.1 * k, y: top + wh, width: ww + 0.2 * k, height: 0.12 * k, fill: '#d6d0c4' }) +
			el('rect', { x: x0 - 0.1 * k, y: top + wh + 0.12 * k, width: ww + 0.2 * k, height: 0.07 * k, fill: '#000', opacity: 0.25 });
	}
	return el('g', {}, out);
}
