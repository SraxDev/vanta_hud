# Changelog

Entries before 1.9.0 are archived in French in `docs/CHANGELOG-0.x-1.8-fr.md`.

# 1.13.0

English and French versions.

- **`Config.Locale`**: `'en'` (default) or `'fr'`. Translates the interface and every in-game message. English is the source text in the code; French lives in `locales/fr.lua` (Lua) and `web/locales/fr.js` (NUI). Text missing from a language file stays in English. New files: `client/locale.lua`, `web/i18n.js`.
- The NUI learns the language from the game (`ready` handshake) and reloads once with `?lang=`.
- Weapon labels are now English GTA names, with the French labels in `locales/fr.lua`.
- All documentation and code comments are in English. The old French changelog is archived in `docs/`.
- Checked: vanta-check, Lua/JS syntax, Chromium render in English and French (no page error, no accented word left in the English interface). Not checked in game: language switch, French messages.

# 1.12.2

Public repository preparation.

- `stream/minimap.gfx` (modified GTA file) is excluded by `.gitignore`; README and `THIRD_PARTY.md` explain it. It stays in your local folder.
- Default `Config.Framework` in the repository: `'standalone'`.
- Checked: vanta-check. Not checked: HUD behaviour without `minimap.gfx` in game (deduced from reading the code).

# 1.12.1

Code review, no behaviour change.

- Comments reduced to what is useful: file headers removed, short sentences. `VantaBridge.Percent` is shared instead of copied in the adapter.
- `THIRD_PARTY.md`: `stream/minimap.gfx` is described as a modified GTA V minimap.gfx (Rockstar Games), with no other provenance.
- Checked: vanta-check, Lua/JS syntax, adapter test with stubbed natives.

# 1.12.0

Framework choice in the configuration.

- **`Config.Framework`**: `'standalone'` (default), `'esx'`, `'qb'` (QBCore/QBox) or `'auto'` (detects the started resource). New `client/framework.lua`.
- **ESX** adapter: hunger/thirst through `esx_status`, cash/job, "player loaded" state, ESX menu detection (the quick menu does not open on top of them), and hiding of `esx_hud` / the `esx_status` bar when `Config.HideFrameworkHud` is true (restored when the HUD stops).
- **QBCore/QBox** adapter: hunger/thirst (`metadata`), cash, job, logged-in state. The original HUD is not hidden.
- Without an adapter nothing is read and `vanta_hud` depends on no resource; an explicitly chosen framework that is not started makes the HUD wait, `'auto'` falls back to standalone.
- The `SetNeeds` / `SetEconomy` exports stay available for other frameworks.
- Checked: vanta-check, Lua 5.4 tests with stubbed natives and frameworks (ESX and QB: loaded state, cash, job, hunger, thirst). Not checked in game: both adapters, especially QBCore/QBox (written from the public API), hiding `esx_hud`, duplicate removal.

# 1.11.0

Standalone: the resource no longer depends on any other.

- **No dependency** on `es_extended` (removed from the manifest). "Player ready" uses `NetworkIsPlayerActive`, checked at most every 500 ms.
- Removed the `esx_hud` takeover, `esx_status` hiding, ESX status/account/job reading and ESX menu detection. `Config.TakeoverEsxHud`, `Config.HideEsxStatus` and `Config.StatusMax` are gone.
- **New export** `SetEconomy({ cash, bank, job, grade })` for money and job; `SetNeeds(hunger, thirst)` stays the entry point for hunger/thirst. Without calls these blocks are hidden.
- **Phone and inventory disabled**: `Config.Integrations` is empty by default (menu buttons are greyed out), favourite 3 is "None". Enable them by filling in your resource and its export.
- Seatbelt: built-in mode by default; `external` mode is still possible with `resource` and `export`.
- Built-in weapon labels (113 weapons, plus `Config.WeaponLabels` to customise) replace the ESX list.
- Weapon icons: ox_inventory provenance (GPL-3.0) stated in the README and `THIRD_PARTY.md`.
- Checked: vanta-check, Lua/JS syntax, bridge test (labels, icons, `SetEconomy`) with stubbed natives. Not checked in game: standalone "player ready" detection, built-in seatbelt, absence of the hunger/thirst gauges without `SetNeeds`.

