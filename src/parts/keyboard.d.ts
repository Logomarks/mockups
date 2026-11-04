/** Each row's key widths (key pitches, 14.5 across) and height (main-row pitches). */
export const ROWS: readonly { keys: number[]; h: number }[];
/** A laptop's deck (plain keys and a trackpad) drawn through the top face's map (mm from its back-left corner to pixels). */
export function deck(map: (x: number, y: number) => [number, number], o: { width: number; depth: number; key: string; pad: string; edge: string }): string;
