/** How much of each of a CRT's effects, 0–1. */
export interface CrtLook {
	/** The tube's curve: the picture bowed out, its corners dark. */
	curve?: number;
	/** Scanlines and the shadow mask's RGB stripes. */
	scanlines?: number;
	/** The phosphor's glow round bright parts. */
	bloom?: number;
	/** A bright bar rolling slowly up the screen. */
	roll?: number;
	/** Noise, jitter now and then, and the 60 Hz flicker. */
	noise?: number;
}

/** The looks and their defaults (all 1). */
export const CRT_LOOK: Readonly<Required<CrtLook>>;
/** A CRT's look from `true`, `false` or `{ curve, scanlines, bloom, roll, noise }`. Throws a TypeError for anything else. */
export function resolveCrt(v: unknown): Required<CrtLook>;
/** The CRT's face material over a picture: set `uniforms.uTime` each frame, `uniforms.uGlass` to the screen's light. */
export function crtMaterial(THREE: typeof import('three'), picture: import('three').Texture, look: Required<CrtLook>, lines?: number): import('three').ShaderMaterial;
