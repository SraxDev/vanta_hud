# Offline build of the 2D vector map (1.6)

The three vector files are ready to serve: no build tool, 3D model, npm dependency or remote service is needed in game. The old tiles are no longer declared in the manifest since 1.6.

To rebuild: Node.js with sharp installed and the exact sources cited in MAP2D.md. Provide the folder holding graphic.bin/graphic.json, the folder of the model's source image, the one with zones.json, and the 2D build data roads.json/map.json. The historical build-base/build-palettes tools can prepare that data; they are not part of the active rendering.

In this folder:

`node --max-old-space-size=4096 build-vector.cjs GEOMETRY_DIR MODEL_DIR ROADS_DIR DATA_2D_DIR`

The tool writes vector.json, areas.bin and strokes.bin to web/assets/map2d. Water/forest masks are explicitly converted to a single channel. Small water false positives are filtered, outlines are simplified, smoothed and triangulated; roof footprints and roads keep their XY coordinates. Native zone boundaries define districts and parks. Strokes are grouped by cell for drawing.

shape-utils.mjs contains the MIT distribution of Three.js, used only for its offline triangulation; see licenses/THREE-MIT.txt. It is not declared in the NUI manifest. Allow a few GiB of free memory to build the masks. Palettes are defined in web/map-vector.js; no NoPixel graphic element is distributed.
