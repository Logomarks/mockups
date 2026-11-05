# Music

`cd`, `cassette` and `poster`. Each is laid out in millimetres at true size.

## `cd` options

A jewel case (142 × 125 mm) or a digipak (139.7 × 124.5 mm) with the disc (120 mm) slid out from behind it.

| Option | Default | |
|---|---|---|
| `packaging` | `'jewel'` | `'jewel'` (booklet under a clear lid) or `'digipak'` (printed edge to edge). |
| `disc` | `'art'` | Printed with the cover, bare `'silver'`, or art of its own. |
| `side`, `peek` | `'right'`, `0.5` | Where the disc comes out, and how much of its diameter shows (0 hides it). |
| `tray` | `'black'` | The jewel case's tray: `'black'` or `'clear'`. |

## `cassette` options

The case (70 × 109 mm) with the J-card showing the cover, and the tape (100.4 × 63.8 mm) in front of it.

| Option | Default | |
|---|---|---|
| `shell` | `'black'` | `'black'`, `'white'`, `'clear'`, `'smoke'`, a hex colour or `{ color, opacity }`. |
| `label` | `'crop'` | A band of the cover (its quietest part), `'blur'`, `'plain'`, or art of its own. |
| `title`, `paper` | `''`, `'#f3f1ec'` | The title on the J-card and label; the label's paper. |
| `side` | `'right'` | Which side of the case the tape lies. |

## `poster` options

| Option | Default | |
|---|---|---|
| `mount` | `'tape'` | `'tape'` (corners), `'wheatpaste'` (torn, creased, the wall's texture through it), `'pole'` (flyers round a timber pole) or `'frame'`. |
| `paper`, `aspect` | by mount, `'art'` | `'A1'`–`'A5'` (A2 taped, A1 pasted, A4 on a pole, A3 framed); the art's proportions or the sheet's (`'paper'`, cropped). |
| `wall` | `'plaster'` | `'plaster'`, `'brick'` (behind a pole by default) or a hex colour. |
| `frame`, `mat` | `'black'`, `0.12` | `'black'`, `'white'` or `'wood'`; the mat as a share of the print's shorter side. |
| `count` | `3` | Flyers on a pole, 1–6. |

All three also take `ground` (`cd`, `cassette`), `size`, `light`, `shadow`, `fit`, `grain` (0.2) and `seed`.
