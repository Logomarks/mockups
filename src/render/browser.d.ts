import type { Mockup } from '../types.js';

export * from '../index.js';
export { loadPlate } from '../plates/browser.js';

/** Fetches the photographed board textures; until then kraft board is procedural. False when they can't be fetched. */
export function loadTextures(): Promise<boolean>;
/** A mockup drawn into a canvas (a new one, or the one given) at its own size. */
export function renderCanvas<C extends HTMLCanvasElement | OffscreenCanvas = HTMLCanvasElement>(m: Mockup, canvas?: C): Promise<C>;
/** A mockup as an image Blob (`'image/png'` by default). */
export function renderBlob(m: Mockup, o?: { type?: string; quality?: number }): Promise<Blob>;
/** Artwork from a URL, a File/Blob or bytes, as a `data:` URI scaled down to fit `size` (1600). */
export function loadArt(input: string | Blob | Uint8Array | ArrayBuffer, o?: { size?: number; quality?: number }): Promise<string>;
