/**
 * @module @arraypress/mockups/render/image
 *
 * SVG markup as a decoded browser image, the step both the canvas
 * rasteriser and the 3D textures take. Browser only.
 */

/**
 * SVG markup decoded as an image.
 *
 * @param {string} svg The SVG; its images must be inline (`data:` URIs).
 * @returns {Promise<HTMLImageElement>} The decoded image.
 */
export async function svgImage(svg) {
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
	try {
		const img = new Image();
		img.src = url;
		await img.decode();
		return img;
	} finally {
		URL.revokeObjectURL(url);
	}
}

/**
 * A new canvas and its 2D context.
 *
 * @param {number} w Its width.
 * @param {number} h Its height.
 * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]} The canvas and context.
 */
export function canvas2d(w, h) {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	return [c, /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'))];
}
