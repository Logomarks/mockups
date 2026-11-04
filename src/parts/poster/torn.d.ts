/** A torn sheet's outlines about its centre (px): the paper's edge, and the print's inside it where it's torn; `wear` 0 is clean, 2 is a lot. */
export function tornSheet(w: number, h: number, mm: number, seed: string, wear?: number): { paper: string; print: string };
