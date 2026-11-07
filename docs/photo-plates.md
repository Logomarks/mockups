# Photo plates

A plate is a real photo with blank signs in it (a billboard, a fascia, a lightbox, a framed poster, a display) and, for each sign, its four corners, its kind and maps cut from the photo. `plate` warps the art into each sign and multiplies it by the blank sign's own light, so the scene's light, colour cast, seams and grime fall across the art. It matches the photo's grain and softness, feathers the edge, puts back whatever stands in front, screens glass reflections and glare back over the art, and bleeds a lightbox's light round it. The plates themselves are in [`@logomarks/mockups-plates`](https://github.com/Logomarks/mockups-plates).

```js
import { plate, loadPlate, loadArt, renderImage } from '@logomarks/mockups/node';
import { PLATES } from '@logomarks/mockups-plates';

const p = await loadPlate(PLATES['shelter-night']);       // or a directory, a plate.json path, or a URL
const jpeg = await renderImage(plate(p, { art: await loadArt('flyer.png') }), { format: 'jpeg' });
```

| Export | |
|---|---|
| `plate(plate, options)` | A `Mockup` at the photo's size. `art` (one, or one per screen), `fit` (`'cover'`, `'contain'`, `'top'`), `background`, `grain` (× the photo's, 1), `glow`, `seed`. |
| `./node`, `./browser`: `loadPlate(source)` | The plate with its photo and maps inlined. |
| `./node`: `makePlate(photo, { name, kind or screens, blank, format, source })`, `savePlate(dir, made)` | A plate from a photo: each sign's corners found (the brightest even quadrilateral, or `near` a point, or given), its proportions recovered from the perspective, its maps cut from the photo (or from `blank`, the same photo with the sign blank). A screen's `mask` (hand-painted, or matted, such as fingers over a held card) is left out of the measuring and added to what's found. `format: 'webp'` writes WebP (masks lossless), about half the size of the JPEG default. |
| `PLATE_KINDS`, `KIND_LOOKS`, `checkPlate`, `quadMap` | The kinds (`'print'`, `'paint'`, `'backlit'`, `'glass'`), their default looks, the format check, and the projective map. |

## Surfaces beyond a flat sign (0.6.0)

A screen can say more about its surface. Each is set when the plate is made (`makePlate`'s screens) and kept in `plate.json`.

| Field | |
|---|---|
| `shape: 'ellipse'` | The sign is the ellipse inside its corners: a round label, a pin, a patch. The art is cut to it, and the maps are measured inside it. |
| `cylinder: { top, bottom, span }` | The sign wraps round a cylinder or cone, such as a cup's sleeve. `top` and `bottom` are its edges as ellipses `[cx, cy, rx, ry]` (`ry` is positive when the front is lower, seen from above), and `span` is how far round the front the art goes, in degrees (140). The art bunches towards the sides as a printed sleeve does, and the corners come from it. |
| `kind: 'fabric'` | Cloth such as a tote, an apron or a tee. It is shaded like print, ink stops a little short of black, and the art follows the cloth's folds. |
| `displace` | How far the art is pushed about by the photo's own folds, in pixels: the shading's broad light, with its very broadest taken out. `fabric` uses 1.2% of the sign's short side. |
| `light` | Where the photo's light comes from, in degrees clockwise from the +x axis with y down (225 is the top left). Finishes are lit from it. |
| `finish` | The sign's default finish; `plate()`'s `finish` option overrides it. |
| `background: 'none'` | The sign's default ground (`plate()`'s `background` overrides it). With `'none'`, the art prints only where it is and the photo shows round it: paint on brick, white ink on dark stock, a decal. |
| `stock: true` (`makePlate` only) | The sign's own colour is the stock it is printed on (kraft, canvas, wood, leather, metal). Its unprinted parts stay as the photo has them, instead of its brightest being taken for white. |

### Finishes

`plate(p, { art, finish })` takes one finish for every screen, or one per screen. Each finish is drawn from the art's alpha after it is warped into the photo, so the art should be a mark on a clear ground. That alpha is blurred into a height, lit from the screen's `light` (`feDiffuseLighting`) and laid over the sign with `hard-light`. The edge facing the light catches it, the far edge falls into shadow, and flat areas stay as the photo had them.

| Finish | |
|---|---|
| `'ink'` | Printed (the default). |
| `'deboss'` | Pressed in: blind (no ink) by default, slightly darker inside (`tone`). Use it for card, leather or a book's cloth. |
| `'emboss'` | Raised. |
| `'engrave'` | Cut in and filled: the art in its own colours, or in one `color` (a burn on wood, black paint in brass). |
| `'foil'` | Stamped metal foil: the art filled with a `metal` (`'gold'`, `'silver'`, `'copper'`, `'rose'` or a hex colour), banded across the light, with a fine grain, the sign's own light and a slight deboss. |

Each finish is a name, or `{ type, depth, edge, tone, ink, color, metal }`. `depth`, `edge` (a fraction of the sign's short side) and `tone` all run from 0 to 1. `PLATE_FINISHES` and `PLATE_METALS` list the options.

### A halftone print

`halftonePrint(art, { ink, cell, start, end, shape, grid, direction, jitter, sharp })` returns art (an SVG) to pass to `plate()`, best on a `fabric` screen. The art is printed in one ink, solid in the middle and breaking into a dot screen towards its edges until it is gone, as a screen printer fades a print out on a heavyweight tee. The dots come from `@logomarks/image-effects`' `halftoneFade`, an optional peer dependency that is loaded when the function is called; in Node, pass `sharp`.

```js
import sharp from 'sharp';
import { plate, loadPlate, halftonePrint, renderImage } from '@logomarks/mockups/node';

const tee = await loadPlate('path/to/a-fabric-plate');
const print = await halftonePrint(markSvg, { ink: '#161616', start: 0.3, end: 0.92, sharp });
const jpeg = await renderImage(plate(tee, { art: print, fit: 'contain' }), { format: 'jpeg' });
```
