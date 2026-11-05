# Changelog

All notable changes to `@logomarks/mockups` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.3] — 2026-11-06

### Changed

- Renamed from `@arraypress/mockups` to `@logomarks/mockups`; no code changes. 0.4.3 is the first version under the new name; `@arraypress/mockups` stays on npm at 0.1.x.

## [0.4.2] — 2026-11-05

### Added

- **WebP plates.** `makePlate(photo, { format: 'webp' })` writes the photo, shading and reflections as WebP and the occluder mask as lossless WebP, about half the size of the JPEG default (`'jpeg'`, unchanged).
- **WebP and AVIF in `./node`.** `renderImage` re-encodes WebP and AVIF images inside a mockup (JPEG when opaque, PNG when not) before librsvg draws it: librsvg 2.63 draws neither, and left them blank. So WebP plates, and any WebP art inlined without `loadArt`, render in Node. Browsers were never affected.

### Fixed

- **Hand-painted occluder masks on held signs.** A screen's `mask` (white where something stands in front, such as the thumb and fingers over a held card) is now left out when the sign is measured: its reference white, its glare and its grain come from the sign round it, not through the fingers, so skin next to the paper no longer reads as glare. It used to be added only afterwards.
- **The light under occluders.** The shading under every occluder (found or given) is filled with the sign's light round it, blended by the mask's own softness, so the art showing through an occluder's soft edge is no longer tinted by the occluder's colour (a skin-toned or dark fringe round fingers and brackets).

## [0.4.1] — 2026-11-05

### Fixed

- **Turned SVG art in `./node`.** librsvg (2.63) lays an SVG `<image>` drawn under a rotation out in the turned box's bounds, so a turned ticket, card or sheet with an SVG print lost its top and bottom. `renderImage` now draws each SVG image as a raster at the size it's defined at first (JPEG when opaque, capped at 2048 px), so it turns correctly. Browsers were never affected.

## [0.4.0] — 2026-11-05

0.3.0 was tagged but never published, so this release carries its photo plates too.

### Added

