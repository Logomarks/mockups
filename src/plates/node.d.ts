import type { Plate } from './format.js';

/** A plate, its photo and maps read and inlined, ready for `plate()`: a plate object (its `base` set), a directory or `plate.json` path, or a URL. */
export function loadPlate(source: Plate | string | URL): Promise<Plate>;
