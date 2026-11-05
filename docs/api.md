# Usage and API

## Usage

```js
import { vinyl, renderImage, loadArt } from '@logomarks/mockups/node';

const art = await loadArt('cover.png');                  // inlined, scaled to 1600 px
const { svg } = vinyl({ art, vinyl: 'clear' });           // a double LP on light grey
const png = await renderImage(vinyl({ art, format: 'single', vinyl: 'black', ground: 'dark' }), { format: 'webp' });
```

```js
import { vinylScene } from '@logomarks/mockups/3d';

const scene = await vinylScene(canvas, { art, vinyl: { splatter: ['#111', '#ff4f9a'] }, view: { turn: -22, tilt: 8 } });
scene.setView({ tilt: 20 });  // or layout: 'flat' for the flat lay
const blob = await scene.toBlob();
```

## API

| Export | |
|---|---|
| `vinyl(options)` | `{ svg, width, height, object }`, synchronous. |
| `mockup(name, options)`, `OBJECTS` | An object by name. |
| `GROUNDS`, `FINISHES`, `RECORD` | The named grounds and finishes; a record's diameter in sleeve widths. |
| `artHref(art)` | Art as an `<image>` href. |
| `./node`: `renderImage(mockup, { format, quality, width })` | A `Buffer` from sharp: `'png'` (default), `'webp'`, `'jpeg'` or `'avif'`. SVG art inside is drawn as a raster first (librsvg stretches turned SVG images), and WebP and AVIF images are re-encoded (librsvg draws neither). |
| `./node`: `loadArt(pathOrUrlOrBytes, { size })` | A `data:` URI, scaled down to `size` (1600). |
| `./browser`: `renderBlob`, `renderCanvas`, `loadArt` | The same, through a canvas. |
| `./3d`: `vinylScene(canvas, options)` | `{ render, setView, toBlob, dispose }`. three.js is imported on first use. |
| `cd(options)`, `cassette(options)`, `poster(options)` | Music objects, below. |
| `./3d`: `cdScene(canvas, options)` | The CD in 3D: the `cd` options plus `layout`, `view` and the drawing size. |
| `./3d`: `tvScene(canvas, options)` | A TV with a live screen (a canvas, video or picture). See [TV](tv.md). |
| `./3d`: `cardScene`, `boxScene`, `mugScene` | Print in 3D. See [Print and brand](print-and-brand.md). |
| `./3d`: `sunglassesScene`, `phoneScene`, `laptopScene`, `keynoteScene`, `lightboxScene`, `neonScene`, `windowScene`, `billboardScene` | Screens, signs and reflections, each in its own set. See [Screens and signs](screens-and-signs.md#in-3d). |
| `./3d`: `binderScene`, `bookScene`, `stationeryScene` | Print composed from the brand, in the studio. See [Print and brand](print-and-brand.md#in-the-studio). |
| `./3d`: `menuScene`, `receiptScene`, `cupScene`, `takeawayScene`, `pizzaScene`, `chopsticksScene`, `napkinScene` | The restaurant. See [Restaurant](restaurant.md). |

## The lens

The scenes that build their own set (the sunglasses, the screens and signs, the studio and restaurant scenes) are shot through a lens. Each still frame is drawn many times, the camera moved over the lens's aperture and its frustum sheared so the plane of focus stays put, and the frames averaged in linear light before tone mapping. So the point in focus (the near lens, the app icon, the screen) is sharp, everything nearer or further blurs as a real lens would blur it, and edges are smoothed. A frame drawn while the camera drifts is drawn plainly.

| Option | |
|---|---|
| `blur` | How far out of focus the foreground and background go, 0–1 (each scene has its own default; 0 is all sharp). |
| `samples` | How many frames are averaged, 1–256 (`LENS_SAMPLES`, 24, unless the scene asks for more). More is smoother and slower; 8 is a quick preview. |

The brand scenes read `name`, `color`, `ink` (near-black or warm white, whichever reads on `color`, by default) and `paper` the same way, and set the mark and name with one lockup.

