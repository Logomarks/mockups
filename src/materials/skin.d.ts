import type { Scene } from '../render/scene.js';
import type { Field } from '../util/field.js';

/** A named skin tone. */
export type SkinName = 'porcelain' | 'light' | 'medium' | 'tan' | 'brown' | 'deep';

/** A skin tone: a name or a hex colour. */
export type SkinOption = SkinName | `#${string}`;

/** A skin tone and the colours it's shaded with. */
export interface Skin {
	base: string;
	/** The warm form shadow. */
	shade: string;
	/** The sheen. */
	light: string;
	/** The reddish terminator where skin turns away. */
	rim: string;
	/** The nail. */
	nail: string;
	/** Creases and the deepest folds. */
	crease: string;
}

/** The named tones. */
export const SKINS: Readonly<Record<SkinName, string>>;
/** A tone (`'medium'`) and its shading colours; `object` names the caller in the TypeError for anything else. */
export function resolveSkin(v?: SkinOption, object?: string): Skin;
/** A height field (mm, cells `cell` mm) lit as skin from `lit` (the light's direction, y down): the form shadow with occlusion, the warm terminator and the sheen, as grey-and-alpha PNG `data:` URIs. */
export function skinMaps(f: Field, cell: number, lit: { x: number; y: number }): { shade: string; rim: string; sheen: string };
/** Skin over shapes (mm), lit from their height field (its top-left cell at `box.x, box.y`): colour, fine texture, shadow, terminator, `extra` and sheen, cut to the shapes. */
export function skinLayers(
	sc: Scene,
	o: { shapes: string[]; field: Field; box: { x: number; y: number; cell: number }; skin: Skin; lit: { x: number; y: number }; extra?: string },
): string;
/** Skin's very fine texture as a fill (`url(#…)`), in millimetres. */
export function texture(sc: Scene): string;
