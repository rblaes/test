# AGENTS.md

## Project goal

`rblaes/test` is being turned into **Midnight Rhythm**, an original Three.js endless side-scrolling runner with a late-night Chicago/blues-band atmosphere. Keep the game original; do not copy copyrighted characters, artwork, music, or branding. The current gameplay concept includes running, jumping, ducking, collectible records, a multi-level path, clouds, and underground sewer sections.

## Before making changes

- Work on the `blues-brothers-runner` branch unless the user asks for a different branch.
- Inspect the current branch and files before editing. The repository has had several rapid iterations, and the HTML, CSS, entry script, and modules may not all reflect the same version. Do not assume a past conversation snippet is the current source of truth.
- Confirm that `index.html` loads the intended JavaScript entry point and that the entry point's import paths match the modules present in the repository.
- Preserve unrelated work and keep changes focused on the request.

## Architecture and conventions

- This is a static browser app using JavaScript ES modules and Three.js; there is no build step or package manager by default.
- Serve locally for development, for example with `python3 -m http.server 8000`; ES module imports do not work reliably from `file://` URLs.
- Three.js currently comes from the jsDelivr CDN. Do not claim the game works fully offline unless the dependency is vendored and the imports are local.
- Keep source split into small, cohesive modules where it matches the current entry point (for example world/scene construction, runner, hazards, and game loop). Avoid one oversized file and avoid duplicating shared state or geometry helpers.
- Keep the interface responsive and retain keyboard and touch controls. Jump and duck controls should remain distinct and accessible.

## Gameplay and world rules

- The runner should remain visibly framed while moving between street, rooftop, cloud, and sewer elevations. Camera tracking must preserve a stable screen-space offset from the runner; verify both the highest and lowest route levels.
- Stair transitions should be separated by longer flat stretches. The runner's feet, route surface, camera, hazards, and collectibles must all agree on the same elevation.
- Spawn obstacles and records only on safe, level route segments, not inside stair flights. Put them at the actual floor height of the platform they occupy.
- Keep obstacle types biome-appropriate. Low overhead obstacles require ducking; ground obstacles require jumping.
- Make environmental transitions readable through parallax, lighting, fog, cloud placement, and sewer details, without allowing foreground scenery or opaque tunnel geometry to obscure the runner.

## Performance and correctness

- The route repeats, so avoid creating new geometry/materials every frame or leaking removed objects. Dispose of resources when dynamically destroying them if they are not reused.
- Prefer `THREE.InstancedMesh` or shared geometry/materials for repeated stair treads, floor sections, tunnel ribs, windows, and other repeated props. Watch draw calls and object counts as the route loops.
- Use bounded `delta` time for animation and keep collision/update work proportional to the active hazards, not the total route history.
- Check for exceptions in the browser console. In particular, verify imports, required DOM IDs, state transitions, and that restarting clears/reinitializes hazards without accumulating scene objects.

## Validation checklist

After a gameplay or rendering change:

1. Run a local static server and load the game in a browser.
2. Check the browser console for module/import errors and runtime exceptions.
3. Play long enough for the route to repeat; confirm the animation continues and performance does not degrade or freeze.
4. Verify the runner remains in-frame at street level, every upper level, and the lowest sewer level.
5. Confirm stairs are traversable, obstacles do not spawn on stairs, and hazards on elevated floors align with that floor.
6. Test jump and duck with keyboard and touch controls, including holding and releasing duck and restarting after game over.
7. Check a narrow/mobile viewport and resize behavior.

There is no established automated test suite unless one is added; do not report tests as passing unless they were actually run.
