import type { Stock } from '../materials/paper.js';

/** The tooth of a sheet: a repeating tile of fine noise for a bump map (256 square). */
export function toothMap(THREE: typeof import('three'), seed?: string, size?: number): import('three').CanvasTexture;
/** A printed paper or board surface for a stock: rough and faintly sheened when matte, clearcoated when gloss. */
export function stockMaterial(THREE: typeof import('three'), stock: Stock, map: import('three').Texture | null, tooth?: import('three').Texture | null): import('three').MeshPhysicalMaterial;
/** A plain matte board in a colour (or with a print on it). */
export function boardMaterial(THREE: typeof import('three'), color: string, map?: import('three').Texture | null): import('three').MeshStandardMaterial;
/** The cut edge of corrugated board as a repeating tile: liners and the fluted wave (u along the edge, v across it). */
export function fluteMap(THREE: typeof import('three'), color: string, inner?: string): import('three').CanvasTexture;
/** Baked ambient darkening for a box face (UVs 0–1, v up its height): a grey map, darker towards the edges asked for, reaching `reach` (0.16) of the face in. */
export function shadeMap(THREE: typeof import('three'), o: { sides?: number; bottom?: number; top?: number; reach?: number }, size?: number): import('three').CanvasTexture;
