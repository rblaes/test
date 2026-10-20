# Blockout 3D

A browser-only Blockout clone built with Three.js.

## Run locally

Because this is a static browser app, you can serve it from any local web server:

```bash
cd /path/to/this/repo
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Controls

- Left / Right arrows or A / D: move the paddle
- Space: launch the ball

## Notes

This project intentionally avoids a build step. It uses the Three.js CDN directly in the browser, so it works as a lightweight static webpage.
