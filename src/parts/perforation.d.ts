/** The torn edge of a perforation at `x` (from the ticket's centre), as points top to bottom. */
export function tornEdge(x: number, h: number, mm: number, seed: string): [number, number][];
/** The outlines of a ticket and its torn-off stub, both centred on the whole ticket; `at` is the perforation's place as a fraction of the width. */
export function tornPieces(w: number, h: number, radius: number, at: number, mm: number, seed: string): { main: string; stub: string };
/** The line of perforation holes on a whole ticket, centred on it. */
export function perforationLine(w: number, h: number, at: number, mm: number): string;
