# Atlas 1.7

The active engine is web/map-atlas.js, driven by web/map2d.js. It loads only web/assets/map-atlas/atlas.json and the local WebP files declared in fxmanifest.lua. No npm module or external server is needed in game.

8192 px source: https://github.com/VIRUXE/gtav-map-tiles/tree/07946ff6dc8a175f96be442038823360fddf2756/atlas/5, 1024 tiles of 256 px. Assemble x/y without rotation, produce a 2048 px background, then cut 8 × 8 images of 1024 px. Add two pixels of neighbouring data on each edge (replicated at the outer limits): each delivered file is 1028 × 1028 px. WebP quality 98; background quality 97. Alignment parameters and provenance are in atlas.json. See licenses/MAP-ATLAS-SOURCE.txt for credits.

Day/night colours are computed in the fragment shader of map-atlas.js, without doubling the textures. Icons are drawn separately, from the existing blip atlases. The detail cache is limited to 20 images in normal/high quality, 10 in low; two simultaneous loads. The already loaded background stays visible when a detail is missing. Decoded images are released after GPU upload. No detail finer than the source is invented.

The 1.6 vector tools in this folder only remain to rebuild the old version. They do not produce the active 1.7 background.
