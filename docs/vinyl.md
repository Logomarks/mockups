# Vinyl

## `vinyl` options

| Option | Default | |
|---|---|---|
| `art` | required | The cover. |
| `format` | `'double'` | `'single'` or `'double'`. |
| `side` | `'both'` / `'right'` | Where the records peek out. A double on `'left'` or `'right'` fans both out on that side. |
| `vinyl` | `'clear'` | See below. Pass a pair to give each record its own. |
| `labels` | `'auto'` | See below. |
| `ground` | `'light'` | `'light'` (`#e6e6e6`), `'dark'` (`#161618`), a hex colour, `{ color, vignette }`, or a surface (`'oak'`, `'slate'`, `'knit'`…; see below). |
| `print` | `'full'` | `{ ink, paper }` prints the sleeve in one ink on coloured stock: the art's darks take the ink, so a photo comes out a monotone. |
| `size` | `1600` | Pixels: one number for a square, or `{ width, height }`. |
| `peek` | `0.53` | How much of a record's diameter shows past the sleeve. |
| `light` | `0.35` | Where the light is, from -1 (left) to 1 (right). Shadows fall the other way. |
| `shadow`, `sheen`, `grain` | `1`, `1`, `0.2` | Shadow depth, the paper's sheen, film grain. |
| `fit` | `0.89` | How much of the frame's width the group fills. |
| `title`, `seed` | `''`, `'vinyl'` | `title` sets the label's ring of type. `seed` sets the tracks, splatter and marble. |

`vinylScene` takes the same options, minus `size`, `sheen` and `grain`, plus a few of its own:

| Option | |
|---|---|
| `size` | `'12in'` (default) or `'7in'`: a 7" single, its label wider and its speed 45. |
| `layout` | `'upright'` (default): standing on a paper sweep, the records behind the sleeve. `'flat'`: lying on the ground. `'scatter'`: tipped out of the sleeve, the record beside it and the props in front. |
| `props` | Printed cards that go with it (an insert, a signed card): a list of art or `{ art, width, height, bleed, print }` in mm. They lie over the sleeve, in front of it, or propped against it standing. They take the sleeve's `print` unless they have their own. |
| `ground` | A plain ground, or a surface drawn at true size: the desk under a lay, the sweep's paper standing. |
| `light` | `'studio'` (default; or a number, the key's place) or `'flash'`: a phone's hard flash beside the lens, crisp shadows, a low window light raking across. |
| `drift` | `true` or 0–1: the camera wanders slowly round its view, drawn only while the canvas is on screen and not at all with reduced motion. |
| `view` | `{ tilt, turn, distance, fov }`. `tilt` 0 is the 2D view: level and front on standing, straight down lying. |
| `width`, `height`, `pixelRatio` | The drawing size. |
| `exposure` | Measured under the studio's light, so the ground comes out its own colour; 1 under the flash. |

```js
const scene = await vinylScene(canvas, {
	art: sleeve, size: '7in', layout: 'scatter', vinyl: '#ff2f93',
	print: { ink: '#3d051a', paper: '#ec3a95' },          // a photo screen-printed in one ink
	labels: { a: { art: mark, color: '#d21c72', scale: 0.6 } },
	props: [{ art: insert, width: 116, height: 98 }],
	ground: 'knit', light: 'flash', drift: true, view: { tilt: 15 },
});
```

## Vinyl finishes

| `vinyl` | |
|---|---|
| `'clear'`, `'black'`, `'white'`, `'smoke'` | Named finishes. |
| `'#f2b705'` | A solid colour. |
| `{ color, opacity }` | Translucent colour (`opacity` 0.75 by default). The colour filters what's behind it. |
| `{ splatter: [colors], base }` | Splatter over a base (clear by default). |
| `{ marble: [colors], opacity }` | Bands of the colours swirled together. |

## Labels

| `labels` | |
|---|---|
| `'auto'`, `'crop'` | Crops of the cover, side A toned dark, B light: its quietest windows when `loadArt` measured it, fixed ones otherwise. |
| `'blur'` | The whole cover, blurred. |
| `'plain'` | A plain colour. |
| `{ a, b }` | Each side is art of its own, or `{ art, tone, color, ink, text, ring, crop }`. Set `text: false` or `ring: false` to leave the words out. |
