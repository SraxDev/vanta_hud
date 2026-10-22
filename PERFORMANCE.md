# Performance

Reported by a player on 1.8.1: around 0.05-0.08 ms on foot and 0.08-0.13 ms in a vehicle (`resmon`). Your numbers will depend on your server, so measure them yourself.

## What the client does to stay cheap

- The per-frame loop only does what has to run every frame (blocking Esc/P, the built-in seatbelt, the native radar scaleform when it is shown). When none of that is needed it sleeps 100 ms.
- Values are read at the rate they actually change: speed/gear/RPM at the gauge rate, health and voice every 200 ms, fuel and engine every 500 ms, Mumble every second.
- The NUI only gets a message when something changed. Vehicle telemetry is sent on its own (`vehicleTelemetry`) instead of the full HUD state.
- Street and zone names are only looked up again after moving more than 3 m.
- Blips are scanned by one shared scanner, with a priority queue by next refresh time and a budget of 48 reads per pass. It stops when the map and the minimap are hidden. A new blip can take a few seconds to show up.
- GPS routes are computed in a Web Worker and only recomputed after a destination change or real movement.

The map rendering also costs some GPU/CEF time, which `resmon` does not show.

## Measuring

1. `refresh` then `restart vanta_hud` in the server console.
2. In F8, `resmon 1`, and compare the same situations: standing still, walking, driving with and without GPS, big map open.
3. If something looks high: `profiler record 500`, wait, then `profiler saveJSON hud.json` and open it to see which lines cost time.

`/hudperf` prints a snapshot of the internal state (radar mode, pose stream, blip queue) in F8.
