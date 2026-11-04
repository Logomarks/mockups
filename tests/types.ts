// Type-level usage check (`npm run typecheck`); never executed.
import { vinyl, mockup, OBJECTS, GROUNDS, FINISHES, RECORD, artHref, type Mockup, type VinylOptions, type VinylSpec, type LabelsOption } from '../src/index.js';
import { renderImage, loadArt } from '../src/render/node.js';
import { renderBlob, renderCanvas, loadArt as loadInBrowser } from '../src/render/browser.js';
import { vinylScene, type VinylScene, type View } from '../src/three/index.js';

declare const png: Uint8Array<ArrayBuffer>;
declare const canvas: HTMLCanvasElement;

const specs: VinylSpec[] = ['clear', 'black', 'white', 'smoke', '#ff0000', { color: '#e0245e' }, { color: '#e0245e', opacity: 0.4 }, { splatter: ['#000', '#fff'] }, { splatter: ['#000'], base: 'white' }, { marble: ['#000', '#fff'], opacity: 0.9 }];
const labels: LabelsOption[] = ['auto', 'crop', 'blur', 'plain', { a: png }, { a: { art: 'blur', tone: 'light', text: false, ring: 'RING', crop: { x: 0.5, y: 0.5, size: 0.3 } }, b: '<svg/>' }];
const options: VinylOptions = { art: png, format: 'double', side: 'right', vinyl: ['clear', { color: '#3a86ff', opacity: 0.5 }], labels: labels[5], ground: 'dark', size: { width: 1600, height: 1200 }, peek: 0.5, light: -0.3, shadow: 1.2, fit: 0.8, sheen: 0.5, grain: 0, title: 'Glow', seed: 'x' };
const m: Mockup = vinyl(options);
const same: Mockup = mockup('vinyl', { art: '<svg/>', ground: { color: '#eeeeee', vignette: 0.1 } });
const svg: string = m.svg + same.svg + artHref(png);
console.log(specs, OBJECTS.vinyl, GROUNDS.light.color, FINISHES.clear.opacity, RECORD, svg);

void (async () => {
	const art = await loadArt('cover.png', { size: 1200 });
	const buf: Buffer = await renderImage(vinyl({ art }), { format: 'webp', quality: 85, width: 800 });
	const blob: Blob = await renderBlob(m, { type: 'image/jpeg', quality: 0.9 });
	const c: HTMLCanvasElement = await renderCanvas(m);
	const inline: string = await loadInBrowser(new Blob([png]), { size: 1000 });
	const view: View = { tilt: 35, turn: -20, distance: 0.9, fov: 30 };
	const s: VinylScene = await vinylScene(canvas, { art: inline, vinyl: 'black', view, pixelRatio: 2, exposure: 1, width: 800, height: 800 });
	s.setView({ tilt: 0 });
	s.render();
	const shot: Blob = await s.toBlob('image/webp', 0.9);
	s.dispose();
	console.log(buf, blob, c, shot);
})();

// @ts-expect-error: not a finish
vinyl({ art: png, vinyl: 'glitter' });
// @ts-expect-error: not a format
vinyl({ art: png, format: 'triple' });
// @ts-expect-error: not an object
mockup('kettle', { art: png });
// @ts-expect-error: art is required
vinyl({ format: 'single' });

// music: cd, cassette, poster, and the upright 3D layout
import { cd, cassette, poster, PACKAGINGS, PAPERS, MOUNTS, SHELLS, WALLS, type CdOptions, type CassetteOptions, type PosterOptions } from '../src/index.js';
import { cdScene, type CdSceneOptions } from '../src/three/index.js';

const disc: CdOptions = { art: png, packaging: 'digipak', disc: 'silver', side: 'left', peek: 0.4, tray: 'clear', ground: 'dark', size: 1200, light: -0.2, shadow: 1.2, fit: 0.8, grain: 0, seed: 's' };
const tape: CassetteOptions = { art: png, shell: { color: '#ff4f9a', opacity: 0.5 }, label: 'blur', paper: '#ffffff', title: 'Side', side: 'left' };
const wall: PosterOptions = { art: png, mount: 'frame', paper: 'A3', aspect: 'paper', wall: 'brick', frame: 'wood', mat: 0.1, count: 4 };
const music: Mockup[] = [cd(disc), cassette(tape), poster(wall), mockup('poster', { art: png, mount: 'pole' }), mockup('cd', { art: png, disc: png })];
console.log(music, PACKAGINGS[0], PAPERS.A1[0], MOUNTS[0], SHELLS.clear.opacity, WALLS.brick);
void (async () => {
	const up: CdSceneOptions = { art: '<svg/>', layout: 'flat', view: { tilt: 30 } };
	const s = await cdScene(canvas, up);
	const v = await vinylScene(canvas, { art: '<svg/>', layout: 'upright', view: { tilt: 8, turn: -20 } });
	s.dispose();
	v.dispose();
})();

// @ts-expect-error: not a packaging
cd({ art: png, packaging: 'slim' });
// @ts-expect-error: not a mount
poster({ art: png, mount: 'glue' });
// @ts-expect-error: not a layout
vinylScene(canvas, { art: png, layout: 'hung' });

