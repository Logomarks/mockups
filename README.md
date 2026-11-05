# @logomarks/mockups

Product mockups from finished artwork: vinyl, CDs, cassettes, posters, stationery, apparel, packaging, screens and signs, drawn as a layered SVG (sharp or a canvas to rasterise) or as a three.js scene.

## Install

```bash
npm install @logomarks/mockups
npm install sharp   # PNG/WebP/JPEG/AVIF in Node
npm install three   # the 3D scene
```

## Quick start

```js
import { vinyl, renderImage, loadArt } from '@logomarks/mockups/node';

const art = await loadArt('cover.png');                  // inlined, scaled to 1600 px
const { svg } = vinyl({ art, vinyl: 'clear' });           // a double LP on light grey
const webp = await renderImage(vinyl({ art, format: 'single', vinyl: 'black', ground: 'dark' }), { format: 'webp' });
```

## What's in it

- [Usage and API](https://github.com/Logomarks/mockups/blob/main/docs/api.md): the 2D and 3D entry points, every export
- [Vinyl](https://github.com/Logomarks/mockups/blob/main/docs/vinyl.md): sleeves and records, in 2D and 3D
- [Print and brand](https://github.com/Logomarks/mockups/blob/main/docs/print-and-brand.md): cards, tickets, lanyards, stickers, apparel, mugs, boxes
- [Music](https://github.com/Logomarks/mockups/blob/main/docs/music.md): CDs, cassettes, posters
- [Screens and signs](https://github.com/Logomarks/mockups/blob/main/docs/screens-and-signs.md): phone, laptop, billboard, shopfront, bus shelter
- [TV](https://github.com/Logomarks/mockups/blob/main/docs/tv.md): a television with a live screen
- [Photo plates](https://github.com/Logomarks/mockups/blob/main/docs/photo-plates.md): art composited into real photos

## Links

- [Docs](https://github.com/Logomarks/mockups/tree/main/docs)
- [Changelog](https://github.com/Logomarks/mockups/blob/main/CHANGELOG.md)
- [Licence](https://github.com/Logomarks/mockups/blob/main/LICENSE)
- [GitHub](https://github.com/Logomarks/mockups)
- [`@arraypress/covers`](https://github.com/arraypress/covers), which makes the art
- [`@logomarks/mockups-plates`](https://github.com/Logomarks/mockups-plates), the photo plates
- [Issues](https://github.com/Logomarks/mockups/issues)

## Licence

MIT © ArrayPress Limited; author David Sherlock. Cardboard textures by David Sherlock & Trirat (ArrayPress Limited), included under the package's MIT licence.
