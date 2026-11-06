# Midnight Rhythm — 3D Runner

An original Three.js endless side-scroller with a late-night blues-band atmosphere. Guide a blue-suited musician through a city after dark, leap over roadblocks, duck beneath low signs, and collect golden records. The characters and scenery are built from Three.js geometry; there are no image, font, or audio assets to download.

## Run

Open `index.html` from a local web server (ES modules are not reliably supported from `file://` URLs):

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Controls

- **Space**, **Up arrow**, or **W**: jump over barricades and cones
- **Down arrow**, **S**, or **Shift**: hold to duck beneath low overhead signs
- On touch screens, hold **DUCK** to crouch and tap **JUMP** to leap
- Collect golden records for bonus points; avoid colliding with obstacles.

## Offline note

The game uses Three.js 0.160.1 from jsDelivr, as the existing project did. The game itself has no remote images or sounds, but the first load still needs internet to fetch the Three.js module. To make it fully offline, download that exact Three.js module into the repository and change the import at the top of `script.js` to a relative local path.
