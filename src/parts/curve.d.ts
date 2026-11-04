/** A smooth curve through points as path data (closed by default). */
export function smooth(pts: [number, number][], closed?: boolean): string;
/** The outline round a spine with a width at each point, as points (the tip rounded unless `cap` is false). */
export function tubePoints(spine: [number, number][], widths: number[], cap?: boolean): [number, number][];
/** A tube round a spine, as smooth path data. */
export function tube(spine: [number, number][], widths: number[], cap?: boolean): string;
