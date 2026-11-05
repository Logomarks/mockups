import type { Brand } from '../util/brand.js';

/** The placeholder contact details a composed set prints. */
export const CONTACT: Readonly<{ person: string; role: string; street: string; town: string; phone: string }>;
/** The brand's web address from its name (`'Covehaus'` → `'covehaus.com'`; `''` without a name). */
export function domainOf(name: string): string;
/** The ink a brand prints on paper: its colour when dark enough to read, otherwise near-black. */
export function paperInk(brand: Brand): string;
/** A letterhead (A4) composed from the brand: the lockup at the head, an address block, a rule and the web address at the foot. An SVG document, `px` (6) per mm. */
export function letterSvg(brand: Brand, o?: { px?: number }): string;
/** A business card's front (85 × 55 mm): the mark on the brand's colour. `px` (12) per mm. */
export function cardFrontSvg(brand: Brand, o?: { px?: number }): string;
/** A business card's back: the lockup small, a person and role, contact lines. `px` (12) per mm. */
export function cardBackSvg(brand: Brand, o?: { px?: number }): string;
/** A DL envelope's front (220 × 110 mm): the layers behind showing through, the lockup at its top left. `px` (6) per mm. */
export function envelopeSvg(brand: Brand, o?: { px?: number }): string;
