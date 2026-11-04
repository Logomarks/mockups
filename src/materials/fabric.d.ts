import type { Scene } from '../render/scene.js';

/** A named garment colour. */
export type GarmentColorName = 'white' | 'natural' | 'heather' | 'sand' | 'sage' | 'navy' | 'black';
/** A garment colour: a name or a hex colour. */
export type GarmentColor = GarmentColorName | `#${string}`;
/** A fabric. */
export type FabricKind = 'jersey' | 'fleece' | 'canvas' | 'twill';

/** The named garment colours. */
export const GARMENT_COLORS: Readonly<Record<GarmentColorName, string>>;
/** The fabrics: how strongly each shows its texture and fuzz. */
export const FABRICS: Readonly<Record<FabricKind, Readonly<{ texture: number; fuzz: number }>>>;
/** A garment colour from its option (`fallback` when there's none); `object` names the caller in the TypeError. */
export function resolveGarment(c: string | undefined, fallback: string, object: string): { color: string; name: string | null; dark: boolean };
/** The fabric's texture over a region in pixels (threads at their true size, the yarn's mottle), to clip to the garment. */
export function weave(sc: Scene, o: { kind: FabricKind; mm: number; dark: boolean; seed: string; box: { x: number; y: number; w: number; h: number }; heather?: boolean }): string;
/** Filter steps that recolour a print (`before`, result `art`) and settle the warped print into the cloth (`after`, from `warped`). */
export function inkSteps(o: { dark: boolean; ink: string | null }): { before: string; after: string };
