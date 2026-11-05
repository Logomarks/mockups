/**
 * @module @arraypress/mockups/render/flatten
 *
 * SVG art inside a mockup, rasterised before librsvg draws the mockup. An
 * SVG `<image>` drawn under a rotation comes out stretched in librsvg (2.63:
 * it lays the nested SVG out in the turned box's bounds, so a turned ticket
 * loses its top and bottom), while a raster image turns correctly. Each SVG
 * image is drawn once at the size it's defined at (capped), as JPEG when
 * it's opaque and PNG when it isn't, and swapped in. Browsers draw nested
 * SVG correctly, so only the Node renderer does this.
 */

/** The longest side an SVG image is drawn at, in pixels. */
const CAP = 2048;

/** How `preserveAspectRatio` maps to sharp's fit. */
const FIT = Object.freeze({ slice: 'cover', meet: 'contain', none: 'fill' });

/**
 * A mockup's SVG with its SVG images rasterised.
 *
 * @param {string} svg The mockup.
 * @param {typeof import('sharp').default} sharp sharp.
 * @returns {Promise<string>} The SVG, each SVG `<image>`'s `href` now a JPEG or PNG at its drawn size.
 */
export async function flattenSvgImages(svg, sharp) {
	/** @type {Map<string, Promise<string>>} */
	const drawn = new Map();
	const tags = svg.match(/<image\b[^>]*href="data:image\/svg\+xml[^"]*"[^>]*>/g) ?? [];
	for (const tag of tags) {
		const href = attr(tag, 'href');
		const w = Number(attr(tag, 'width'));
		const h = Number(attr(tag, 'height'));
		if (!href || !(w > 0 && h > 0)) continue;
		const ratio = attr(tag, 'preserveAspectRatio') ?? 'xMidYMid meet';
		const key = `${w}x${h}:${ratio}:${href.length}:${href.slice(-64)}:${href}`;
		if (!drawn.has(key)) drawn.set(key, raster(href, w, h, ratio, sharp));
	}
	if (!drawn.size) return svg;
	const done = new Map(await Promise.all([...drawn].map(async ([k, p]) => /** @type {[string, string]} */ ([k, await p]))));
	return svg.replace(/<image\b[^>]*href="data:image\/svg\+xml[^"]*"[^>]*>/g, (tag) => {
		const href = attr(tag, 'href');
		const key = `${Number(attr(tag, 'width'))}x${Number(attr(tag, 'height'))}:${attr(tag, 'preserveAspectRatio') ?? 'xMidYMid meet'}:${href?.length}:${href?.slice(-64)}:${href}`;
		const out = done.get(key);
		return out ? tag.replace(`href="${href}"`, `href="${out}"`) : tag;
	});
}

/**
 * An SVG `data:` URI drawn to a raster one, fitting a box as `preserveAspectRatio` asks.
 *
 * @param {string} href The SVG.
 * @param {number} w The box's width.
 * @param {number} h The box's height.
 * @param {string} ratio Its `preserveAspectRatio`.
 * @param {typeof import('sharp').default} sharp sharp.
 * @returns {Promise<string>} A JPEG or PNG `data:` URI.
 */
async function raster(href, w, h, ratio, sharp) {
	const m = /^data:image\/svg\+xml(;base64)?,(.*)$/s.exec(href);
	if (!m) return href;
	const bytes = m[1] ? Buffer.from(m[2], 'base64') : Buffer.from(decodeURIComponent(m[2]));
	const k = Math.min(2, CAP / Math.max(w, h));
	const tw = Math.max(1, Math.round(w * k));
	const th = Math.max(1, Math.round(h * k));
	try {
		const meta = await sharp(bytes).metadata();
		// drawn at a density that gives at least the box's pixels, so it's never scaled up
		const scale = Math.max(tw / (meta.width || tw), th / (meta.height || th));
		const fit = FIT[/** @type {'slice' | 'meet' | 'none'} */ (ratio.includes('slice') ? 'slice' : ratio.trim() === 'none' ? 'none' : 'meet')];
		const position = ratio.includes('YMin') ? 'top' : ratio.includes('YMax') ? 'bottom' : 'centre';
		const img = sharp(bytes, { density: Math.min(72 * 40, Math.max(1, 72 * scale)), limitInputPixels: false }).resize(tw, th, { fit, position, background: { r: 0, g: 0, b: 0, alpha: 0 } });
		const { data, info } = await img.clone().raw().toBuffer({ resolveWithObject: true });
		const opaque = info.channels < 4 || data.every((v, i) => i % 4 !== 3 || v === 255);
		const out = opaque ? await img.jpeg({ quality: 92, mozjpeg: true }).toBuffer() : await img.png().toBuffer();
		return `data:image/${opaque ? 'jpeg' : 'png'};base64,${out.toString('base64')}`;
	} catch {
		// art librsvg can't read alone stays as it was
		return href;
	}
}

/**
 * An attribute's value in a tag.
 *
 * @param {string} tag The tag.
 * @param {string} name The attribute.
 * @returns {string | null} Its value, or `null`.
 */
function attr(tag, name) {
	const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
	return m ? m[1] : null;
}
