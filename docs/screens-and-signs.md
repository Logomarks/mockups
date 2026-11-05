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

## In 3D

The same brand shot as a photograph: three.js scenes, each with its own set, lit by what's in it and seen through a lens (frames averaged for depth of field and smooth edges; see [Usage and API](api.md#the-lens)). `art` is the mark unless the scene says otherwise; a mark drawn in `currentColor` takes `ink`, which defaults to near-black or warm white, whichever reads on `color`.

```js
import { sunglassesScene, phoneScene, laptopScene, keynoteScene, lightboxScene, neonScene, windowScene, billboardScene } from '@logomarks/mockups/3d';

const mark = await (await fetch('mark.svg')).text();
await sunglassesScene(canvas, { art: poster, time: 'golden', frame: 'havana' });
await phoneScene(canvas, { art: mark, name: 'Covehaus', color: '#1f5c4c' });
await phoneScene(canvas, { art: mark, name: 'Covehaus', color: '#1f5c4c', layout: 'pair', background: '#f2b134' });
await laptopScene(canvas, { art: mark, name: 'Railkin', color: '#4a3bd2' });
await keynoteScene(canvas, { art: mark, name: 'Covehaus', color: '#2f9e4f' });
await lightboxScene(canvas, { art: mark, name: 'Covehaus', headline: 'Rooms by the sea, booked in a minute.', url: 'covehaus.example' });
await neonScene(canvas, { art: mark, color: 'pink' });
await windowScene(canvas, { art: mark, name: 'Gecko', vinyl: 'gold' });
const shot = await billboardScene(canvas, { art: wideBoard, hedge: 'laurel' });
const blob = await shot.toBlob();
```

| Scene | What it is | Its own options |
|---|---|---|
| `sunglassesScene` | Sunglasses resting on a ledge, `art` (a poster, any artwork) reflected in their curved dark lenses from a street behind the camera, the street blurred behind them. No face. | `time` (`'day'`, `'golden'`, `'dusk'`), `lens` (`'smoke'`, `'mirror'`), `frame` (`'black'`, `'smoke'`, `'havana'`, hex), `surface` (`'concrete'`) |
| `phoneScene` | `layout` `'corner'`: a macro of a phone's corner, the brand's app first on its home screen beside generic apps, focused on the icon. `'pair'`: two phones floating before a wall of glazed tiles | `screen` (`'ui'`: the brand's page and its open menu; `'art'`: `art` and `back` as screenshots), `back`, `fill` (`'cover'`, `'top'`), `background` (the surface, or the tiles), `wallpaper`, `finish` |
| `laptopScene` | A laptop on a dark shelf, its screen the room's light: the lockup on a soft field of the brand's colour | `screen` (`'splash'`, `'art'`), `style` (`'corner'`, `'glow'`, `'stage'`), `scale`, `ground` (the room), `finish` |
| `keynoteScene` | A big screen over a stage, seen from behind the audience's heads; brand-coloured washes on the wall, a truss of lights | `screen` (`'splash'`, `'art'`), `style` (`'stage'`, `'glow'`, `'corner'`), `scale`, `wash` (the uplights), `seed` (the audience) |
| `lightboxScene` | A backlit poster in a slim frame on a station's wall of enamel panels, its glow on the wall and floor. `art` is the poster, or with `name` the mark of a type poster composed with its grid showing | `layout` (`'art'`, `'type'`), `headline`, `url`, `wall` (`'cream'`, `'white'`, `'green'`), `glow` (0–3) |
| `neonScene` | The mark bent in glass tube along its outlines on a brick wall in a dim room, its light raking the bricks. `art` must be SVG | `color` (`'pink'`, `'red'`, `'orange'`, `'yellow'`, `'green'`, `'blue'`, `'white'`, hex), `wall` (`'brick'`, `'plaster'`, hex), `size` (mm, 700), `glow` (0–3) |
| `windowScene` | The mark and name in vinyl on a shop window: the street opposite in the glass, a café out of focus behind | `vinyl` (`'white'`, `'gold'`, hex), `color` (the joinery), `time`, `wall` (`'brick'`, `'plaster'`, hex), `glare` (0–3) |
| `billboardScene` | A billboard over a clipped hedge of real leaves, seen from the street below. `art` is the poster (2:1 to 3:1) | `hedge` (`'laurel'`, `'box'`, `'yew'`), `density` (0.3–2), `light` (the sun) |

They all take `art` (required), `name`, `color`, `ink`, `seed`, the shot (`width`, `height`, `pixelRatio`, `view` as `{ tilt, turn, distance, fov }`, `exposure`, `fit`) and the lens (`blur`, `samples`), and return the usual handle (`render`, `setView`, `toBlob`, `dispose`). The phones, laptop and apps are generic: no maker's shapes, no platform's icons.
