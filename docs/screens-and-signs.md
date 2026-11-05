# Screens and signs

The brand on a phone, a laptop, a billboard, a shopfront and a bus shelter. They're drawn in perspective through a camera, and lit. Art on an angled screen or sign is warped with a true projective map: a grid of triangles, each carried by its own affine map, as fine as the angle needs. Everything in them is generic, with no maker's or platform's shapes, icons or marks.

```js
import { readFile } from 'node:fs/promises';
import { phone, laptop, billboard, shopfront, shelter, renderImage, loadArt } from '@logomarks/mockups/node';

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
