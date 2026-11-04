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
| `./node`: `renderImage(mockup, { format, quality, width })` | A `Buffer` from sharp: `'png'` (default), `'webp'`, `'jpeg'` or `'avif'`. |
| `./node`: `loadArt(pathOrUrlOrBytes, { size })` | A `data:` URI, scaled down to `size` (1600). |
| `./browser`: `renderBlob`, `renderCanvas`, `loadArt` | The same, through a canvas. |
| `./3d`: `vinylScene(canvas, options)` | `{ render, setView, toBlob, dispose }`. three.js is imported on first use. |
| `cd(options)`, `cassette(options)`, `poster(options)` | Music objects, below. |
| `./3d`: `cdScene(canvas, options)` | The CD in 3D: the `cd` options plus `layout`, `view` and the drawing size. |

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
| `shadow`, `sheen`, `grain` | `1`, `1`, `0.2` | Shadow depth, the paper's sheen, film grain. |
| `fit` | `0.89` | How much of the frame's width the group fills. |
| `title`, `seed` | `''`, `'vinyl'` | `title` sets the label's ring of type. `seed` sets the tracks, splatter and marble. |

`vinylScene` takes the same options, minus `size`, `sheen` and `grain`, plus a few of its own:

| Option | |
|---|---|
| `layout` | `'upright'` (default): standing on a paper sweep, the records behind the sleeve. `'flat'`: lying on the ground. |
| `view` | `{ tilt, turn, distance, fov }`. `tilt` 0 is the 2D view: level and front on standing, straight down lying. |
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
| `'auto'`, `'crop'` | Crops of the cover, side A toned dark, B light: its quietest windows when `loadArt` measured it, fixed ones otherwise. |
| `'blur'` | The whole cover, blurred. |
| `'plain'` | A plain colour. |
| `{ a, b }` | Each side is art of its own, or `{ art, tone, color, ink, text, ring, crop }`. Set `text: false` or `ring: false` to leave the words out. |

## Print and brand

Stationery, apparel and packaging from a brand kit, seen as a photo of the real thing. Everything is laid out in millimetres at its true size. Surfaces, paper tooth, fabric folds and skin are procedural, with no stock photos. Print files from `@arraypress/covers` carry bleed; pass `bleed` (mm) and the art is trimmed.

```js
import { card, tee, mug, renderImage, loadArt } from '@arraypress/mockups/node';

const front = await loadArt('business-card-front.png');
const back = await loadArt('business-card-back.png');
const png = await renderImage(card({ art: front, back, bleed: 3, layout: 'stack', edge: '#e8604c', surface: 'oak' }));
const shirt = tee({ art: await loadArt('mark.svg'), color: 'heather', placement: 'left-chest' });
```

| Object | Layouts and kinds | Its own options |
|---|---|---|
| `card` | `'flat'`, `'pair'` (with a `back`), `'stack'`, `'fan'`, `'hand'` | `back`, `edge` (painted edge colour), `thickness`, `radius`, `count`, `skin`, `hand` |
| `letterhead` | `'flat'`, `'envelope'` (DL), `'set'` (with a card) | `logo` (on the envelope), `card`, `back`, `envelope` (its colour) |
| `ticket` | `'pair'`, `'held'` | `torn`, `stub` (the perforation, a fraction of the width), `skin`, `hand` |
| `lanyard` | an A6 pass in a clear sleeve | `name` (printed along the strap), `strap`, `ink`, `angle` |
| `sticker` | `'laptop'`, `'bottle'`, `'sheet'` | `shape` (`'circle'`, `'rounded'`, `'contour'`), `extra` (more art for a sheet), `border`, `diameter`, `lid`, `color` |
| `tote` | a canvas tote, flat | `color`, `ink`, `scale` |
| `tee` | a flat lay | `placement` (`'center'`, `'chest'`, `'left-chest'`, `'back'`), `color`, `ink`, `scale` |
| `hoodie` | a flat lay | `placement` (`'chest'`, `'left-chest'`, `'back'`), `color`, `cord`, `ink`, `scale` |
| `cap` | six panels, `view` `'three-quarter'`, `'three-quarter-left'`, `'front'` | `finish` (`'embroidered'`, `'printed'`), `color`, `brim`, `ink`, `scale` |
| `mug` | `'single'`, `'pair'` | `print` (`'front'`, `'wrap'`), `back`, `color`, `inside`, `handle`, `gloss` |
| `bag` | a paper bag with rope handles | `paper` (`'kraft'`, `'white'`, `'black'`, hex), `rope`, `printSize`, `turn` |
| `box` | `kind` `'mailer'` or `'lid'` | `open`, `angle`, `lift`, `side`, `inside`, `board`, `lining`, `turn`, `elevation` |

