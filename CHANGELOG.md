# Changelog

All notable changes to `@arraypress/mockups` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