# 1.10.0

Release preparation. No in-game behaviour change.

- **New README** for players and administrators: features, requirements, installation, commands, configuration, exports, limits, licences. The old README (version history 0.x to 1.8) is kept in `docs/HISTORY-1.x-fr.md (French)`.
- Removed mentions of local backup folders from published documents.
- `.gitignore`: backups (`backups/`, `releases/`) and the unused old 3D map (`web/map3d.js`, `web/vendor/`, `web/assets/map3d/`, `tools/map3d/`, its GPL licence) excluded.
- `THIRD_PARTY.md`: provenance of the weapon icons (ox_inventory, GPL-3.0).
- Static review of the client Lua (no call to an undefined function) and the interface loads without error in Chromium.
- Checked: vanta-check.

# 1.9.9

Code reorganisation, no behaviour change.

- **Lua**: weapon HUD logic moved from `main.lua` to `client/weapon.lua` (reading, rate, native counter hiding). `main.lua` keeps a single call in the per-frame loop.
- **NUI**: `extras.js` becomes a short facade; compass, money/job and weapon HUD each have a module in `web/extras/` (`compass.js`, `money.js`, `weapon.js`), reformatted and commented. `extras.css` reformatted rule by rule.
- Manifest and `index.html` updated to load the new files.
- Checked: vanta-check, Chromium render (compass, money, weapon HUD in car/on foot, cinema). Historical files (`app.js`, `main.lua`) were not mass-reformatted, to avoid regressions without in-game testing.

# 1.9.8

- **Smooth map placement**: while dragging in "Customise placement" the map trailed the frame (its position depended on a round trip to the game, about 80 ms), unlike the locally moved gauge. It is now moved immediately in the interface from the last position confirmed by the game; the game's confirmation lands on the same value, with no jump. Saving and limits are unchanged.
- Checked: syntax, vanta-check, the interface loads without error. Dragging cannot be simulated outside the game.

# 1.9.7

- **Weapon HUD redesigned and repositioned**: same width and right edge as the vehicle gauge, directly above it (and its alerts) in a car, bottom right on foot. New layout: weapon name and state ("RELOADING", "EMPTY MAGAZINE", "LOW AMMO") in the header, large icon, big magazine counter with the reserve, a row of segments at the bottom like the RPM gauge, accent line on top. More compact (about 93 px tall at 1080p).
- Checked: Chromium render (car and on foot).

# 1.9.6

- **Fix: the weapon HUD overlapped the speedometer in a car.** It now sits above the vehicle gauge and its alerts (real position measured in the interface, so gauge placement settings are respected) and returns to the bottom right on foot. Re-measured on every vehicle telemetry, layout change and after the vehicle enter/exit animation.
- Checked: Chromium render (car then on foot), vanta-check.

# 1.9.5

General audit (Lua client + NUI). Full review of `client/main.lua`, `context.lua`, `navigation.lua` and the NUI loops: the script was already optimised by the 1.8.x passes (adaptive rates, caches, no needless `Wait(0)`); those mechanisms were left alone without measurements. No figure is claimed.

- **Fix: frozen compass.** Heading was only updated by the map pose stream; with the map hidden ("on foot" option off) or on the native minimap, the compass stayed stuck. It now falls back to the character's orientation when no pose has arrived for 1.5 s.
- **Fix: cinema mode.** Leaving it always re-enabled the HUD, even if it had been hidden manually before (`/vanta_hud`). The previous state is now restored, and `/vanta_hud` during cinema changes that return state.
- Cleanup: duplicate `nextWeapon` declaration removed.
- Checked: vanta-check.

# 1.9.4

