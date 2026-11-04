import type { Plate } from './format.js';

/** A plate, its photo and maps read and inlined, ready for `plate()`: a plate object (its `base` set), or the URL of its directory or `plate.json` (relative to the page). */
export function loadPlate(source: Plate | string | URL): Promise<Plate>;
