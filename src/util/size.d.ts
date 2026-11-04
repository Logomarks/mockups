import type { Size } from '../types.js';

/** A size option as whole-pixel width and height (default a 1600 square). Throws a TypeError outside 16–8192. */
export function resolveSize(size?: Size, fallback?: number): { width: number; height: number };
