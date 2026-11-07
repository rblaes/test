# Midnight Rhythm — 3D Runner

An original Three.js endless runner with six gradual climbs and six descents through long level sections: street, rooftops, clouds and multiple underground sewer depths. Jump and duck through biome-specific hazards while collecting records.

## Run

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>. ES modules need a local web server. The game loads Three.js 0.160.1 from jsDelivr.

## Controls

- **Space**, **Up arrow**, or **W**: jump
- **Down arrow**, **S**, or **Shift**: hold to duck
- Touch controls: tap **JUMP**, hold **DUCK**

Route surfaces are instanced to reduce draw calls and prevent the game slowing down over time. Sewer tunnel ribs are translucent and placed behind the play lane, so they frame rather than obscure the runner.
