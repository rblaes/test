# Midnight Rhythm — 3D Runner

An original Three.js endless side-scroller with a late-night blues-band atmosphere. Guide a blue-suited musician through a city after dark, leap over roadblocks, duck beneath low signs, and collect golden records. Characters and scenery use Three.js geometry without external image or sound assets.

## Run

Serve the project locally (ES modules are not reliably supported from `file://` URLs):

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Controls

- **Space**, **Up arrow**, or **W**: jump over barricades and cones
- **Down arrow**, **S**, or **Shift**: hold to duck beneath low overhead gantries
- On touch screens, hold **DUCK** to crouch and tap **JUMP** to leap
- Collect golden records for bonus points; avoid colliding with obstacles.

Solid stair sections now appear directly on the running path: the character physically climbs the steps, crosses the landing, and descends back to the road. The camera follows part of the elevation so the up-and-down motion is visible while keeping the runner on screen. Duck-only gantries appear regularly and cannot be cleared by jumping. Three.js 0.160.1 loads from jsDelivr, so an internet connection is currently required on the first load.
