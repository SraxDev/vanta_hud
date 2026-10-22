# Client optimisation notes

These notes describe what the code does to avoid work. They are not benchmarks: no figure here was measured on a controlled FiveM session, and **0.00 ms is not claimed**. The only measurements available came from a player on version 1.8.1: 0.05–0.08 ms on foot and 0.08–0.13 ms in a car (the first global range reported was 0.14–0.25 ms). Measure your own server with `resmon 1`.

## Third pass (1.8.3): conditional work and separate packets

- With a fresh pose, the coordinates, physical heading, velocity and speed already carried by `mapmotion` no longer trigger a second full message. The text heading, time, location, GPS and gauges are still compared and updated normally.
- If only the vehicle telemetry changes (same id and class), the client sends `vehicleTelemetry` instead of the whole HUD. The NUI then repaints only the gauge, GPS and vehicle alerts. A new vehicle, an exit or a general state change still uses the full snapshot; the interface rejects a vehicle packet that does not match its current vehicle. A NUI handshake resets the snapshot.
- The pose stream adds a speed bounded on the browser side and also detects vertical movement. The pose cadence (33 ms moving / 66 ms still) and interpolation are unchanged. Its validated result feeds the local state used by previews and the GPS.
- Known blips sit in a binary priority queue ordered by deadline. There are no longer two passes over every record every 100 ms: at rest, reading the head of the queue is enough; only due records are popped, re-read and reinserted. One entry per handle, up to 1024 handles; vanished records are dropped and deadlines are reset after a timer rollback. The total budget is 48 reads per pass, so refresh times stretch if many records come due at once. The family scanner and its discovery delays are those of 1.8.1.
- The native normaliser thread no longer runs with the custom map; the shared scanner already replaces it. The native theme receives the pause state from the main sampler and no longer owns a polling thread. The focus check left the per-frame loop: it lives in the sampler and is revalidated when the menu actually opens; closing the menu immediately re-enables key interception. Control disabling stays per frame because it only lasts for that frame.

This pass changed internal Lua/NUI contracts: install the Lua and web files of a release together. No change to assets, resolution or render rate, and no new network callback or server authority.

`hudperf` in F8 prints a one-off snapshot (readiness, fallback native radar, pose stream, vehicle mode, known/queued blip count); it starts no sampling. If the native radar stays active on the stock map while the custom map should be available, diagnose its loading first rather than removing the fallback natives.

## Second pass (1.8.2)

Speed, gear, RPM and altitude keep the gauge rate. Health, context and voice are re-read at most every 200 ms (the real rate depends on the loop step), fuel and engine state every 500 ms, an external seatbelt every 200 ms and the Mumble connection every 1 s. Critical death values and ped/vehicle changes invalidate the relevant caches; entering or leaving a vehicle also forces the vehicle details and seatbelt to refresh. The built-in seatbelt is read directly, without a cache. A voice connect/disconnect can therefore take up to about 1 s to show on screen.

The minimap pose sample also feeds the general refresh when it is younger than 150 ms and its ped/vehicle ids match; without a fresh sample the natives are read normally. Speed uses the norm of the physical velocity vector. Context shares the HUD's proximity and death reads. No pose cadence, render rate or resolution was lowered.

## First pass (1.8.1)

### Work removed or cached

| Path | 1.8.0 | 1.8.1 |
| --- | --- | --- |
| Player state | Checked in every frame's loop | Checked at most every 500 ms (`NetworkIsPlayerActive`); no check in the per-frame loop |
| Blips | Two scanners: 16 families/100 ms + 24 families/100 ms | One shared scanner, 32 families per batch; minimum interval 250 ms after the first round at 100 ms; stops when the map and minimap are inactive |
| Existing POIs | Full metadata re-read at every snapshot every 750 ms, colour clean-up every 100 ms | Static data re-read at most every 2 s; moving ones at most every 250 ms; 24 reads per category and pass, fair rotating scan |
| Blip serialisation | Sort + JSON before the NUI message | Cache per revision, sort only after a change; a single serialisation when actually sending |
| GPS to a waypoint | Up to 4096 native samples per extraction, retry possible every 800 ms; road distance request every 2 s | Native extraction and distance request removed for waypoints; the existing road Web Worker serves on foot and in vehicles |
| GPS missions | Native extraction | Extraction kept for missions, eight requests per resume and a 2 s minimum delay between extractions |
| HUD state | JSON at every refresh; a timestamp forced a send even without a useful change | Useful data compared; timestamp excluded from the comparison, a single encode when actually sending |
| Minimap | Pose sample every 33 ms | 33 ms on change, 66 ms when still; graphic interpolation kept, vehicle/ped reused from the current state |
| Location | Street/zone lookup every 500 ms even when still | Result kept while the movement since the last lookup stays under 3 m |
| Layout | Every ten iterations (1–2 s) | Layout every 3 s and immediately when a setting changes |

Intervals are minimum scheduling values, rounded to game frames. The read budget spreads the load: with a very large number of blips a round takes longer than the nominal interval. A new blip may wait for its family's turn, roughly ten seconds after the first round under nominal conditions. Already discovered dynamic positions are tracked separately. The scanner still respects display/alpha, removals, atlas colours and the 1024-blip limit.

A valid road computation is no longer restarted every four seconds when standing still. It is recomputed after a destination/mode change or enough movement (5 m on foot, 25 m in a vehicle, minimum interval 700 ms). Failures are retried with a delay. Areas outside the stock road network get no invented route.

### Remaining per-frame loop

It holds the controls needed for Esc/P, the built-in seatbelt when fastened and the scaleform when the fallback native radar is shown. The control-disabling natives are limited to the current frame: spacing them out would make the GTA menu reappear. Framework calls, layout, blip scanning, radar zoom and frontend redirection were moved out of this loop. When none of that per-frame work is needed the loop waits 100 ms.

This work reduces operations; it does not justify claiming a CPU time or an FPS figure without a FiveM measurement. Map rendering and the worker's computation also have a CEF/GPU cost that the Lua figure in resmon does not show.

### Review and limits

Lua syntax and the modified JavaScript were inspected without running gameplay. Rates, caches, invalidations, resume after pause, GPS cancellation and rotating budgets were reviewed. No test was added or run, no screen was captured and no resmon measurement was taken after the change. NUI callbacks, coordinate limits, epochs and validations are unchanged, and no network event giving server authority was added. Blip images, catalogue and map data are unchanged.

## Measuring in game

1. Server console: `refresh`, then `restart vanta_hud`.
2. In F8, compare `resmon 1` under the same conditions: wait for loading, stand still on foot, walk, drive without GPS, then with GPS; then open the big map and its zoom.
3. If a high cost persists, capture `profiler record 500`, wait for it to finish, then `profiler saveJSON hud.json`. The profile points at the lines that really cost time.

References: [Cfx resmon docs](https://docs.fivem.net/docs/client-manual/console-commands/#resmon-truefalse), [Cfx profiler](https://docs.fivem.net/docs/scripting-manual/debugging/using-profiler/).
