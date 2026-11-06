# Midnight Rhythm — 3D Runner

An original Three.js endless side-scroller with a late-night blues-band atmosphere. Guide a blue-suited musician through a multi-level city route, jump road hazards, duck beneath low gantries and collect golden records. Characters and scenery use Three.js geometry without external image or sound assets.

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

The path now climbs through three distinct elevations with long level platforms between stair flights, then descends back to the street. The runner follows the individual tread heights. Hazards are skipped on stair flights and spawned on the road or elevated platforms at the correct floor height. Three.js 0.160.1 loads from jsDelivr, so an internet connection is currently required on the first load.
