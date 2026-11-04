# Changelog

All notable changes to `@arraypress/mockups` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — Unreleased

### Added

- **`vinyl(options)`**: a single or double LP, front on. A sleeve carries the artwork, and records peek out on both sides, or on one side (fanned for a double). The records sit on a light, dark or coloured ground. The output is one layered SVG with the art embedded once and reused, and no dependencies. Clear vinyl is drawn the way the reference photo has it: a faint grey body, tracks with glossy gaps, fine rings every couple of pixels, a soft specular sweep, a bright bevel, and a dark edge. A faint halo sits just outside the edge. Shadows are soft: a contact shadow, an ambient one and a floor pool, falling away from the light. A clear record's shadow comes only from its rim and label. Film grain lies over the frame.
- **Vinyl**: `'clear'`, `'black'`, `'white'`, `'smoke'`, any solid colour, and translucent colour. Translucent colour filters the ground, multiplying it rather than washing over it. Splatter is seeded splashes with spatter; marble is bands swirled by turbulence. Each record can have its own vinyl.
- **Labels**: crops of the cover (A dark, B light), a blur of it, a plain colour, or art you supply. Each label carries the side, the speed and a ring of small type.
- **`./node`**: `renderImage` (sharp, an optional peer) and `loadArt` (from a path, URL or bytes, scaled down).
- **`./browser`**: `renderBlob`, `renderCanvas` and `loadArt`.
- **`./3d`**: `vinylScene(canvas, options)`, with three.js as an optional peer, imported on first use. The sleeve is a thin printed box. The records are MeshPhysicalMaterial: transmission for clear and tinted vinyl, anisotropy along the grooves, and groove normal and roughness maps. The labels, splatter and marble are drawn by the 2D modules. The scene has a room environment, VSM soft shadows, and the 2D contact shadows on the ground. The exposure is measured so the ground keeps its colour, and the camera takes a tilt, turn and distance.
- **`mockup(name, options)`** and **`OBJECTS`**, so more objects can be added under `src/objects/`.
