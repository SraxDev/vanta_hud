# Changelog

## 1.14.1

- Compass: the heading under the minimap showed French letters (NO, O, SO) in English. It now follows `Config.Locale`.
- Weapon HUD: an unknown weapon showed "ARME" in English; it now shows "WEAPON" (or "ARME" in French).
- ESX adapter: a stale ESX object after restarting `es_extended` could throw inside the HUD loop and freeze the HUD until a restart. Those calls are now protected and the object is fetched again.
- Settings callback: a request without settings no longer resets everything to defaults.
- Blips from `Config.Blips.locations` get their name on the custom map and a native icon when `minimap.gfx` is missing.
- Remaining French comments translated.
- Checked: Lua syntax, `node --check`, NUI preview in English and French (compass letters, no console error). Not checked in game: ESX restart while connected.

## 1.14.0

- Mission search areas (radius and area blips) are now drawn on the minimap and the big map, in the blip's colour.
- The map shows the real blip names ("Fishing merchant" instead of the icon name, e.g. "LEVEL").
- Vanta icons (fishing spot, merchant) no longer turn into a white dot when `stream/minimap.gfx` is missing: the game gets a native icon and the HUD still draws the Vanta one.
- GTA cannot tell a script a blip's name or a zone's size, so these three points need `client_script '@vanta_hud/shared/blip_info.lua'` in the resource that creates the blips (see README).
- GPS: setting a waypoint on some blips (garages, shops, hospital...) placed the point but drew no route. The road data has small disconnected pieces (car parks, private drives) and the route snapped to them. It now falls back to the main road network, and in a vehicle it ignores one-way lanes when they leave no legal path.
- Fixed `event esx:setAccountMoney was not safe for net`: framework events are registered with `RegisterNetEvent`.
- Checked: Lua syntax, `node --check`, manifests, route worker run offline on 26 trips (all found except Cayo Perico, which is not in the road data), radius zone and blip name rendered in the browser preview, `blip_info.lua` run against stubbed natives. Not checked in game yet.

## 1.13.1

- Cleaned up the repository: removed unused assets, design sources, old build tools and internal notes.
- NUI JavaScript and CSS reformatted so they can actually be read and diffed. No behaviour change.
- Shorter docs (`MAP2D.md`, `PERFORMANCE.md`, `THIRD_PARTY.md`).

## 1.13.0

- English and French (`Config.Locale = 'en' | 'fr'`). English is the default; missing French strings fall back to English.
- To add a language, copy `locales/fr.lua` and `web/locales/fr.js`.

## 1.12

- `Config.Framework`: `'standalone'` (default), `'esx'`, `'qb'` (QBCore/QBox) or `'auto'`.
- ESX: hunger/thirst from `esx_status`, cash, job, menu detection, optional hiding of `esx_hud` (`Config.HideFrameworkHud`).
- QBCore/QBox: hunger/thirst, cash, job. Written against the public API, not tested in game yet.
- `stream/minimap.gfx` is no longer in the repository (modified GTA file, see `THIRD_PARTY.md`).

## 1.11

- No hard dependency anymore: `es_extended` removed from the manifest.
- New `SetEconomy({ cash, bank, job, grade })` export, next to `SetNeeds(hunger, thirst)`.
- Inventory/phone shortcuts are off by default, set them in `Config.Integrations`.
- Built-in labels for 113 weapons, overridable with `Config.WeaponLabels`.

## 1.10

- New README.

## 1.9

- Weapon HUD: real weapon icons, magazine and reserve, reloading / empty / low ammo states. Sits above the vehicle gauge in a car and bottom right on foot. Hides the native ammo counter.
- Compass with heading and street.
- Cash and job display.
- Vehicle alerts for burst tyres and body damage (`Config.VehicleWarnings`).
- Cinema mode (`/hudcinema`, `SetCinema` export).
- Interface profiles (`/hudprofile save|load|list 1-3`).
- Quick menu: Settings opens the GTA pause menu settings, Interface opens the HUD settings.
- Map placement no longer lags behind the cursor in the placement editor.
- Fixed: compass stuck when the custom map was hidden.
- Fixed: leaving cinema mode re-showed a HUD that was hidden manually.
- Fixed: weapon label stuck on "WEAPON" when the weapon list was not loaded yet.

## 1.8

- GPS on foot and to waypoints computed locally in a Web Worker.
- Double-click a place to set the waypoint.
- Big round of client optimisations, see `PERFORMANCE.md`.

## 1.7

- New day/night map atlas for the minimap and the full-screen map.