// print & brand
import { card, letterhead, ticket, lanyard, sticker, tote, tee, hoodie, cap, mug, bag, box, SURFACES, STOCKS, SKINS, GARMENT_COLORS, CARD, A4, TICKET, PASS, type SurfaceOption, type CardOptions } from '../src/index.js';
import { cardScene, boxScene, mugScene } from '../src/three/index.js';

const surfaces: SurfaceOption[] = ['concrete', 'oak', 'linen', 'paper', 'dark', '#eeeeee', { texture: 'oak', color: '#8a6a4a' }, { color: '#222222', vignette: 0.2 }];
const cardOptions: CardOptions = { art: png, back: png, layout: 'stack', surface: surfaces[1], stock: 'cotton', edge: '#e8604c', thickness: 1, radius: 3, bleed: 3, count: 8, skin: 'deep', hand: 'left' };
const prints: Mockup[] = [
	card(cardOptions),
	letterhead({ art: png, layout: 'set', card: png, back: png, logo: '<svg/>', envelope: '#f4f1ea', stock: 'uncoated' }),
	ticket({ art: png, layout: 'held', torn: true, stub: 0.75, skin: '#c8906a' }),
	lanyard({ art: png, name: 'HOLLOW FERN', strap: '#2f6b4f', ink: '#ffffff', angle: -4 }),
	sticker({ art: png, layout: 'sheet', shape: 'contour', extra: [png], border: 2.5, lid: 'graphite' }),
	tote({ art: png, color: 'natural', scale: 0.8 }),
	tee({ art: png, placement: 'left-chest', color: 'heather', ink: '#2f6b4f' }),
	hoodie({ art: png, placement: 'back', color: '#1b2a4a', cord: '#ffffff' }),
	cap({ art: png, view: 'front', finish: 'printed', color: 'navy', brim: '#3b5bdb' }),
	mug({ art: png, layout: 'pair', print: 'wrap', back: png, handle: 'left', color: '#111111' }),
	bag({ art: png, paper: 'kraft', rope: '#ffffff', turn: 30 }),
	box({ art: png, kind: 'mailer', open: true, side: png, board: 'white' }),
	mockup('tee', { art: png, color: 'black' }),
];
console.log(prints, SURFACES.oak.color, STOCKS.matte.sheen, SKINS, GARMENT_COLORS, CARD.width, A4.height, TICKET, PASS);
void (async () => {
	const c = await cardScene(canvas, { art: png, back: png, layout: 'fan', edge: '#3b5bdb', view: { tilt: 40, turn: -20 } });
	const b = await boxScene(canvas, { art: png, kind: 'lid', open: 0.5, print: 'logo' });
	const mg = await mugScene(canvas, { art: png, print: 'both', spin: -70, layout: 'pair' });
	[c, b, mg].forEach((s) => s.dispose());
})();
// @ts-expect-error: not a layout
card({ art: png, layout: 'pile' });
// @ts-expect-error: not a surface
tee({ art: png, surface: 'marble' });
// @ts-expect-error: not a kind
box({ art: png, kind: 'crate' });

// screens & signs
import { phone, laptop, billboard, shopfront, shelter, PHONE, PHONE_VIEWS, LAPTOP, BILLBOARD, BLADE, SHELTER, BODIES, SKIES, type PhoneOptions, type LaptopOptions, type BillboardOptions, type ShopfrontOptions, type ShelterOptions } from '../src/index.js';

const phoneOptions: PhoneOptions = { art: png, screen: 'feed', name: 'Bloomfall', avatar: png, handle: '@bloomfall', theme: 'dark', finish: 'silver', view: { tilt: 20, turn: -10 }, ground: 'dark', glass: 0.5, fill: 'contain' };
const laptopOptions: LaptopOptions = { art: png, domain: 'bloomfall.fair', title: 'Bloomfall', icon: png, fill: 'top', finish: '#2a2b2e', view: 'front' };
const billboardOptions: BillboardOptions = { art: png, setting: 'wall', time: 'night', view: 'angle', ratio: 2, fill: 'contain', background: '#ebe3d2' };
const shopfrontOptions: ShopfrontOptions = { art: '<svg/>', name: 'Hollow Fern', color: '#22392f', ink: '#ffffff', joinery: '#2a2e33', brick: '#9b5b45', blade: false, view: { turn: -30 } };
const shelterOptions: ShelterOptions = { art: png, time: 'night', view: 'front', fill: 'cover' };
const signs: Mockup[] = [
	phone(phoneOptions),
	phone({ art: png, screen: 'home', name: 'Hollow Fern', wallpaper: '#2f6b50', iconBackground: '#ffffff', iconPadding: 0.2 }),
	laptop(laptopOptions),
	billboard(billboardOptions),
	shopfront(shopfrontOptions),
	shelter(shelterOptions),
	mockup('shelter', { art: png }),
];
console.log(signs, PHONE.depth, PHONE_VIEWS.angle.turn, LAPTOP.lean, BILLBOARD.roadside.ratio, BLADE.size, SHELTER.box.width, BODIES.silver.color, SKIES.night.stops);
// @ts-expect-error: not a screen
phone({ art: png, screen: 'lock' });
// @ts-expect-error: a laptop needs a domain
laptop({ art: png });
// @ts-expect-error: no dusk in a shelter
shelter({ art: png, time: 'dusk' });
// @ts-expect-error: a shopfront needs a name
shopfront({ art: png });
