/** An attribute's value: numbers are written with at most three decimals; `null`, `undefined` and `false` leave it out. */
export type AttrValue = string | number | false | null | undefined;

/** Text made safe for XML content and attribute values. */
export function esc(s: unknown): string;
/** One SVG element as markup; it closes itself when it has no children. */
export function el(tag: string, attrs?: Record<string, AttrValue>, ...children: (string | false | null | undefined)[]): string;
/** A circle's outline as path data (two arcs), to combine with others under even-odd. */
export function circlePath(cx: number, cy: number, r: number): string;
