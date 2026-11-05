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