They all take `art` (required), `surface`, `size`, `light`, `shadow`, `fit`, `grain` and `seed`; the paper objects also take `stock` and `bleed`.

| Option | |
|---|---|
| `surface` | `'concrete'`, `'oak'`, `'linen'`, `'paper'`, `{ texture, color }`, or a plain ground (`'light'`, `'dark'`, hex, `{ color, vignette }`). |
| `stock` | `'matte'`, `'uncoated'`, `'gloss'`, `'cotton'`, `'kraft'`: the paper's white, tooth and sheen. |
| `color` (garments) | `'white'`, `'natural'`, `'heather'`, `'sand'`, `'sage'`, `'navy'`, `'black'` or hex. |
| `skin` | `'porcelain'`, `'light'`, `'medium'`, `'tan'`, `'brown'`, `'deep'` or hex. |

`./3d` adds `cardScene` (`'flat'`, `'pair'`, `'stack'`, `'fan'`), `boxScene` (`kind`, `open` 0–1, `print: 'cover' | 'logo'`) and `mugScene` (`print: 'auto' | 'front' | 'both' | 'wrap'`, `layout`, `spin`). They take the 2D options, plus `view`, `width`, `height`, `pixelRatio` and `exposure`, and return the same handle as `vinylScene`.

## Music

`cd`, `cassette` and `poster`. Each is laid out in millimetres at true size.

### `cd` options

A jewel case (142 × 125 mm) or a digipak (139.7 × 124.5 mm) with the disc (120 mm) slid out from behind it.

| Option | Default | |
|---|---|---|
| `packaging` | `'jewel'` | `'jewel'` (booklet under a clear lid) or `'digipak'` (printed edge to edge). |
| `disc` | `'art'` | Printed with the cover, bare `'silver'`, or art of its own. |
| `side`, `peek` | `'right'`, `0.5` | Where the disc comes out, and how much of its diameter shows (0 hides it). |
| `tray` | `'black'` | The jewel case's tray: `'black'` or `'clear'`. |

### `cassette` options

The case (70 × 109 mm) with the J-card showing the cover, and the tape (100.4 × 63.8 mm) in front of it.

| Option | Default | |
|---|---|---|
| `shell` | `'black'` | `'black'`, `'white'`, `'clear'`, `'smoke'`, a hex colour or `{ color, opacity }`. |
| `label` | `'crop'` | A band of the cover (its quietest part), `'blur'`, `'plain'`, or art of its own. |
| `title`, `paper` | `''`, `'#f3f1ec'` | The title on the J-card and label; the label's paper. |
| `side` | `'right'` | Which side of the case the tape lies. |

### `poster` options

