# Print and brand

Stationery, apparel and packaging from a brand kit, seen as a photo of the real thing. Everything is laid out in millimetres at its true size. Surfaces, paper tooth and fabric folds are procedural; kraft board is a photographed texture shipped with the package (see below). Print files from `@arraypress/covers` carry bleed; pass `bleed` (mm) and the art is trimmed.

```js
import { card, tee, mug, renderImage, loadArt } from '@arraypress/mockups/node';

const front = await loadArt('business-card-front.png');
const back = await loadArt('business-card-back.png');
const png = await renderImage(card({ art: front, back, bleed: 3, layout: 'stack', edge: '#e8604c', surface: 'oak' }));
const shirt = tee({ art: await loadArt('mark.svg'), color: 'heather', placement: 'left-chest' });
```

| Object | Layouts and kinds | Its own options |
|---|---|---|
| `card` | `'flat'`, `'pair'` (with a `back`), `'stack'`, `'fan'` | `back`, `edge` (painted edge colour), `thickness`, `radius`, `count` |
| `letterhead` | `'flat'`, `'envelope'` (DL), `'set'` (with a card) | `logo` (on the envelope), `card`, `back`, `envelope` (its colour) |
| `ticket` | `'pair'`, `'trio'` (two, and the stub of a third) | `extra` (more tickets' prints, used in turn), `torn`, `stub` (the perforation, a fraction of the width) |
| `lanyard` | an A6 pass in a clear sleeve | `name` (printed along the strap), `strap`, `ink`, `angle`, `wristbands` (bands beside it, as `wristband` takes them), `mark` (on their sliders) |
| `wristband` | woven `'fabric'` loops and flat `'tyvek'` strips | `bands` (each a kind or `{ kind, color, ink, text, number, clasp }`), `name` (their words); the art is the mark |
| `sticker` | `'laptop'`, `'bottle'`, `'sheet'` | `shape` (`'circle'`, `'rounded'`, `'contour'`), `extra` (more art for a sheet), `sheet` (a whole printed sheet, or `{ art, bleed }`: it lies there and `art` is stuck down beside it), `paper` (its size), `border`, `diameter`, `lid`, `color` |
| `tote` | a canvas tote, flat | `color`, `ink`, `scale` |
| `tee` | a flat lay | `placement` (`'center'`, `'chest'`, `'left-chest'`, `'back'`), `color`, `ink`, `scale` |
| `hoodie` | a flat lay | `placement` (`'chest'`, `'left-chest'`, `'back'`), `color`, `cord`, `ink`, `scale` |
| `cap` | six panels, `view` `'three-quarter'`, `'three-quarter-left'`, `'front'` | `finish` (`'embroidered'`, `'printed'`), `color`, `brim`, `ink`, `scale` |
| `mug` | `'single'`, `'pair'` | `print` (`'front'`, `'wrap'`), `back`, `color`, `inside`, `handle`, `gloss` |
| `bag` | a paper bag with rope handles | `paper` (`'kraft'`, `'white'`, `'black'`, hex), `rope`, `printSize`, `turn` |
| `box` | `kind` `'mailer'` or `'lid'` | `open` (0–1, or `true`), `lift`, `side`, `inside`, `board`, `lining`, `turn`, `elevation` |

They all take `art` (required), `surface`, `size`, `light`, `shadow`, `fit`, `grain` and `seed`; the paper objects also take `stock` and `bleed`.

| Option | |
|---|---|
| `surface` | `'concrete'`, `'oak'`, `'linen'`, `'paper'`, `'slate'` (riven), `'cutting-mat'` (a green grid mat, numbered in cm), `'knit'` (a chunky blanket), `{ texture, color }` (a walnut table is `{ texture: 'oak', color: '#8a5a3a' }`), or a plain ground (`'light'`, `'dark'`, hex, `{ color, vignette }`). |
| `stock` | `'matte'`, `'uncoated'`, `'gloss'`, `'cotton'`, `'kraft'`: the paper's white, tooth and sheen. |
| `color` (garments) | `'white'`, `'natural'`, `'heather'`, `'sand'`, `'sage'`, `'navy'`, `'black'` or hex. |
| `board` (boxes) | `'kraft'` (the default), `'white'` (white-top; a mailer is kraft inside), `'black'` or hex. Ink sits in the board's fibres; cut edges show the flutes. |
| `open` (boxes) | 0 (closed) to 1, the same in 2D and 3D: a mailer's lid swings up 112°, a lid box's lid lifts. `true` is 1. |

Kraft board (boxes, and the `bag`'s kraft paper) is drawn with photographed textures in `assets/textures/` when they're loaded: `./node` loads them on import (through sharp), `./browser` with `await loadTextures()`, and `boxScene` fetches its own. Until then kraft is procedural fibre. A side print fills its face when its proportions suit it, and otherwise sits whole in the middle.

`./3d` adds `cardScene` (`'flat'`, `'pair'`, `'stack'`, `'fan'`), `boxScene` (`kind`, `open` 0–1, `board`, `lining`, `print: 'cover' | 'logo'`) and `mugScene` (`print: 'auto' | 'front' | 'both' | 'wrap'`, `layout`, `spin`). They take the 2D options, plus `view`, `width`, `height`, `pixelRatio` and `exposure`, and return the same handle as `vinylScene`.

The lab scenes a print studio shoots, each one call, with the prints from `@arraypress/covers`:

```js
mockup('ticket', { art: night1, extra: [night2], layout: 'trio', bleed: 3, surface: 'slate' });
mockup('lanyard', { art: pass, bleed: 3, name: 'Ferro Fest', mark, surface: 'oak', wristbands: [
	{ kind: 'fabric', color: '#151515', ink: '#d4ff3a' }, 'fabric', { kind: 'tyvek', text: 'CREW', number: 'No.113084' },
] });
mockup('sticker', { layout: 'sheet', sheet: { art: stickerSheet, bleed: 3 }, art: badge, surface: 'cutting-mat' });
```
