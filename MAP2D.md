# Map and GPS

The minimap and the full-screen map are drawn by the NUI in WebGL (`web/map-atlas.js`, driven by `web/map2d.js`). Everything is local: no map service is called in game.

## Using it

- Click a place on the map or in the Places list to select it, double-click to set the waypoint. The bin icon clears it.
- The Places panel has search, category filters and the points of interest of your server.
- Esc goes back to the quick menu.

## Rendering

The atlas is an 8192 px day/night map split into 8x8 tiles of 1024 px (plus a 2 px border to avoid seams) and a 2048 px overview that stays loaded. Day/night colours are done in the shader, so there is only one set of textures. At most 20 detail tiles are kept on the GPU (10 in low quality), with two decodes at a time.

The minimap gets the player position about 30 times per second while moving and 15 when still, and renders at 60 fps (30 in light mode).

## GPS

- On foot and to a waypoint: A* on the GTA road network, computed in a Web Worker (`web/route-worker.js`). On foot roads can be walked both ways; in a vehicle one-way lanes are respected.
- Mission routes in a vehicle use the native GPS route, with the local network as a fallback.
- The route is recalculated when the destination changes or after you moved enough (5 m on foot, 25 m in a vehicle).

## Limitations

- Only the stock map: Cayo Perico, MLOs and roads added or closed by your server are not on the atlas or in the road network.
- Area blips (radius blips) are shown as icons, their exact shape is not reproduced.
- If WebGL fails, or outside the stock map, the HUD falls back to the native GTA radar.

## Sources

- Atlas: [VIRUXE/gtav-map-tiles](https://github.com/VIRUXE/gtav-map-tiles) (`atlas/5`, revision `07946ff`). See `licenses/MAP-ATLAS-SOURCE.txt`; alignment data is in `web/assets/map-atlas/atlas.json`.
- Road network: [DurtyFree/gta-v-data-dumps](https://github.com/DurtyFree/gta-v-data-dumps) (revision `b65684e`), 64k nodes. See `licenses/ROUTING-SOURCE.txt` and `web/assets/routing/source.json`.
