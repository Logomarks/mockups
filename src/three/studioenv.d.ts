/** A soft box on the studio panorama: centre (u round, v up), size, brightness (0–1). */
export interface Softbox {
	u: number;
	v: number;
	w: number;
	h: number;
	power: number;
}

/** Where the soft boxes go for a light from left (-1) to right (1): a key in front on its side, a strip on the other, an overhead. */
export function softboxes(light: number): Softbox[];
/** The studio as an equirectangular environment texture (1024 wide), for `scene.environment`. */
export function studioEnvironment(THREE: typeof import('three'), o: { light: number; size?: number }): import('three').CanvasTexture;
