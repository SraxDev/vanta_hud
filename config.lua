Config = {}
-- Language of the in-game texts: 'en' or 'fr'. To add one, copy locales/fr.lua and add its web counterpart.
Config.Locale = 'en'
Config.MenuKey = 'F1' -- Rebindable in GTA Settings > Key Bindings > FiveM.
Config.ReplacePauseMenu = true -- Esc and P open the custom quick menu.
Config.SeatbeltKey = 'B'
-- 'builtin': own seatbelt (key above). 'external': reads the state from another resource,
-- e.g. { mode = 'external', resource = 'my_seatbelt', export = 'isSeatbeltOn' } (no-argument export returning a boolean).
Config.Seatbelt = { mode = 'builtin' }
-- Framework: 'standalone' (reads nothing), 'esx', 'qb' (QBCore / QBox) or 'auto' (detects the started resource).
-- An adapter reads hunger/thirst, cash/job and the "player loaded" state; it never modifies the framework.
Config.Framework = 'standalone'
Config.HideFrameworkHud = true -- ESX adapter: hides esx_hud / the esx_status bar to avoid duplicates.
Config.Notifications = { enabled = true } -- Notify export; has no effect when disabled.
Config.LowThreshold = 20
Config.UpdateMs = 200
Config.VehicleUpdateMs = 100
Config.Defaults = {
    scale = 1.0, offsetX = 0, offsetY = 0,
    onFoot = true, location = true, speedUnit = 'kmh',
    blipStyle = 'classic', motion = true, opacity = 0.60,
    vehicleHud = true, vehicleScale = 1.0, beltIndicator = true, fuelIndicator = true,
    lowAlerts = true, voice = true, armourZero = false, adaptiveHud = true,
    gps = true, vehicleAlerts = true, nativeTheme = true, displayMode = 'custom',
    theme = 'cyan', textScale = 1.0, highContrast = false,
    contextual = true, voiceDetails = true, nautical = true,
    favoriteAction = 'map', favoriteAction2 = 'gamesettings', favoriteAction3 = 'none', lastTab = 0,
    uiSounds = true, uiVolume = 0.18, vehicleOffsetX = 0, vehicleOffsetY = 0,
    map3d = true, mapTheme = 'auto', mapQuality = 'balanced',
    compass = true, moneyHud = true, weaponHud = true
}
-- map3d is kept as a preference key for existing profiles.
Config.CustomMap = { enabled = true, maxBlips = 1024, exclusive = true } -- Custom map and automatic theme are enforced.
-- Optional menu shortcuts to other resources; empty = disabled (no link by default).
-- Example: inventory = { resource = 'my_inventory', export = 'open' }, phone = { resource = 'my_phone', export = 'open' }
Config.Integrations = {}
-- Custom weapon labels: { WEAPON_PISTOL = 'My pistol' }. Icons come from web/weapons.
Config.WeaponLabels = {}
Config.Radar = {
    lift = 0.065, distance = 250.0,
    -- Inner margins of the native radar measured at 1080p; scaled with the HUD.
    -- Frame tightened to the visible tiles after the second capture.
    visibleInsets = { left = 8, top = 12, right = 8, bottom = 20 }
}
Config.Blips = {
    -- Graphic catalogue streamed by minimap.gfx: players must reconnect.
    -- To disable it, remove that file from the stream folder and reconnect.
    enabled = true,
    slots = { police = 60, hospital = 61, garage = 357, shop = 52, bank = 108, fuel = 361, fishing = 966, merchant = 967 },
    -- No point is created by default; resources that create their own blips stay in charge.
    locations = {}
}



Config.NativeMenuTheme = { enabled = true }
Config.Context = { recoveryMs = 1800, oxygenScaleSeconds = 10.0 }
Config.VehicleWarnings = { fuelLow = 15, fuelCritical = 5, engineLow = 650, engineCritical = 300,
    bodyLow = 600, bodyCritical = 300 } -- Body (1000 = intact); a burst tyre always triggers the alert.
Config.Presets = {
    minimal = { adaptiveHud = true, opacity = 0.45, onFoot = false, location = true,
        voice = true, fuelIndicator = true, beltIndicator = true, gps = true, vehicleAlerts = true },
    balanced = { adaptiveHud = true, opacity = 0.60, onFoot = true, location = true,
        voice = true, fuelIndicator = true, beltIndicator = true, gps = true, vehicleAlerts = true },
    detailed = { adaptiveHud = false, opacity = 0.80, onFoot = true, location = true,
        voice = true, fuelIndicator = true, beltIndicator = true, gps = true, vehicleAlerts = true }
}
