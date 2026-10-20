# Blockout 3D

A lightweight 3D Blockout-style falling-block game built with JavaScript and Three.js.

## Run it locally

Because the game uses ES modules, serve the folder with a small local web server instead of opening the file directly in the browser.

```bash
cd /path/to/this/repo
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Controls

- A / D: move left / right
- Q / E: move backward / forward
- S / Down Arrow: soft drop
- R: rotate around the Y axis
- F: rotate around the X axis
- Space: hard drop
- P: pause

## Notes

This is a compact, browser-playable Blockout variant with a 6x6x12 board, multiple falling 3D polycubes, line clearing, score tracking, and increasing difficulty.

You can further expand it with sound, richer piece shapes, or a completely more faithful 3D Blockout rule set.
