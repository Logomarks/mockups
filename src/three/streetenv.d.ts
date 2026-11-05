/** The street's times of day. */
export type StreetTime = 'day' | 'golden' | 'dusk';

/** Where the poster hangs on the panorama: its centre (`u` round from −x, `v` up from the floor) and its height (a share of the panorama's). */
export const POSTER: Readonly<{ u: number; v: number; h: number }>;
/** Each time of day: the sky from its top to the horizon, the sun, the buildings' shade and lit side, and the pavement. */
export const STREET_TIMES: Readonly<Record<StreetTime, Readonly<{ top: string; horizon: string; sun: string; shade: string; lit: string; ground: string }>>>;

/** A street painted as an equirectangular panorama (twice as wide as tall), the artwork mirrored on a poster behind the camera so its reflection reads right. Browser only. */
export function streetCanvas(poster: (CanvasImageSource & { width: number; height: number }) | null, o?: { time?: StreetTime; seed?: string; size?: number }): HTMLCanvasElement;
