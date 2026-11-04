import type { Art, Crop } from '../types.js';
import type { Scene } from '../render/scene.js';

/** Where a label's art comes from: a crop of the cover, all of it blurred, or a plain colour. */
export type LabelSource = 'crop' | 'blur' | 'plain';

/** One side's label. */
export interface LabelSpec {
	/** Its art: from the cover (`'crop'`, the default; `'blur'`), `'plain'`, or an image of its own. */
	art?: LabelSource | Art;
	/** Dark (light type) or light (dark type). Side A is dark by default, B light. */
	tone?: 'dark' | 'light';
	/** The plain colour, and the wash that tones a crop or blur. */
	color?: string;
	/** The type's colour. */
	ink?: string;
	/** The words above the spindle (`'SIDE A'`), or `false` for none. */
	text?: string | false;
	/** The ring of small type round the edge, or `false` for none. */
	ring?: string | false;
	/** Where a crop is taken from the cover. */
	crop?: Crop;
}

/** The labels: `'auto'` (crops of the cover, A dark and B light), one source for both, or each side's own. */
export type LabelsOption = 'auto' | LabelSource | { a?: LabelSpec | Art; b?: LabelSpec | Art };

/** A resolved label. */
export interface Label {
	source: LabelSource | 'art';
	href: string | null;
	tone: 'dark' | 'light';
	color: string;
	ink: string;
	text: string | false;
	ring: string | false;
	crop: Crop;
}

/** Side A's and side B's labels from the option. Throws a TypeError for anything else. */
export function resolveLabels(labels?: LabelsOption, title?: string): [Label, Label];
/** One side's label (`i`: 0 for A). */
export function resolveLabel(spec: LabelSpec | Art, i: number, title: string): Label;
/** A label's face centred on the origin; `shift` moves its type sideways. */
export function label(sc: Scene, lb: Label, rl: number, shift?: number): string;
/** A ring of small type round a circle, one glyph at a time. */
export function ring(words: string, radius: number, size: number, type: Record<string, string>): string;
