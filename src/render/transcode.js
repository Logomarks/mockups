/**
 * @module @arraypress/mockups/render/transcode
 *
 * WebP and AVIF images inside a mockup, re-encoded before librsvg draws the
 * mockup. librsvg (2.63, the renderer inside sharp) draws PNG, JPEG and GIF
 * only: a WebP or AVIF `<image>` comes out blank. Each one is decoded once
 * and swapped for a JPEG when it's opaque, or a PNG when it isn't, at its
 * own size. Browsers draw both, so only the Node renderer does this.
 */

/** A WebP or AVIF `data:` URI in an attribute. */
const HREF = /href="(data:image\/(?:webp|avif);base64,[^"]*)"/g;

/**
 * A mockup's SVG with its WebP and AVIF images re-encoded as JPEG or PNG.
 *
 * @param {string} svg The mockup.
 * @param {typeof import('sharp').default} sharp sharp.
 * @returns {Promise<string>} The SVG, each WebP or AVIF `href` now a JPEG or PNG.
 */
export async function transcodeImages(svg, sharp) {
	const hrefs = new Set([...svg.matchAll(HREF)].map((m) => m[1]));
	if (!hrefs.size) return svg;
	const done = new Map(await Promise.all([...hrefs].map(async (href) => /** @type {[string, string]} */ ([href, await drawable(href, sharp)]))));
	return svg.replace(HREF, (whole, href) => `href="${done.get(href) ?? href}"`);
}

/**
 * One WebP or AVIF `data:` URI as a JPEG (opaque) or PNG (see-through) one.
 *
 * @param {string} href The image.
 * @param {typeof import('sharp').default} sharp sharp.
 * @returns {Promise<string>} The re-encoded `data:` URI, or the same one when sharp can't read it.
 */
async function drawable(href, sharp) {
	try {
		const bytes = Buffer.from(href.slice(href.indexOf(',') + 1), 'base64');
		const { isOpaque } = await sharp(bytes).stats();
		const out = isOpaque ? await sharp(bytes).jpeg({ quality: 95, mozjpeg: true }).toBuffer() : await sharp(bytes).png().toBuffer();
		return `data:image/${isOpaque ? 'jpeg' : 'png'};base64,${out.toString('base64')}`;
	} catch {
		// an image sharp can't decode stays as it was
		return href;
	}
}
