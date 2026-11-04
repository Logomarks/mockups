/** How many kraft variants there are (4). */
export const KRAFT_COUNT: number;
/** How much board one texture tile covers, in mm (150). */
export const KRAFT_SPAN: number;
/** The variants' mean luminance, 0–1. */
export const KRAFT_MEAN: number;
/** Where a kraft texture is, beside the package's source. */
export function kraftUrl(n: number): URL;
/** Keeps the kraft textures (`data:` URIs) for drawing. */
export function setKraftTextures(list: string[]): void;
/** The kraft textures loaded (empty until they are). */
export function kraftTextures(): readonly string[];
