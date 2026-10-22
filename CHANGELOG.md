# Changelog

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
