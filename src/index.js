/**
 * @module @arraypress/mockups
 *
 * Product mockups from finished artwork: the design shown on the object
 * it's printed on. Each object returns a layered SVG with the artwork
 * embedded, dependency-free; rasterise it with `./node` (sharp) or
 * `./browser` (a canvas). The three.js scenes are in `./3d`.
 */

export { vinyl, RECORD, VINYL_SIZES } from './objects/vinyl.js';
export { OBJECTS, mockup } from './objects/index.js';
export { GROUNDS } from './materials/ground.js';
export { FINISHES } from './materials/vinyl.js';
export { artHref } from './render/art.js';
export { cd, PACKAGINGS } from './objects/cd.js';
export { cassette } from './objects/cassette.js';
export { SHELLS } from './parts/cassette/shell.js';
export { poster, PAPERS, MOUNTS } from './objects/poster.js';
export { WALLS } from './materials/wall.js';

// print & brand
export { card, CARD, CARD_LAYOUTS } from './objects/card.js';
export { letterhead, A4, LETTERHEAD_LAYOUTS } from './objects/letterhead.js';
export { ticket, TICKET, TICKET_LAYOUTS } from './objects/ticket.js';
export { lanyard, PASS } from './objects/lanyard.js';
export { wristband, WRISTBAND, WRISTBAND_KINDS } from './objects/wristband.js';
export { sticker, STICKER_LAYOUTS, LIDS, SHEET_PAPERS } from './objects/sticker.js';
export { tote, TOTE } from './objects/tote.js';
export { tee, TEE, TEE_PLACEMENTS } from './objects/tee.js';
export { hoodie, HOODIE, HOODIE_PLACEMENTS } from './objects/hoodie.js';
export { cap, CAP, CAP_VIEWS } from './objects/cap.js';
export { mug, MUG_LAYOUTS } from './objects/mug.js';
export { bag, BAG, BAG_PAPERS } from './objects/bag.js';
export { box, BOXES, BOARDS } from './objects/box.js';
export { SURFACES } from './materials/desk.js';
export { STOCKS } from './materials/paper.js';
export { GARMENT_COLORS } from './materials/fabric.js';

// screens & signs
export { phone, PHONE, PHONE_VIEWS } from './objects/phone.js';
export { laptop, LAPTOP, LAPTOP_VIEWS } from './objects/laptop.js';
export { billboard, BILLBOARD, BILLBOARD_VIEWS } from './objects/billboard.js';
export { shopfront, BLADE, SHOPFRONT_VIEWS } from './objects/shopfront.js';
export { shelter, SHELTER, SHELTER_VIEWS } from './objects/shelter.js';
export { BODIES } from './materials/body.js';
export { SKIES } from './materials/sky.js';

// photo plates
export { plate, PLATE_KINDS, KIND_LOOKS, checkPlate, quadMap } from './plates/index.js';
