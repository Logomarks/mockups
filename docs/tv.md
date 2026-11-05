# TV

A television in a dark room, its screen live. Whatever the page draws on a canvas (a shader, an effect) plays on it: the canvas is read every frame, a video as it plays, a picture once. The screen lights the floor and the set in its own colour, sampled from what it shows.

```js
import { tvScene } from '@logomarks/mockups/3d';

const tv = await tvScene(canvas, { screen: effectCanvas, kind: 'crt', cabinet: 'wood' });
await tv.setScreen(video);
tv.dispose();
```

| Option | |
|---|---|
| `screen` | Required: a canvas, video, image or bitmap, or art. |
| `kind` | `'crt'` (default): an old set on splayed legs with a bezel, knobs, a grille and rabbit ears, its face bulging. `'flat'`: a thin panel on a foot. Generic: no maker's shapes or logos. |
| `cabinet` | `'wood'` (veneer, a CRT's default), `'cream'`, `'black'` (a flat TV's default) or hex. |
| `crt` | The tube's look: `true`, `false`, or `{ curve, scanlines, bloom, roll, noise }`, each 0–1. |
| `glow` | The light the screen throws (sampled from it by default). |
| `ground`, `view`, `drift`, `fps` | The room's dark; the camera (turned 35° left, raised 12°); its drift (on by default); frames a second (30). |

Like every scene it returns `{ render, setView, toBlob, dispose }`, plus `setScreen`. It draws frames only while the canvas is on screen, and with reduced motion it keeps one still frame.
