# Midnight Rhythm — 3D Runner

An original Three.js endless runner. Run, jump and duck through a Chicago-inspired night route that climbs to rooftops and clouds, then descends through the street into a sewer. Obstacles and collectibles match each biome and appear on level surfaces.

## Run

Serve the project locally (ES modules are not reliably supported from `file://` URLs):

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Controls

- **Space**, **Up arrow**, or **W**: jump
- **Down arrow**, **S**, or **Shift**: hold to duck
- On touch screens, hold **DUCK** and tap **JUMP**

The JavaScript is split into ES modules (`script.js`, `world.js`, `runner.js`, and `hazards.js`) to keep each source file manageable. Three.js 0.160.1 loads from jsDelivr, so an internet connection is currently required on the first load.
