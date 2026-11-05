/**
 * @module @logomarks/mockups/parts/print
 *
 * Print artwork trimmed to its object. Files made for print carry bleed
 * (the art runs a few millimetres past the cut on every side), so the art
 * is defined at its full size and placed with the bleed hanging outside the
 * box it's asked to fill; the object's own shape then cuts it, as the
 * guillotine does.
 */

/**
 * How to place a print file so its trim fills a box.
 *
 * @param {import('../render/scene.js').Scene} sc The document.
 * @param {import('../types.js').Art} art The print file.
 * @param {{ trim: [number, number], bleed?: number }} o The finished size in mm (width, height), and the bleed it carries on each side in mm (0).
 * @returns {import('../render/scene.js').PlaceArt} Draws the trim area into a box (the bleed falls outside it).
 */
export function trimmed(sc, art, { trim, bleed = 0 }) {
	const [tw, th] = trim;
	const b = Math.max(0, bleed);
	const place = sc.image(art, (tw + 2 * b) / (th + 2 * b));
	return (x, y, w, h, attrs) => {
		const bx = (b * w) / tw;
		const by = (b * h) / th;
		return place(x - bx, y - by, w + 2 * bx, h + 2 * by, attrs);
	};
}

/**
 * How art should fill a face: edge to edge when its proportions are close to the face's, otherwise whole and centred (a wide band, a lid's shallow edge), so it's never cropped to a sliver of itself.
 *
 * @param {number} art The art's width over its height.
 * @param {number} face The face's width over its height.
 * @returns {'cover' | 'contain'} The fit.
 */
export function faceFit(art, face) {
	const r = art / face;
	return r > 0.7 && r < 1 / 0.7 ? 'cover' : 'contain';
}
