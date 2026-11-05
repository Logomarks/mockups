import type { Brand } from '../util/brand.js';
import type { Scene } from '../render/scene.js';

/** A dish: its name, a short note, and its price (a number prints bare or to two places; a string as it is). */
export interface MenuItem {
	name: string;
	note?: string;
	price?: number | string;
}

/** A course: its title and its dishes. */
export interface MenuSection {
	title: string;
	items: MenuItem[];
}

/** The placeholder courses: to start, mains, to finish, to drink. */
export const MENU_SECTIONS: readonly Readonly<MenuSection>[];
/** A single card's size and a tri-fold's panel, mm. */
export const MENU_SIZES: Readonly<{ card: readonly [number, number]; panel: readonly [number, number] }>;
/** A caller's courses checked (the placeholders when `undefined`). Throws a TypeError for anything but `[{ title, items: [{ name, note?, price? }] }]`. */
export function resolveSections(v: unknown): MenuSection[];
/** Courses shared between columns, whole courses each, as evenly by length as they go. */
export function splitSections(sections: MenuSection[], columns: number): MenuSection[][];
/** A price as printed: whole numbers bare, others to two places. */
export function priceText(p: number | string | undefined): string;
/** Courses set in a column (pixels): the markup and where it ends. */
export function courses(sc: Scene, sections: MenuSection[], o: { x: number; y: number; width: number; size: number; ink: string }): { markup: string; bottom: number };
/** A single card menu (230 × 330 mm): the lockup at the head, the courses in two columns, a line at the foot. `px` (5) per mm. */
export function menuCardSvg(brand: Brand, o?: { sections?: MenuSection[]; px?: number; footer?: string }): string;
/** A tri-fold's inside spread (three 99 × 210 mm panels): the lockup on the brand's colour, then the courses. `px` (6) per mm. */
export function menuSpreadSvg(brand: Brand, o?: { sections?: MenuSection[]; px?: number }): string;
