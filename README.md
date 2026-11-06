# Midnight Rhythm — 3D Runner

An original Three.js endless runner with a late-night blues-band atmosphere. Guide a blue-suited musician over a multi-level city route, jump road hazards, duck beneath low gantries and collect golden records. Characters and scenery are built from Three.js geometry.

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

The route now has long stretches on each level, with occasional stair flights. It cycles from street level to rooftops, up into cloud height, back through town, and down into a sewer tunnel before returning to the street. Background lighting, clouds, and fog change with elevation; obstacle silhouettes change by biome. Hazards and records spawn on flat sections at their actual floor height, never on the stair flights. Three.js 0.160.1 loads from jsDelivr, so an internet connection is currently required on first load.
