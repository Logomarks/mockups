/** CRC-32 of some bytes, as PNG chunks need. */
export function crc32(bytes: Uint8Array): number;
/** An 8-bit grey-and-alpha image (`width * height * 2` bytes, row by row) as uncompressed PNG bytes. */
export function encodePng(width: number, height: number, pixels: Uint8Array): Uint8Array;