Optimisation and targeted fix pass on the weapon HUD. No figure claimed: nothing was measured in resmon.

- **One thread less**: the dedicated thread hiding the native ammo counter (a separate `Wait(0)` loop) is removed; hiding and weapon reading now run in the existing per-frame loop, which only runs every frame while a firearm is held.
- **More responsive ammo**: read at most every 66 ms with a weapon in hand (100 ms otherwise) instead of the sampler's 200 ms; the NUI message is sent only when a displayed value changes.
- **Fix**: an empty ESX weapon list (ESX not ready yet) was cached for good, giving a "WEAPON" label with no icon until restart. It is now re-read every 5 s while empty.
- **Icon fallback**: weapons missing from the list get their icon from their name (113 base weapons).
- **NUI**: the weapon panel no longer touches the DOM when nothing changed (repeated `state` messages).
- Checked: vanta-check, Chromium render.

# 1.9.3

- Weapon HUD: drawn silhouettes are replaced by **the real GTA weapon icons** (113 PNG in `web/weapons/`). If a weapon has no icon, the category silhouette is the fallback.
- Icons come from the ox_inventory project (GPL-3.0), credited in `licenses/WEAPON-ICONS-OX_INVENTORY.txt`.
- Checked: vanta-check, Chromium render with the SMG icon.

# 1.9.2

- **Weapon HUD redone**: moved to the bottom right, same style as the map panels (cut corners, accent line), weapon silhouette by category, big magazine counter, reserve and a row of segments (one per bullet up to 40) that empties as you shoot.
- GTA's native ammo counter (top right) is hidden while a firearm is held and the option is on. This adds a per-frame loop **only with a weapon in hand** (two light natives); not measured in resmon.

# 1.9.1

- **Weapon HUD** (option "WEAPON HUD", on by default): once a weapon is in hand, a panel at the bottom centre shows the weapon name, magazine ammo, reserve and a magazine gauge. States "LOW AMMO" (25 % or less), "EMPTY MAGAZINE", "NO AMMO" and "RELOADING". Melee weapons: name only.
- Client reading at 10 Hz with a weapon in hand, 4 Hz otherwise; the NUI message is sent only when a value changes. Hidden when unarmed, dead, in menus, in cinema mode or with the HUD hidden.
- Checked: full vanta-check, Chromium render (firearm, low, melee, hiding).

# 1.9.0

- Quick menu: the Inventory entry is replaced by **Settings** (sound, graphics, game keys), which opens GTA V's native pause menu without redirecting to the custom map. The old "Settings" entry becomes **Interface** (HUD settings) to avoid confusion. Inventory stays available as a favourite shortcut; the default Favourite 2 is Settings (saved profiles keep their choice).
- Map: a **single click** sets the GPS waypoint (free point, map blip or place from the list). A click while a request is pending is replayed instead of ignored, and a 4 s timeout keeps the map from locking if the game does not answer.
- **Compass** (option): heading strip with cardinal points, degrees and street, top centre. Hidden in menus and cinema mode.
- **Cash and job** (option): cash, bank, job and grade at the top right, updated on events only (no added loop). Gains and spending show briefly. Read-only.
- **Vehicle alerts**: burst tyre and damaged/critical body (thresholds `Config.VehicleWarnings.bodyLow/bodyCritical`), read with the vehicle telemetry already sampled every 500 ms.
- **Cinema mode**: `hudcinema` command (bindable in Settings > Key Bindings > FiveM, "HUD: cinema mode"); hides the HUD and shows black bars. Export `SetCinema(true/false)`.
- **Interface profiles**: `/hudprofile save 1-3`, `/hudprofile load 1-3`, `/hudprofile list`. Reuses the existing settings validation.
- Checked: Lua/JS syntax, manifest, browser renders of the compass, money, cinema mode, tyre/body alert and single-click waypoint placement (test map, placeholder atlas). **Not tested in FiveM**: opening the native settings, waypoint placement on the real map, ESX money/job reading. No resmon measurement.
