import type { Plate } from './format.js';

/** Reads bytes from a URL. */
export type ReadBytes = (url: URL) => Promise<Uint8Array>;

/** Where a plate given by location keeps its description: the URL itself when it names a `.json`, else `plate.json` inside it. */
export function describedAt(url: URL): URL;
/** A plate with every file read through `read` and inlined as a `data:` URI. */
export function loadWith(source: Plate | URL, read: ReadBytes): Promise<Plate>;
