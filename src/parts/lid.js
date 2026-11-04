/**
 * @module @arraypress/mockups/parts/lid
 *
 * How open a box is, shared by the 2D and 3D boxes so `open` means the same
 * in both: a mailer's lid swings up about its back edge, 112° when fully
 * open; a lid box's lid lifts (and, in 3D, slides back and tips towards the
 * camera).
 */

import { clamp } from '../util/num.js';

/**
 * Where the lid is for an amount of opening.
 *
 * @param {'mailer' | 'lid'} kind The box.
 * @param {number} open How open, 0 (closed) to 1.
 * @returns {{ hinge: number, lift: number, tilt: number, slide: number }} A mailer's lid angle (degrees about its back edge); a lid box's lid raised (mm), tilted towards the camera (degrees) and slid back (mm).
 */
export function lidPose(kind, open) {
	const k = clamp(open, 0, 1);
	if (kind === 'mailer') return { hinge: 112 * k, lift: 0, tilt: 0, slide: 0 };
	return { hinge: 0, lift: 150 * k, tilt: 14 * k, slide: 30 * k };
}

/**
 * How open, from an option that may be a flag (2D's old `open: true`) or an amount.
 *
 * @param {unknown} v The option.
 * @param {string} object The object, for the error.
 * @returns {number} 0 (closed) to 1.
 * @throws {TypeError} For anything but a boolean or a number 0–1.
 */
export function openAmount(v, object) {
	if (v === undefined || v === null || v === false) return 0;
	if (v === true) return 1;
	if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1) return v;
	throw new TypeError(`${object}: open is true, false or a number 0–1 (got ${JSON.stringify(v)})`);
}