- **`tvScene`** (`./3d`): a television in a dark room, its screen a live texture. A canvas is read every frame (so a shader or effect drawn into it plays), a video as it plays, a picture once; `setScreen` swaps it. `kind: 'crt'` is an old set on splayed legs (wood veneer, cream or black), with a bezel, knobs, a speaker grille and rabbit ears, its bulging face drawn through a CRT shader: the tube's curve, scanlines and the shadow mask's stripes, phosphor bloom, a rolling bar, noise and flicker (`crt: { curve, scanlines, bloom, roll, noise }`). `kind: 'flat'` is a thin panel on a foot behind dark glass. The screen lights the floor and set in its own colour, sampled from what it shows. Generic: no maker's shapes or logos.
- **`vinylScene`**: `size: '7in'` (a 7" single: its sleeve, its wider label, 45 RPM, fewer tracks); `layout: 'scatter'` (tipped out of the sleeve); `props` (printed cards: an insert, a signed card), lying, in front, or propped against the sleeve; `ground` takes any surface, drawn at true size under a lay or on the sweep; `light: 'flash'` (a phone's hard flash beside the lens, following the camera, crisp shadows, a low window light raking across); `drift` (the camera wanders slowly).
- **Drift and live frames**: a scene that moves draws at 30 fps (`fps`) only while its canvas is on screen and the page shown, and not at all with reduced motion.
- **One-ink prints** (`print: { ink, paper }`): art printed in one ink on coloured stock, its darks taking the ink, so a photo prints as a monotone. On the 2D and 3D sleeve and on props.
- **`wristband`**: woven fabric loops (the name woven round them, a slider with the mark, the cut tail) and flat Tyvek strips (the mark, words, a number, the stock's fibres, the peel tab). `lanyard` takes `wristbands` and `mark` to lay them beside the pass.
- **`ticket`**: `extra` (more tickets' prints, used in turn) and `layout: 'trio'` (two tickets and the stub of a third, torn off).
- **`sticker`**: `sheet` (a whole printed sheet, its kiss-cuts in the print, with `art` stuck down beside it) and `paper` (`'A4'`, `'A5'`, `'A6'`).
- **Surfaces**: `'slate'` (riven: shelves of layers lit from the light, grit, mica), `'cutting-mat'` (a green self-healing mat with a centimetre grid, bolder every five, numbered, 45° guides and healed scores) and `'knit'` (a chunky blanket: stitches, fuzz, loose folds). 2D `vinyl` takes surfaces as its `ground`.
- Labels take `scale` (their own art's size on the label), and print the record's speed.
- `VINYL_SIZES`, `SHEET_PAPERS`, `WRISTBAND`, `WRISTBAND_KINDS`, `VINYL_SCENE_LAYOUTS`, `TV_KINDS`, `CABINETS`.

### Fixed

- The bus `shelter` renders in resvg compiled to WebAssembly (2.6.2). The skyline drew blocks behind the camera, which projected billions of pixels off the frame, and resvg ran out of memory blurring them; only the blocks in view are drawn now, and they're the same blocks as before.

### Photo plates (from 0.3.0)

- **Photo plates.** `plate(loadedPlate, { art })` composites art into a real photo's blank signs, as a photo mockup does. It warps the art into the sign's corners, lifts its blacks to ink's density, and multiplies it by the blank sign's own shading. It matches the photo's grain and softness, feathers the edge, restores occluders from the photo, screens glass reflections and floodlight glare back over the art, and adds a glow round lightboxes. The kinds are `'print'`, `'paint'`, `'backlit'` and `'glass'`. `loadPlate` (`./node`, `./browser`) inlines a plate's files. `makePlate` and `savePlate` (`./node`) make one from a photo: they find the sign, recover its proportions from the perspective, and cut its shading, occluder mask, reflections and grain. A hand-painted occluder `mask` is added to what's found. SVG art is inlined rather than drawn as an `<image>`, so the warp's pieces don't misregister. The plates themselves ship separately in `@arraypress/mockups-plates`.

## [0.2.0] — 2026-11-05

### Removed

- The drawn hand: `card` layout `'hand'`, `ticket` layout `'held'`, the `skin`/`hand` options and `SKINS`. It couldn't pass for a photo. Passing `'hand'` or `'held'` now throws the usual unknown-layout error.
- `box`'s `angle` option: `open` sets how far a mailer's lid is swung.

### Changed

- **Box options match in 2D and 3D** (breaking). `open` is 0–1 in both (a mailer's lid swung up 112° at 1, a lid box's lid lifted); 2D still takes `true`/`false`. The board is `board` in both (`'kraft'`, the default, `'white'`, `'black'` or hex) and the inside is `lining`; `boxScene`'s `color` and `inside` are gone, and its default board is kraft (it was off-white).
- **Board reads as board.** Kraft is a photographed texture, with four variants mixed across faces, each turned and offset by the seed so the repeat never lines up. White and black board take its grain over their colour. Print is a little less saturated, with soft edges, and the grain lies over it, so the ink sits in the fibres. Kraft's shadows are a warm brown. Cut edges show the corrugated flute between two liners, including an open mailer's flap end. Folds have a soft rounded bend, and there's a faint crush where the lid tucks in. Inside corners gather soft occlusion. A white mailer is kraft inside.
- **`boxScene`** bakes each face at its real size, with occlusion and folds, and uses a matte physical material (roughness about 0.9) with normal and roughness maps from the texture, plus a faint grazing sheen.
- **`bag`** with `paper: 'kraft'` uses the photographed kraft.

### Fixed

- A side print is fitted to its face. Art whose proportions don't suit a face (a ticket on a lid box's shallow band) sits whole in the middle at the band's height, instead of being cropped to a band of itself. Every print stays clipped to its face.
- A lid box's side print in 3D is on the lid's skirt only, not on the base's front as well.
- An open box's inside walls are lit by how they face the light, so the left wall is no longer a dark block.

### Added

- `assets/textures/`: four healed kraft textures (WebP, 1024², about 900 KB in all; `tools/heal-textures.mjs` rebuilds them from the sources). `./node` loads them on import, `./browser` with `loadTextures()`, and `boxScene` fetches them. Without them, board falls back to procedural fibre.
- `fbm` and `noise2` can wrap, for seamless tiles.

## [0.1.1] — 2026-11-05

### Fixed

- The cassette J-card no longer prints a noise-reduction trade name (it reads "STEREO · SIDE A / B").

## [0.1.0] — 2026-11-05

### Added

- **`vinyl(options)`**: a single or double LP, front on. A sleeve carries the artwork, and records peek out on both sides, or on one side (fanned for a double). The records sit on a light, dark or coloured ground. The output is one layered SVG with the art embedded once and reused, and no dependencies. Clear vinyl is drawn the way the reference photo has it: a faint grey body, tracks with glossy gaps, fine rings every couple of pixels, a soft specular sweep, a bright bevel, and a dark edge. A faint halo sits just outside the edge. Shadows are soft: a contact shadow, an ambient one and a floor pool, falling away from the light. A clear record's shadow comes only from its rim and label. Film grain lies over the frame.
- **Vinyl**: `'clear'`, `'black'`, `'white'`, `'smoke'`, any solid colour, and translucent colour. Translucent colour filters the ground, multiplying it rather than washing over it. Splatter is seeded splashes with spatter; marble is bands swirled by turbulence. Each record can have its own vinyl.
- **Labels**: crops of the cover (A dark, B light), a blur of it, a plain colour, or art you supply. Each label carries the side, the speed and a ring of small type.
- **`./node`**: `renderImage` (sharp, an optional peer) and `loadArt` (from a path, URL or bytes, scaled down).
- **`./browser`**: `renderBlob`, `renderCanvas` and `loadArt`.
- **`./3d`**: `vinylScene(canvas, options)`, with three.js as an optional peer, imported on first use. The sleeve is a thin printed box. The records are MeshPhysicalMaterial: transmission for clear and tinted vinyl, anisotropy along the grooves, and groove normal and roughness maps. The labels, splatter and marble are drawn by the 2D modules. The scene has a room environment, VSM soft shadows, and the 2D contact shadows on the ground. The exposure is measured so the ground keeps its colour, and the camera takes a tilt, turn and distance.
- **`mockup(name, options)`** and **`OBJECTS`**, so more objects can be added under `src/objects/`.
- **Print and brand objects**: `card` (flat, front and back, a stack, a fan, held in a hand; painted edges and rounded corners), `letterhead` (A4, with a DL envelope, or a set with a card), `ticket` (a pair, optionally torn at the perforation, or held), `lanyard` (an A6 pass in a clear PVC sleeve on a strap printed with the name), `sticker` (die-cut circle, rounded or contour, on a laptop lid, a water bottle or a kiss-cut sheet), `tote`, `tee`, `hoodie`, `cap` (embroidered or printed), `mug` (the print wrapped round the curve; one mug or two) and `bag` (paper, with rope handles), and `box` (a mailer or a lid box, in axonometric view). They're laid out in millimetres at true size, and the bleed in print files is trimmed.
- **Surfaces**: `'concrete'`, `'oak'`, `'linen'` and `'paper'`. Each is built at three scales so it never visibly repeats: broad mottling drawn small in JS, a fine seamless turbulence tile, and for oak, grain drawn row by row with cathedral figure. A fall of window light and a vignette lie over them.
- **Stocks**: matte, uncoated, gloss, cotton and kraft. Each sets the paper's white, tooth and sheen. Sheets cast a contact shadow, a near one and an ambient one that spreads as they lift, and their thickness shows as an edge band.
- **Fabric**: fold height fields drawn procedurally become a shade map lit from the mockup's light and a displacement map. The print follows the folds and takes the knit, fleece, canvas or twill texture.
- **A hand**: photo-free, lit as one height field, with six skin tones or any colour.
- **`./3d`**: `cardScene`, `boxScene` and `mugScene`.
- `scene()` takes `art` optionally, and `Scene.image(art, aspect)` defines more artwork once, cover-fitted to an aspect.
- **`cd(options)`**: a jewel case (clear lid over the 120 mm booklet, black or clear tray, hinge, tabs and glare) or a digipak, with the disc slid out from behind it, printed from the cover or bare silver with its rainbow; and **`./3d` `cdScene`**, the same in three.js (transmissive polystyrene, an iridescent silver disc), standing or lying.
- **`cassette(options)`**: the case with a J-card made from the square cover (the cover, then a band of its colours with the title) and the tape in front, its label cut from the cover through the window, hubs, tape, head area and screws; black, white, clear, smoke or coloured shells.
- **`poster(options)`**: an A-series print taped to plaster or brick, wheatpasted (torn edges, creases, bubbles, the wall's relief through it), flyposted round a timber pole (flyers wrapped by a displacement, older ones faded and torn) or framed (black, white or oak moulding, a mat with a lit bevel, glass, a soft shadow).
- **3D upright layout**, now `vinylScene`'s default: the sleeve and records standing on a paper sweep, records behind and leaning back, front on and level by default; `layout: 'flat'` keeps the flat lay. Clear vinyl is thin glass (transmission, roughness 0.07, IOR 1.5), seen by reflections streaked by the grooves.
- **`loadArt` keeps opaque art as JPEG** (several times smaller, and every warped piece re-decodes it); only art with a see-through pixel stays PNG.
- **Quiet label crops**: `loadArt` measures where the cover is quiet (lowest edge density); `labels: 'auto'` crops there, clear of the cover's type.
- **Screens and signs**: `phone` (a generic handset lying on a surface, from above or at an angle. Its screen shows art, a home screen with the brand's app among muted placeholders, or the brand's post in a generic feed), `laptop` (a generic clamshell at three-quarters or front on, with a browser showing the brand's domain and the page), `billboard` (a roadside mast against a drawn sky over fields, or a framed poster on a brick wall; by day, at dusk or at night with its lamps lit), `shopfront` (a painted fascia with the mark and raised lettering, a shop window and door, sash windows above, a blade sign and goosenecks) and `shelter` (a glass bus shelter with a backlit 6-sheet, by day or glowing at night). None carries a maker's or platform's shapes, icons or marks.
- **Perspective**: a pinhole camera (`util/camera`) frames each object, and a projective warp (`render/warp`) lays flat drawings onto angled surfaces. The warp cuts a grid of triangles, as fine as a 0.75 px tolerance needs, and fills each with its cell of the drawing as a pattern. That leaves no seams in librsvg or browsers, and pieces off the frame are skipped. A lit slab part gives rounded device bodies, signs and lightboxes, with sides shaded facet by facet and a bevel highlight.
- **Materials and parts**: screen glass reflections, a drawn sky (day, dusk, night), a night grade with glows and lamps, device shells (`BODIES`), and Lambert/Blinn-Phong lighting in linear light. Also brick, paving with kerb and road, a field and treeline, an out-of-focus skyline, a keyboard deck, a cylinder post, and generic status bar, home, feed and browser UIs.
- **`render/fit`**: art placed by its own proportions (`cover`, `contain`, `top`), with sizes read from PNG, JPEG, GIF, WebP and SVG headers (`render/dims`). **`render/ink`** sets a mark's `currentColor`.

### Fixed

- The record's groove gradients were centred on the frame, not the record; tracks are now distinct bands parted by glossy rings, with the sweep showing on the grooves ring by ring, and a lit lip on the far edge.
- The spindle hole shows the true ground (the record's own shadow is cut out of it).
- Lower default grain (0.2), and a tight, faint shadow under the sleeve.
- Marble no longer reads as zebra stripes: colours squeeze out from the centre in swirled lobes with smoky edges.

