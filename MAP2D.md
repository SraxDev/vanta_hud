# 2D map

## Simplified navigation (1.8.0)

- Double-click on the map or on a place entry: selects it and sets the GPS waypoint, with no Guide button or extra confirmation. The first click only selects. Dragging/rotating is never treated as a double-click. The bin icon clears the waypoint. The zoomed inset uses its own coordinates on click.
- A single Places panel: search, filters and points of interest. The Map/Route tabs, the Route panel and the confirmation card were removed. Enter and the gamepad shortcuts remain available; Esc returns to the quick menu.
- Walking route: local GTA road network, A* computed in a Web Worker. Routes follow the real node connections, with no arbitrary link across the lake. On foot, road links can be walked both ways; the vehicle fallback respects one-way lanes. The route starts and ends on the nearest road; no direct segment is added between an off-road marker and that road.
- Native route in vehicles: sampled every 8 m instead of a limit of 96 increasingly spaced points. It stops on a break larger than 28 m, a return to an earlier point or a motionless end; the end of the road is never closed into a loop. At most 4096 points, sixteen native requests per coroutine resume, with a cache and cancellation when the waypoint changes. If the native route is missing or incomplete, the local road network is the fallback.
- Minimap: light pose messages at most about 30 times/s when position/orientation changes, separate from needs and framework data. Camera heading is separate from the character's, with shortest-path angular interpolation, short prediction and smoothing independent of decorative animations. Rendering up to 60 frames/s in balanced/detailed mode, 30 in light mode. No native FPS is guaranteed.
- The compact GPS stays visible on foot; its distance and hints use the local route when it serves as the fallback. The minimap never connects the player's position straight to the next distant node.

JavaScript/Lua syntax was inspected. Three off-game browser renders were checked: a real double-click, a Grapeseed/Sandy Shores route going around the lake, and the line/GPS visible on foot. The sample computation produces 243 road points and no browser error. No screen capture of a game session, no FiveM session and no resmon measurement.

To reload: in the server console, `refresh` then `restart vanta_hud`.

## Road network

64,357 nodes and 135,740 local links from DurtyFree/gta-v-data-dumps, revision b65684e00f689fdec405c5f1055322c802d3c895. See licenses/ROUTING-SOURCE.txt and web/assets/routing/source.json. This is stock GTA data: roads modified or closed by your server are unknown to the local computation. The walking route follows roads, not a sidewalk or pedestrian-shortcut mesh. Outside the network, no fictional route is invented.

## History

### Automatic map and fixes (1.7.1)

- The "GTA map" entry was removed from the NUI and from the allowed action list. The map action opens only the custom map. The native MP Pause frontend is closed/redirected to the custom map when the resource is ready; Esc/P still open the quick menu.
- The custom map is enforced and the theme is forced to auto, in the Lua validation as well as in the NUI. Old manual day/night settings no longer apply, and the manual buttons and settings were removed. GTA time drives the background of the big map and the minimap.
- Minimap: local images are loaded through HTMLImageElement, with no blob fallback blocked by the CSP. The WebGL framebuffer is preserved for the cached background and redrawn on return, with bounded load timeouts and retries. Graphics availability is acknowledged instead of being announced for good before the client answers.
- Blips: removed on-screen cell masking and the variable 80/250 caps that made visible icons change when zooming. Stable order by id, real alpha respected, natively hidden states excluded, proximity with hysteresis (appears under 680 m, disappears after 760 m). The place list respects hidden categories. Blip drawings are unchanged.
- An area blip elsewhere on the map no longer replaces the whole custom minimap. The exact geometry of areas/radii is not reproduced, for lack of a public native getter for the radius; no invented radius is displayed. The native radar fallback still exists for graphics problems or areas outside the stock coverage, without opening the GTA map.
- Optimisation: no per-frame distance sort for icons, a bounded GPU cache, and a high-definition threshold corrected for DPI. The native radar zoom is refreshed at most every 500 ms and its scaleform is configured only while shown; scaleform startup is limited to five seconds.
- Resource safety: closed lists of actions and callbacks, per-epoch sessions for action/close, rate limiting with small bursts allowed to keep saving and the editor working, bounded blip coordinates/volumes and routes, and a checked manifest and image sizes. The CSP blocks objects, frames, forms and base changes. HTTPS stays allowed for FiveM callbacks: resource hosts containing an underscore are not valid CSP sources, so the callback target is built from the validated resource name. This client interface handles no money, inventory or server-permission authority.

Syntax of the three JavaScript files and the modified Lua was inspected. Four off-game browser renders were examined, including the return to the minimap and the 12:00/22:00 palettes: no browser error in the final render. No FiveM test, no screen capture, no native FPS/resmon measured.

### Drawn day/night atlas (1.7.0)

Integration of the approved direction: an 8192 × 8192 atlas with drawn vegetation and relief, beige desert, beaches, road network and city footprints. The big map opens on the whole island; the inset shows a zoom around the player. Search and real places remain available. The six category boxes filter the local display without removing the server's blips.

The minimap and the big map use the same background and the same Auto/Day/Night transition driven by GTA time. Blips and GPS reuse the existing data, icon atlases and callbacks. No visible Vanta name was added. The real atlas replaces the simplified 1.6 background; mock-up images are not used as geographic data.

Flat WebGL rendering: an already loaded overview background, local details with two simultaneous decodes, and a cache limited to 20 textures (10 in low quality). The previous view stays covered while a detail loads. Tiles carry a replicated border to avoid seams. The background is kept when only blips change; surfaces stop drawing at rest. Zoom is anchored to the cursor and capped according to resolution to limit enlargement beyond the real definition. No remote map service is called in game.

JavaScript syntax inspection and off-game browser renders were done. No FiveM validation, no native FPS/resmon measured.

## Data and alignment

web/assets/map-atlas/atlas.json gives the source, its revision, the fingerprints and the affine transform: u = x × scaleX + offsetX, v = y × scaleY + offsetY. The alignment reuses the stock-world UVs of the source resource; an off-game comparison of atlas/satellite coastal silhouettes gives a 3.36 % mask difference (shading and shoreline stroke included). That figure does not prove the accuracy of any native location. Streets, cities and blips were not redrawn from the generated mock-up.

The 2048 px background stays in memory and each 1024 px detail is extracted from the 8192 px source. Details and their border take about 81 MiB at most (40 MiB in low quality), plus about 22 MiB for the mipmapped background; the framebuffer and icons come on top. No capture of a player's screen.

The active rendering loads neither map-vector.js, nor Three.js, nor the old 3D background. The existing native fallback remains outside the stock GTA coverage and for blip types the bridge does not reproduce. Cayo Perico, MLOs and roads replaced by the server are not drawn in the atlas.

## Sources

Atlas: https://github.com/VIRUXE/gtav-map-tiles, revision 07946ff6dc8a175f96be442038823360fddf2756, atlas/5. GTA V cartographic work attributed to Rockstar Games; unofficial distribution. See licenses/MAP-ATLAS-SOURCE.txt. No NoPixel graphic element is distributed.
