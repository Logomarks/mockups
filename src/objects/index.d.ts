import type { Mockup } from '../types.js';
import type { VinylOptions } from './vinyl.js';
import type { CdOptions } from './cd.js';
import type { CassetteOptions } from './cassette.js';
import type { PosterOptions } from './poster.js';
import type { CardOptions } from './card.js';
import type { LetterheadOptions } from './letterhead.js';
import type { TicketOptions } from './ticket.js';
import type { LanyardOptions } from './lanyard.js';
import type { WristbandOptions } from './wristband.js';
import type { StickerOptions } from './sticker.js';
import type { ToteOptions } from './tote.js';
import type { TeeOptions } from './tee.js';
import type { HoodieOptions } from './hoodie.js';
import type { CapOptions } from './cap.js';
import type { MugOptions } from './mug.js';
import type { BagOptions } from './bag.js';
import type { BoxOptions } from './box.js';
import type { PhoneOptions } from './phone.js';
import type { LaptopOptions } from './laptop.js';
import type { BillboardOptions } from './billboard.js';
import type { ShopfrontOptions } from './shopfront.js';
import type { ShelterOptions } from './shelter.js';

/** Each object's options, by name. */
export interface ObjectOptions {
	vinyl: VinylOptions;
	cd: CdOptions;
	cassette: CassetteOptions;
	poster: PosterOptions;
	card: CardOptions;
	letterhead: LetterheadOptions;
	ticket: TicketOptions;
	lanyard: LanyardOptions;
	wristband: WristbandOptions;
	sticker: StickerOptions;
	tote: ToteOptions;
	tee: TeeOptions;
	hoodie: HoodieOptions;
	cap: CapOptions;
	mug: MugOptions;
	bag: BagOptions;
	box: BoxOptions;
	phone: PhoneOptions;
	laptop: LaptopOptions;
	billboard: BillboardOptions;
	shopfront: ShopfrontOptions;
	shelter: ShelterOptions;
}
/** The objects' names. */
export type ObjectName = keyof ObjectOptions;

/** The objects, by name. */
export const OBJECTS: Readonly<{ [K in ObjectName]: (options: ObjectOptions[K]) => Mockup }>;
/** A mockup by the object's name. Throws a TypeError for an unknown name. */
export function mockup<K extends ObjectName>(name: K, options: ObjectOptions[K]): Mockup;
