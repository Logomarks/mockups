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
mockup('mug', { art: png });
// @ts-expect-error: art is required
vinyl({ format: 'single' });
