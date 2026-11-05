# Photo plates

A plate is a real photo with blank signs in it (a billboard, a fascia, a lightbox, a framed poster, a display) and, for each sign, its four corners, its kind and maps cut from the photo. `plate` warps the art into each sign and multiplies it by the blank sign's own light, so the scene's light, colour cast, seams and grime fall across the art. It matches the photo's grain and softness, feathers the edge, puts back whatever stands in front, screens glass reflections and glare back over the art, and bleeds a lightbox's light round it. The plates themselves are in [`@arraypress/mockups-plates`](https://github.com/arraypress/mockups-plates).

```js
import { plate, loadPlate, loadArt, renderImage } from '@arraypress/mockups/node';
import { PLATES } from '@arraypress/mockups-plates';

const p = await loadPlate(PLATES['shelter-night']);       // or a directory, a plate.json path, or a URL
const jpeg = await renderImage(plate(p, { art: await loadArt('flyer.png') }), { format: 'jpeg' });
```

| Export | |
|---|---|
| `plate(plate, options)` | A `Mockup` at the photo's size. `art` (one, or one per screen), `fit` (`'cover'`, `'contain'`, `'top'`), `background`, `grain` (× the photo's, 1), `glow`, `seed`. |
| `./node`, `./browser`: `loadPlate(source)` | The plate with its photo and maps inlined. |
| `./node`: `makePlate(photo, { name, kind or screens, blank, format, source })`, `savePlate(dir, made)` | A plate from a photo: each sign's corners found (the brightest even quadrilateral, or `near` a point, or given), its proportions recovered from the perspective, its maps cut from the photo (or from `blank`, the same photo with the sign blank). A screen's `mask` (hand-painted, or matted, such as fingers over a held card) is left out of the measuring and added to what's found. `format: 'webp'` writes WebP (masks lossless), about half the size of the JPEG default. |
| `PLATE_KINDS`, `KIND_LOOKS`, `checkPlate`, `quadMap` | The kinds (`'print'`, `'paint'`, `'backlit'`, `'glass'`), their default looks, the format check, and the projective map. |
