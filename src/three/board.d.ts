import type { Stock } from '../materials/paper.js';
import type { FibreLook } from '../materials/board.js';

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
/** Baked ambient darkening as a canvas (grey, white where nothing gathers; v up). */
export function shadeCanvas(o: { sides?: number; bottom?: number; top?: number; reach?: number }, size?: number): HTMLCanvasElement;

/** What a scene's packaging board is made from. */
export interface BoardKit {
	/** The kraft photographs (none when they couldn't be fetched). */
	photos: ImageBitmap[];
	/** Grain tiles to lay over a colour or a print, one per photograph (or one procedural). */
	grains: HTMLCanvasElement[];
	/** How much board a tile covers, mm. */
	span: number;
	/** The grain's relief, repeating. */
	normal: import('three').CanvasTexture;
	/** Its roughness (about 0.9), repeating. */
	rough: import('three').CanvasTexture;
}

/** One face of board to bake. */
export interface BakeOptions {
	/** Its size, mm. */
	size: [number, number];
	/** The board's colour here. */
	color: string;
	/** Whether it's kraft (drawn with the photograph). */
	kraft: boolean;
	/** Its seed (variant, turn and offset). */
	seed: string;
	/** Its print, already laid out at the face's proportions (transparent where the board shows). */
	print?: HTMLCanvasElement | null;
	/** Occlusion where it meets its neighbours (as `shadeMap`). */
	ao?: { sides?: number; bottom?: number; top?: number; reach?: number } | null;
	/** Folds along its edges: how dark each one's bend is. */
	folds?: Partial<Record<'top' | 'bottom' | 'left' | 'right', number>>;
	/** Pixels per mm for an unprinted face (4). */
	px?: number;
}

/** The kraft photographs, fetched once beside the package (none when they can't be). */
export function kraftPhotos(): Promise<ImageBitmap[]>;
/** A scene's board kit: the photographs, their grain and relief (or the procedural fibre's). */
export function boardKit(THREE: typeof import('three'), look: FibreLook, seed: string, strength?: number): Promise<BoardKit>;
/** One face of board baked at its real size: board, print, grain over both, occlusion and folds. */
export function bakeBoard(kit: BoardKit, o: BakeOptions): HTMLCanvasElement;
/** A baked face as a matte physical material with the grain's relief and roughness, and a faint sheen. */
export function bakedMaterial(THREE: typeof import('three'), kit: BoardKit, baked: HTMLCanvasElement, size: [number, number], color: string): import('three').MeshPhysicalMaterial;
