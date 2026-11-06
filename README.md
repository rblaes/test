# Midnight Rhythm — 3D Runner

An original Three.js endless side-scroller with a late-night blues-band atmosphere. Guide a blue-suited musician through a city after dark, jump road hazards, duck beneath low gantries and collect golden records. Characters and scenery use Three.js geometry without external image or sound assets.

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

The running route now includes a longer, higher elevated street between its staircase sections. Obstacles and collectibles are kept off the ascending/descending steps, but may appear on the upper level, positioned at that floor's elevation. The stairs use broad, continuous treads and risers that meet the road surface. Three.js 0.160.1 loads from jsDelivr, so an internet connection is currently required on the first load.
