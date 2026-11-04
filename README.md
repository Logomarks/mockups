# @arraypress/mockups

Product mockups from finished artwork: the design shown on the object it's printed on. The first object is vinyl: a sleeve with one or two records peeking out, clear, black, coloured, splatter or marble, with labels cut from the cover. The 2D version is a layered SVG with the art embedded and no dependencies. It rasterises with sharp in Node or a canvas in the browser. A three.js scene renders angled shots.

The library takes finished art (image bytes, SVG markup, a `data:` URI or a URL). [`@arraypress/covers`](https://github.com/arraypress/covers) makes that art.

## Install

```bash
npm install @arraypress/mockups
npm install sharp   # PNG/WebP/JPEG/AVIF in Node
npm install three   # the 3D scene
```

## Usage

```js
import { vinyl, renderImage, loadArt } from '@arraypress/mockups/node';

const art = await loadArt('cover.png');                  // inlined, scaled to 1600 px
const { svg } = vinyl({ art, vinyl: 'clear' });           // a double LP on light grey
const png = await renderImage(vinyl({ art, format: 'single', vinyl: 'black', ground: 'dark' }), { format: 'webp' });
```

```js
import { vinylScene } from '@arraypress/mockups/3d';

const scene = await vinylScene(canvas, { art, vinyl: { splatter: ['#111', '#ff4f9a'] }, view: { tilt: 38, turn: -22 } });
scene.setView({ tilt: 62 });
const blob = await scene.toBlob();
```

## API

| Export | |
|---|---|
| `vinyl(options)` | `{ svg, width, height, object }`, synchronous. |
| `mockup(name, options)`, `OBJECTS` | An object by name. |
| `GROUNDS`, `FINISHES`, `RECORD` | The named grounds and finishes; a record's diameter in sleeve widths. |
| `artHref(art)` | Art as an `<image>` href. |
| `./node`: `renderImage(mockup, { format, quality, width })` | A `Buffer` from sharp: `'png'` (default), `'webp'`, `'jpeg'` or `'avif'`. |
| `./node`: `loadArt(pathOrUrlOrBytes, { size })` | A `data:` URI, scaled down to `size` (1600). |
| `./browser`: `renderBlob`, `renderCanvas`, `loadArt` | The same, through a canvas. |
| `./3d`: `vinylScene(canvas, options)` | `{ render, setView, toBlob, dispose }`. three.js is imported on first use. |

### `vinyl` options

| Option | Default | |
|---|---|---|
| `art` | required | The cover. |
| `format` | `'double'` | `'single'` or `'double'`. |
| `side` | `'both'` / `'right'` | Where the records peek out. A double on `'left'` or `'right'` fans both out on that side. |
| `vinyl` | `'clear'` | See below. Pass a pair to give each record its own. |
| `labels` | `'auto'` | See below. |
| `ground` | `'light'` | `'light'` (`#e6e6e6`), `'dark'` (`#161618`), a hex colour, or `{ color, vignette }`. |
| `size` | `1600` | Pixels: one number for a square, or `{ width, height }`. |
| `peek` | `0.53` | How much of a record's diameter shows past the sleeve. |
| `light` | `0.35` | Where the light is, from -1 (left) to 1 (right). Shadows fall the other way. |
| `shadow`, `sheen`, `grain` | `1`, `1`, `0.5` | Shadow depth, the paper's sheen, film grain. |
| `fit` | `0.89` | How much of the frame's width the group fills. |
| `title`, `seed` | `''`, `'vinyl'` | `title` sets the label's ring of type. `seed` sets the tracks, splatter and marble. |

`vinylScene` takes the same options, minus `size`, `sheen` and `grain`, plus a few of its own:

| Option | |
|---|---|
| `view` | `{ tilt, turn, distance, fov }`. `tilt` 0 looks straight down, as in the 2D view. |
| `width`, `height`, `pixelRatio` | The drawing size. |
| `exposure` | Measured by default, so the ground comes out its own colour. |

### Vinyl

| `vinyl` | |
|---|---|
| `'clear'`, `'black'`, `'white'`, `'smoke'` | Named finishes. |
| `'#f2b705'` | A solid colour. |
| `{ color, opacity }` | Translucent colour (`opacity` 0.75 by default). The colour filters what's behind it. |
| `{ splatter: [colors], base }` | Splatter over a base (clear by default). |
| `{ marble: [colors], opacity }` | Bands of the colours swirled together. |

### Labels

| `labels` | |
|---|---|
| `'auto'`, `'crop'` | Crops of the cover: side A toned dark, B light. |
| `'blur'` | The whole cover, blurred. |
| `'plain'` | A plain colour. |
| `{ a, b }` | Each side is art of its own, or `{ art, tone, color, ink, text, ring, crop }`. Set `text: false` or `ring: false` to leave the words out. |

## Links

- [Changelog](CHANGELOG.md)
- [`@arraypress/covers`](https://github.com/arraypress/covers)
- [Issues](https://github.com/arraypress/mockups/issues)

MIT
