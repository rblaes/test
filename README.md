# Midnight Rhythm — 3D Runner

A small, original Three.js endless side-scroller with a late-night blues-band atmosphere. Guide a blue-suited musician through a city after dark, leap over roadblocks, and collect golden records. The characters and scenery are built from Three.js geometry; there are no image, font, or audio assets to download.

## Run

Open `index.html` from a local web server (ES modules are not reliably supported from `file://` URLs):

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Controls

- **Space**, **Up arrow**, or **W**: jump
- **Tap/click** the play area or **JUMP** button: jump
- Collect golden records for bonus points; avoid the barricades and cones.

## Offline note

The game uses Three.js 0.160.1 from jsDelivr, as the existing project did. The game itself has no remote images or sounds, but the first load still needs internet to fetch the Three.js module. To make it fully offline, download that exact Three.js module into the repository and change the import at the top of `script.js` to a relative local path.
