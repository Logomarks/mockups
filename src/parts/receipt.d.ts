import type { Brand } from '../util/brand.js';

/** An item on the bill: how many, its name, its unit price. */
export interface ReceiptItem {
	qty?: number;
	name: string;
	price: number;
}

/** The receipt's width and margin (mm), and the thermal black. */
export const RECEIPT: Readonly<{ width: number; margin: number; ink: string }>;
/** The placeholder items. */
export const RECEIPT_ITEMS: readonly Readonly<ReceiptItem>[];
/** A caller's items checked (the placeholders when `undefined`). Throws a TypeError for anything but `[{ name, price, qty? }]`. */
export function resolveItems(v: unknown): ReceiptItem[];
/** The subtotal, the service charge (12.5% by default) and the total, to the penny. */
export function receiptTotals(items: ReceiptItem[], service?: number): { subtotal: number; service: number; total: number };
/** The receipt's length (mm) for its items. */
export function receiptLength(count: number, named: boolean): number;
/** A barcode's bars (start and width, in modules), seeded. */
export function barcodeBars(seed: string, count?: number): { x: number; w: number }[];
/** A receipt composed from the brand, as a thermal printer prints it, 80 mm wide. `px` (10) per mm; `currency` (`'£'`). */
export function receiptSvg(brand: Brand, o?: { items?: ReceiptItem[]; px?: number; seed?: string; currency?: string }): string;