| Option | Default | |
|---|---|---|
| `mount` | `'tape'` | `'tape'` (corners), `'wheatpaste'` (torn, creased, the wall's texture through it), `'pole'` (flyers round a timber pole) or `'frame'`. |
| `paper`, `aspect` | by mount, `'art'` | `'A1'`–`'A5'` (A2 taped, A1 pasted, A4 on a pole, A3 framed); the art's proportions or the sheet's (`'paper'`, cropped). |
| `wall` | `'plaster'` | `'plaster'`, `'brick'` (behind a pole by default) or a hex colour. |
| `frame`, `mat` | `'black'`, `0.12` | `'black'`, `'white'` or `'wood'`; the mat as a share of the print's shorter side. |
| `count` | `3` | Flyers on a pole, 1–6. |

All three also take `ground` (`cd`, `cassette`), `size`, `light`, `shadow`, `fit`, `grain` (0.2) and `seed`.

## Screens and signs

The brand on a phone, a laptop, a billboard, a shopfront and a bus shelter. They're drawn in perspective through a camera, and lit. Art on an angled screen or sign is warped with a true projective map: a grid of triangles, each carried by its own affine map, as fine as the angle needs. Everything in them is generic, with no maker's or platform's shapes, icons or marks.

```js
import { readFile } from 'node:fs/promises';
import { phone, laptop, billboard, shopfront, shelter, renderImage, loadArt } from '@arraypress/mockups/node';

const post = await loadArt('cover.png', { size: 1200 });
const avatar = await loadArt('avatar.png', { size: 256 });   // small art small: see below
const png = await renderImage(phone({ art: post, screen: 'feed', name: 'Bloomfall', avatar, view: 'angle' }));
const page = laptop({ art: await loadArt('site.png'), domain: 'bloomfall.fair', icon: avatar });
const night = shelter({ art: post, time: 'night' });
const shop = shopfront({ art: await readFile('mark.svg', 'utf8'), name: 'Hollow Fern', color: '#22392f' });
```

| Object | Variants | Its own options |
|---|---|---|
| `phone` | `screen` `'art'`, `'home'` (the brand as an app among placeholders), `'feed'` (the brand's post); `view` `'front'` (from above), `'angle'` | `name`, `avatar`, `handle`, `wallpaper` (hex or art), `iconBackground`, `iconPadding`, `theme`, `fill`, `finish`, `glass` |
| `laptop` | `view` `'angle'` (three-quarters), `'front'` | `domain` (required), `title`, `icon` (the tab's), `fill` (`'top'`), `theme`, `finish`, `glass` |
| `billboard` | `setting` `'roadside'` (a mast against the sky) or `'wall'` (a framed poster on brick); `time` `'day'`, `'dusk'`, `'night'`; `view` `'front'`, `'angle'` | `ratio` (3 roadside, 2 wall), `fill` (`'cover'`, `'contain'`), `background` |
| `shopfront` | `view` `'front'`, `'angle'` | `name` (required: the fascia's lettering), `color` (fascia), `ink`, `joinery`, `brick`, `blade` |
| `shelter` | `time` `'day'`, `'night'` (the lightbox glows); `view` `'angle'`, `'front'` | `fill`, `background` |

They all take `art` (required), `size`, `light`, `fit`, `grain` and `seed`; `phone` and `laptop` also take `ground` and `shadow`. `view` can also be `{ tilt, turn }` in degrees. For the devices, `tilt` is measured from straight down. For the street objects, `tilt` raises the camera's aim. A shopfront's `art` is its mark, and an SVG drawn in `currentColor` takes `ink`.

| Option | |
|---|---|
| `fill` | `'cover'` (crop evenly), `'contain'` (all of it, on `background`), `'top'` (fill the width, read from the top). Art keeps its own proportions, read from its bytes. |
| `finish` | `'graphite'`, `'silver'`, `'white'`, `'black'` or hex (`BODIES`). |

**Art size matters.** librsvg decodes an embedded image each time a warp piece draws it, so a large PNG on an angled screen is slow. A 1 MB PNG costs about 40 ms a piece; a 200 KB JPEG costs about 8 ms. Load opaque art as JPEG at about the size it shows, and icons and avatars at 128–256 px. Browsers don't have this cost.

## Links

- [Changelog](CHANGELOG.md)
- [`@arraypress/covers`](https://github.com/arraypress/covers)
- [Issues](https://github.com/arraypress/mockups/issues)

MIT
