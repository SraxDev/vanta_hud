local resource = GetCurrentResourceName()
local settings, uiReady, menuOpen, manuallyHidden = {}, false, false, false
local belt, beltPed, originalWindscreen, vehicle = false, nil, nil, 0
local scaleform, lastLayout, lastPayload, nextOpen = nil, '', nil, 0
local fullLeases, statusLeases = {}, {}
local radarRefresh = 0
local nuiViewport = {}
local radarMaskReady = false
local radarWasHidden = IsRadarHidden()
local nativeRadarShown = false
local layoutDraft = nil -- Transient editor preview; never written to KVP until confirmation.
local menuEpoch = 0
local mapPageOpen, nextMapSync, lastMapBlips, lastMapRoute = false, 0, '', nil
local mapMotionActive = false
local motionPed = 0
local motionSample = nil
local pauseControlActive, scaleformReady = false, false
local nativePause = GetHashKey('FE_MENU_VERSION_MP_PAUSE')
local redirectMap, redirectUntil, nextRadarZoom = false, 0, 0
local nativeSettings, nativeSettingsUntil, nativeSettingsSeen = false, 0, false -- GTA settings opened on purpose: no blocking, no redirect to the map
local directions = { 'N', 'NW', 'W', 'SW', 'S', 'SE', 'E', 'NE' } -- GTA headings turn anticlockwise

-- compare the useful state before SendNUIMessage encodes it once
-- the pose timestamp must not trigger a full send while standing still
local function unchanged(a, b)
    if a == b then return true end
    if type(a) ~= type(b) then return false end
    if type(a) ~= 'table' then return a == b end
    for key, value in pairs(a) do
        if key ~= 'sampledAt' and not unchanged(value, b[key]) then return false end
    end
    for key in pairs(b) do if key ~= 'sampledAt' and a[key] == nil then return false end end
    return true
end
local poseFields = { x=true, y=true, z=true, heading=true, sampledAt=true, vx=true, vy=true, speed=true }
local function unchangedHud(a, b, streaming)
    if type(b) ~= 'table' then return false end
    for key, value in pairs(a) do
        if key ~= 'vehicle' then
            if key == 'world' and streaming and type(value) == 'table' and type(b.world) == 'table' then
                for field, item in pairs(value) do
                    if not poseFields[field] and not unchanged(item, b.world[field]) then return false end
                end
                for field in pairs(b.world) do
                    if not poseFields[field] and value[field] == nil then return false end
                end
            elseif not unchanged(value, b[key]) then return false end
        end
    end
    for key in pairs(b) do if key ~= 'vehicle' and a[key] == nil then return false end end
    return true
end
local function round(n) return math.floor(n * 100 + 0.5) / 100 end

local function clamp(n, a, b)
    n = tonumber(n)
    if not n or n ~= n then return a end
    return math.max(a, math.min(b, n))
end
local function validate(input)
    input = type(input) == 'table' and input or {}
    local out = {}
    for key, default in pairs(Config.Defaults) do
        local value = input[key]
        if key == 'scale' then out[key] = clamp(value or default, 0.8, 1.3)
        elseif key == 'opacity' then out[key] = clamp(value or default, 0.35, 0.9)
        elseif key == 'vehicleScale' then out[key] = clamp(value or default, 0.8, 1.25)
        elseif key == 'textScale' then out[key] = clamp(value or default, 0.9, 1.25)
        elseif key == 'lastTab' then out[key] = math.floor(clamp(value or default, 0, 4))
        elseif key == 'theme' then out[key] = (value == 'sage' or value == 'cyan' or value == 'amber') and value or default
        elseif key == 'mapTheme' then out[key] = 'auto'
        elseif key == 'map3d' then out[key] = Config.CustomMap.enabled == true
        elseif key == 'mapQuality' then out[key] = (value == 'low' or value == 'balanced' or value == 'high') and value or default
        elseif key == 'favoriteAction' then out[key] = (value == 'map' or value == 'gamesettings' or value == 'inventory' or value == 'phone') and value or default
        elseif key == 'favoriteAction2' or key == 'favoriteAction3' then out[key] = (value == 'none' or value == 'map' or value == 'gamesettings' or value == 'inventory' or value == 'phone') and value or default
        elseif key == 'uiVolume' then out[key] = clamp(value or default, 0, 0.5)
        elseif key == 'offsetX' or key == 'offsetY' or key == 'vehicleOffsetX' or key == 'vehicleOffsetY' then out[key] = clamp(value or default, -1, 1)
        elseif key == 'speedUnit' then out[key] = (value == 'mph' or value == 'kmh') and value or default
        elseif key == 'displayMode' then out[key] = (value == 'minimal' or value == 'balanced' or value == 'detailed' or value == 'custom') and value or default
        elseif key == 'blipStyle' then out[key] = (value == 'classic' or value == 'rp' or value == 'cyan') and value or default
        elseif type(default) == 'boolean' then out[key] = type(value) == 'boolean' and value or (value == nil and default or false)
        end
    end
    local favorites = { [out.favoriteAction] = true }
    for _, key in ipairs({ 'favoriteAction2', 'favoriteAction3' }) do
        if favorites[out[key]] then out[key] = 'none' end
        if out[key] ~= 'none' then favorites[out[key]] = true end
    end
    return out
end
do
    local saved = GetResourceKvpString('vanta_hud:settings:v2')
    local ok, data = pcall(json.decode, saved or GetResourceKvpString('vanta_hud:settings:v1') or '{}')
    if not saved and ok and type(data) == 'table' and data.scale == 1.08 then data.scale = 1.0 end
    settings = validate(ok and data or {})
end

HudFrontendTheme.SetEnabled(settings.nativeTheme, settings.theme)

local function send(kind, data)
    if uiReady then SendNUIMessage({ type = kind, data = data }) end
end
local function notify(message)
    send('notice', { message = message })
end
-- returns false until the UI is ready so the caller keeps its own display
exports('Notify', function(data)
    if not uiReady or not Config.Notifications.enabled then return false end
    if type(data) == 'string' then data = { message = data } end
    if type(data) ~= 'table' or type(data.message) ~= 'string' or data.message == '' then return false end
    local kinds = { info = true, success = true, warning = true, error = true }
    send('notice', { message = data.message:sub(1, 2048),
        title = type(data.title) == 'string' and data.title:sub(1, 160) or '',
        kind = kinds[data.kind] and data.kind or 'info', duration = clamp(data.duration or 4000, 1800, 10000) })
    return true
end)
local lastEconomy
local function pushEconomy(force)
    if not uiReady then return end
    local data = VantaBridge.Economy()
    local encoded = json.encode(data or false)
    if not force and encoded == lastEconomy then return end
    lastEconomy = encoded
    send('economy', data or { hidden = true })
end
VantaBridge.onEconomy = function() pushEconomy() end
exports('SetEconomy', VantaBridge.SetEconomy)
local function syncInit()
    send('init', { settings = settings, lowThreshold = Config.LowThreshold, presets = Config.Presets, vehicleWarnings = Config.VehicleWarnings,
        map3dEnabled = Config.CustomMap.enabled,
        actions = { inventory = VantaBridge.Available('inventory'), phone = VantaBridge.Available('phone'), gamesettings = true } })
    VantaWeapon.Reset()
    SetTimeout(300, function() pushEconomy(true) end)
end

local function persistSettings(candidate)
    local encoded = json.encode(candidate)
    SetResourceKvp('vanta_hud:settings:v2', encoded)
    if GetResourceKvpString('vanta_hud:settings:v2') ~= encoded then
        return false
    end
    settings = candidate
    HudFrontendTheme.SetEnabled(settings.nativeTheme, settings.theme)
    return true
end
local styleRequest = 0
local function scheduleBlipStyle(style)
    styleRequest = styleRequest + 1
    local request = styleRequest
    CreateThread(function()
        Wait(0) -- answer the NUI callback before loading the texture
        if request ~= styleRequest then return end
        local ok, applied, reason = pcall(VantaBlips.SetStyle, style)
        if not ok or applied ~= true then
            print(('[vanta_hud] blip style not applied (%s): %s'):format(style, tostring(reason or applied)))
            notify(T('Settings saved. The blip style could not be applied.'))
        end
    end)
end

local function radarLayout(reset)
    local placement = layoutDraft or settings
    local s = reset and 1.0 or placement.scale
    local dx = reset and 0.0 or placement.offsetX
    local dy = reset and 0.0 or placement.offsetY - Config.Radar.lift
    if not radarMaskReady then
        RemoveReplaceTexture('platform:/textures/graphics', 'radarmasksm')
        RemoveReplaceTexture('platform:/textures/graphics', 'radarmask1g')
        radarMaskReady = true
    end
    local ax, ay = -0.0045, 0.002
    local function component(name, x, y, w, h)
        SetMinimapComponentPosition(name, 'L', 'B', ax + (x - ax) * s + dx,
            ay + (y - ay) * s + dy, w * s, h * s)
    end
    component('minimap', -0.0045, 0.002, 0.150, 0.188888)
    component('minimap_mask', 0.020, 0.032, 0.111, 0.159)
    component('minimap_blur', -0.030, 0.022, 0.266, 0.237)
    SetMinimapClipType(0)
    radarRefresh = radarRefresh + 1
    local generation = radarRefresh
    if not reset then
        CreateThread(function()
            Wait(180)
            if generation ~= radarRefresh or IsPauseMenuActive() then return end
            -- never the big radar here, the HUD only uses the compact one
            SetBigmapActive(false, false)
        end)
    end
end

local function constrainLayout(candidate)
    local renderWidth, renderHeight = GetActiveScreenResolution()
    local width, height = nuiViewport.width or renderWidth, nuiViewport.height or renderHeight
    local safe = (1.0 - GetSafeZoneSize()) * 0.5
    local unit = height / 1080.0 * candidate.scale
    local inset, s = Config.Radar.visibleInsets, candidate.scale
    SetScriptGfxAlign(string.byte('L'), string.byte('B'))
    local left, top = GetScriptGfxPosition(-0.0045, 0.002 - Config.Radar.lift - 0.188888 * s)
    local right, bottom = GetScriptGfxPosition(-0.0045 + 0.150 * s, 0.002 - Config.Radar.lift)
    ResetScriptGfxAlign()
    left, top = left * width + inset.left * unit, top * height + inset.top * unit
    right, bottom = right * width - inset.right * unit, bottom * height - inset.bottom * unit
    local marginX, marginY = math.max(8, safe * width), math.max(8, safe * height)
    -- native alignment stays at zero, the NUI reserves room for GPS and gauges
    local limits = {
        offsetX = { math.min(0, (marginX - left) / width), math.max(0, (width - marginX - right - 197 * unit) / width) },
        offsetY = { math.min(0, (marginY + 105 * unit - top) / height), math.max(0, (height - marginY - bottom - 82 * unit) / height) },
        vehicleOffsetX = { math.min(0, (marginX + 280 * height / 1080 * candidate.vehicleScale - width * (1 - safe - 0.025)) / width), 0 },
        vehicleOffsetY = { math.min(0, (marginY + 290 * height / 1080 * candidate.vehicleScale - height * (1 - safe - 0.025)) / height), 0 }
    }
    for key, bounds in pairs(limits) do candidate[key] = clamp(candidate[key], bounds[1], bounds[2]) end
    return limits
end

local function updateLayout(force)
    local placement = layoutDraft or settings
    local limits = constrainLayout(placement)
    local renderWidth, renderHeight = GetActiveScreenResolution()
    local width, height = nuiViewport.width or renderWidth, nuiViewport.height or renderHeight
    local safe = (1.0 - GetSafeZoneSize()) * 0.5
    local key = ('%d:%d:%.3f:%.3f:%.3f:%.4f:%.4f:%.4f:%.4f'):format(width, height, safe, placement.scale, placement.vehicleScale, placement.offsetX, placement.offsetY, placement.vehicleOffsetX, placement.vehicleOffsetY)
    if not force and key == lastLayout then return end
    lastLayout = key
    radarLayout(false)
    local x = -0.0045 + placement.offsetX
    local y = 0.002 + placement.offsetY - Config.Radar.lift
    SetScriptGfxAlign(string.byte('L'), string.byte('B'))
    local left, top = GetScriptGfxPosition(x, y - 0.188888 * placement.scale)
    local right, bottom = GetScriptGfxPosition(x + 0.150 * placement.scale, y)
    ResetScriptGfxAlign()
    -- the GTA component includes a gutter: its full rectangle
    -- is not the rectangle of the visible tiles and blips
    local unit = height / 1080.0 * placement.scale
    local inset = Config.Radar.visibleInsets
    local visibleLeft = left * width + inset.left * unit
    local visibleTop = top * height + inset.top * unit
    local visibleRight = right * width - inset.right * unit
    local visibleBottom = bottom * height - inset.bottom * unit
    send('layout', { left = visibleLeft,
        top = visibleTop, width = visibleRight - visibleLeft,
        height = visibleBottom - visibleTop, unit = unit, scale = placement.scale, limits = limits,
        offsetX = placement.offsetX, offsetY = placement.offsetY,
        vehicleOffsetX = placement.vehicleOffsetX, vehicleOffsetY = placement.vehicleOffsetY,
        right = (safe + 0.025) * width, bottom = (safe + 0.025) * height, safeTop = (safe + 0.025) * height })
end

local function closeMenu()
    if not menuOpen then return end
    menuOpen = false
    mapPageOpen = false
    menuEpoch = menuEpoch + 1
    layoutDraft = nil
    updateLayout(true)
    nextOpen = GetGameTimer() + 350
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false)
    pauseControlActive = Config.ReplacePauseMenu and VantaBridge.ready and not VantaBridge.MenuOpen() and not next(fullLeases)
    TriggerScreenblurFadeOut(180)
    send('menu', { open = false })
end
local function openMenu()
    if not uiReady or not VantaBridge.IsLoaded() or VantaBridge.MenuOpen() or next(fullLeases) or IsPauseMenuActive() or IsNuiFocused() or GetGameTimer() < nextOpen then return end
    menuOpen = true
    menuEpoch = menuEpoch + 1
    syncInit()
    send('menu', { open = true, epoch = menuEpoch })
    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(false)
    TriggerScreenblurFadeIn(180)
end

local callbackTimes = {}
local callbackIntervals = { ready = 800, viewport = 100, settings = 100, map3dReady = 100,
    mapView = 100, mapWaypoint = 150, action = 150, close = 100, layoutEditor = 60 }
local function callback(name, fn)
    RegisterNUICallback(name, function(data, cb)
        local now, bucket = GetGameTimer(), callbackTimes[name]
        local capacity = name == 'layoutEditor' and 6 or 4
        if not bucket or now < bucket.at then bucket = { at = now, tokens = capacity } end
        bucket.tokens = math.min(capacity, bucket.tokens + (now - bucket.at) / (callbackIntervals[name] or 100))
        bucket.at = now
        callbackTimes[name] = bucket
        if bucket.tokens < 1 then cb({ ok = false, error = T('Action too fast.') }) return end
        bucket.tokens = bucket.tokens - 1
        local ok, response = pcall(fn, type(data) == 'table' and data or {})
        if not ok then print(('[vanta_hud] %s: %s'):format(name, response)) end
        cb(ok and (response or { ok = true }) or { ok = false, error = T('Action failed.') })
    end)
end
local function viewport(data)
    local width, height = tonumber(data.width), tonumber(data.height)
    if not width or not height or width ~= width or height ~= height then return false end
    if width < 320 or width > 16000 or height < 200 or height > 9000 then return false end
    if width / height < 0.7 or width / height > 5.0 then return false end
    nuiViewport = { width = math.floor(width), height = math.floor(height) }
    return true
end
callback('viewport', function(data)
    if not viewport(data) then return { ok = false } end
    updateLayout(false)
    return { ok = true }
end)
callback('ready', function(data)
    viewport(data)
    lastMapBlips, lastMapRoute, nextMapSync = '', nil, 0
    HudMapData.SetReady(false)
    uiReady = true lastPayload = nil syncInit() updateLayout(true)
    scheduleBlipStyle(settings.blipStyle)
    return { ok = true, locale = Config.Locale }
end)
callback('close', function(data)
    if not menuOpen or data.epoch ~= menuEpoch then return { ok = false, error = T('This session has ended.') } end
    closeMenu() return { ok = true }
end)
callback('map3dReady', function(data)
    if not uiReady or type(data.ready) ~= 'boolean' then return { ok = false } end
    HudMapData.SetReady(data.ready and Config.CustomMap.enabled)
    return { ok = true }
end)
callback('mapView', function(data)
    if not menuOpen or data.epoch ~= menuEpoch or type(data.open) ~= 'boolean' then return { ok = false, error = T('The menu is closed.') } end
    mapPageOpen = data.open
    send('mapview', { open = mapPageOpen })
    return { ok = true }
end)
callback('mapWaypoint', function(data)
    if not menuOpen or not mapPageOpen or data.epoch ~= menuEpoch then return { ok = false, error = T('The map is closed.') } end
    if data.clear == true then SetWaypointOff() HudNavigation.Invalidate() nextMapSync = 0 return { ok = true } end
    if type(data.x) ~= 'number' or type(data.y) ~= 'number' or data.x ~= data.x or data.y ~= data.y
        or math.abs(data.x) > 9000 or data.y < -9000 or data.y > 12000 then return { ok = false, error = T('Invalid waypoint position.') } end
    SetNewWaypoint(data.x + 0.0, data.y + 0.0)
    HudNavigation.Invalidate()
    nextMapSync = 0
    send('maproute', { points = {}, partial = true, destination = { x = data.x, y = data.y, z = 0 } })
    return { ok = true }
end)
callback('layoutEditor', function(data)
    if not menuOpen then return { ok = false, error = T('The menu is closed.') } end
    if data.epoch ~= menuEpoch then return { ok = false, error = T('This settings session has ended.') } end
    if data.open == false then
        layoutDraft = nil
        updateLayout(true)
        TriggerScreenblurFadeIn(120)
        return { ok = true }
    end
    if data.open ~= true or type(data.settings) ~= 'table' then return { ok = false, error = T('Invalid placement.') } end
    local candidate = validate(settings)
    for _, key in ipairs({ 'offsetX', 'offsetY', 'vehicleOffsetX', 'vehicleOffsetY' }) do
        if type(data.settings[key]) ~= 'number' or data.settings[key] ~= data.settings[key] then return { ok = false, error = T('Invalid position.') } end
        candidate[key] = clamp(data.settings[key], -1, 1)
    end
    constrainLayout(candidate)
    local opening = layoutDraft == nil
    layoutDraft = candidate
    updateLayout(true)
    if opening then TriggerScreenblurFadeOut(100) end
    return { ok = true, settings = candidate }
end)
callback('settings', function(data)
    if not menuOpen then return { ok = false, error = T('The settings menu is closed.') } end
    if data.epoch ~= menuEpoch then return { ok = false, error = T('This settings session has ended.') } end
    local candidate
    if data.preset ~= nil then
        local preset = type(data.preset) == 'string' and Config.Presets[data.preset]
        if type(preset) ~= 'table' then return { ok = false, error = T('Unknown preset.') } end
        local merged = {}
        for key, value in pairs(settings) do merged[key] = value end
        for key, value in pairs(preset) do if Config.Defaults[key] ~= nil then merged[key] = value end end
        merged.displayMode = data.preset
        candidate = validate(merged)
    else
        -- a missing table would otherwise silently reset everything to defaults
        if data.reset ~= true and type(data.settings) ~= 'table' then return { ok = false, error = T('Invalid settings.') } end
        candidate = validate(data.reset == true and {} or data.settings)
    end
    local styleChanged = candidate.blipStyle ~= settings.blipStyle or data.reset == true
    constrainLayout(candidate)
    if not persistSettings(candidate) then
        return { ok = false, error = T('Local settings could not be saved.') }
    end
    updateLayout(false)
    if styleChanged then scheduleBlipStyle(settings.blipStyle) end
    return { ok = true, settings = settings }
end)
callback('action', function(data)
    if not menuOpen or data.epoch ~= menuEpoch or type(data.id) ~= 'string' then return { ok = false, error = T('This session has ended.') } end
    local id = data.id
    if id ~= 'resume' and id ~= 'map' and id ~= 'gamesettings' and id ~= 'inventory' and id ~= 'phone' then return { ok = false } end
    if (id == 'inventory' or id == 'phone') and not VantaBridge.Available(id) then
        return { ok = false, error = T('Resource unavailable.') }
    end
    if id == 'map' then
        if not Config.CustomMap.enabled then return { ok = false, error = T('Map unavailable.') } end
        layoutDraft = nil
        mapPageOpen = true
        send('mapview', { open = true })
        return { ok = true, map3d = true }
    end
    if id == 'gamesettings' then
        closeMenu()
        nativeSettings, nativeSettingsSeen, nativeSettingsUntil = true, false, GetGameTimer() + 4000
        CreateThread(function()
            Wait(150) -- release our NUI focus before opening the native menu
            if nativeSettings and not IsPauseMenuActive() then ActivateFrontendMenu(nativePause, false, -1) end
        end)
        return { ok = true }
    end
    closeMenu()
    if id ~= 'resume' then
        CreateThread(function()
            Wait(120) -- release our focus before the target application takes its own
            local ok, reason = VantaBridge.Open(id)
            if not ok then notify(reason) end
        end)
    end
    return { ok = true }
end)

RegisterCommand('vanta_menu', function() if menuOpen then closeMenu() else openMenu() end end, false)
RegisterKeyMapping('vanta_menu', T('Quick menu'), 'keyboard', Config.MenuKey)
local cinema, hiddenBeforeCinema = false, false
RegisterCommand('vanta_hud', function()
    if cinema then hiddenBeforeCinema = not hiddenBeforeCinema else manuallyHidden = not manuallyHidden end
end, false)
local function setCinema(on)
    on = on == true
    if on == cinema then return end
    cinema = on
    -- on exit, restore the manual hide state from before (/vanta_hud)
    if cinema then hiddenBeforeCinema = manuallyHidden manuallyHidden = true else manuallyHidden = hiddenBeforeCinema end
    send('cinema', { on = cinema })
end
RegisterCommand('hudcinema', function() setCinema(not cinema) end, false)
RegisterKeyMapping('hudcinema', T('HUD: cinema mode'), 'keyboard', '')
exports('SetCinema', function(value) setCinema(value ~= false) return cinema end)
local profileNames = { T('Driving'), T('On foot'), T('Discreet') }
RegisterCommand('hudprofile', function(_, args)
    local action, slot = tostring(args[1] or 'list'), math.floor(tonumber(args[2]) or 0)
    if action == 'list' then
        for index, name in ipairs(profileNames) do
            print(('[vanta_hud] profile %d (%s): %s'):format(index, name, GetResourceKvpString('vanta_hud:profile:' .. index) and 'saved' or 'empty'))
        end
        notify(T('Profiles: /hudprofile save 1-3 to save, /hudprofile load 1-3 to load.'))
        return
    end
    if slot < 1 or slot > 3 or (action ~= 'save' and action ~= 'load') then notify(T('Usage: /hudprofile save|load 1-3')) return end
    local key = 'vanta_hud:profile:' .. slot
    if action == 'save' then
        SetResourceKvp(key, json.encode(settings))
        notify(T('Profile %d (%s) saved.', slot, profileNames[slot]))
        return
    end
    local ok, saved = pcall(json.decode, GetResourceKvpString(key) or '')
    if not ok or type(saved) ~= 'table' then notify(T('Profile %d is empty: save it first.', slot)) return end
    local candidate = validate(saved)
    constrainLayout(candidate)
    if not persistSettings(candidate) then notify(T('Local settings could not be saved.')) return end
    updateLayout(false)
    scheduleBlipStyle(settings.blipStyle)
    syncInit()
    notify(T('Profile %d (%s) loaded.', slot, profileNames[slot]))
end, false)
RegisterCommand('hudgps', function()
    print(('[vanta_hud] GPS %s: option=%s, interface=%s, point=%s, data=%s'):format(
        GetResourceMetadata(resource, 'version', 0) or '?', tostring(settings.gps), tostring(uiReady and not manuallyHidden and not menuOpen),
        tostring(IsWaypointActive()), json.encode(HudNavigation.Read(true))))
end, false)
RegisterCommand('hudperf', function()
    print(('[vanta_hud] performance diagnostic %s: %s'):format(
        GetResourceMetadata(resource, 'version', 0) or '?', json.encode({
            ready = uiReady, loaded = VantaBridge.ready, nativeRadar = nativeRadarShown,
            customMapReady = HudMapData.IsReady(), poseStream = mapMotionActive,
            vehicle = vehicle ~= 0, menu = menuOpen, fullMap = mapPageOpen,
            footUpdateMs = Config.UpdateMs, vehicleUpdateMs = Config.VehicleUpdateMs,
            blips = HudMapData.Diagnostics()
        })))
end, false)
RegisterCommand('vanta_hud_reset', function()
    if not persistSettings(validate({})) then
        notify(T('Local settings could not be saved.'))
        return
    end
    syncInit() updateLayout(true) scheduleBlipStyle(settings.blipStyle)
    notify(T('HUD settings reset.'))
end, false)
local function acquire(leases, hidden)
    local caller = GetInvokingResource()
    if not caller or type(hidden) ~= 'boolean' then return false end
    leases[caller] = hidden and true or nil
    if leases == fullLeases and hidden then closeMenu() end
    return true
end
exports('SetVisible', function(visible)
    if type(visible) ~= 'boolean' then return false end
    return acquire(fullLeases, not visible)
end)
exports('VantaHudHidden', function(hidden) return acquire(fullLeases, hidden) end)
exports('VantaStatusHidden', function(hidden) return acquire(statusLeases, hidden) end)

local function releaseBelt()
    if beltPed and DoesEntityExist(beltPed) and originalWindscreen ~= nil then
        SetPedConfigFlag(beltPed, 32, originalWindscreen)
    end
    belt, beltPed, originalWindscreen = false, nil, nil
end
local function canBelt(veh, class)
    if veh == 0 then return false end
    local c = class or GetVehicleClass(veh)
    return c ~= 8 and c ~= 13 and c ~= 14 and c ~= 15 and c ~= 16 and c ~= 21
end
RegisterCommand('vanta_seatbelt', function()
    if Config.Seatbelt.mode ~= 'builtin' then return end
    if menuOpen or IsNuiFocused() or IsPauseMenuActive() then return end
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if not canBelt(veh) then return end
    if belt then releaseBelt() else
        belt, beltPed = true, ped
        originalWindscreen = GetPedConfigFlag(ped, 32, true)
        SetPedConfigFlag(ped, 32, false)
    end
    notify(belt and T('Seatbelt fastened.') or T('Seatbelt unfastened.'))
end, false)
if Config.Seatbelt.mode == 'builtin' then
    RegisterKeyMapping('vanta_seatbelt', T('Fasten / unfasten seatbelt'), 'keyboard', Config.SeatbeltKey)
end

local nextBeltRead, beltVehicle, cachedBelt, cachedBeltKnown = 0, 0, false, false
local function readBelt(now)
    if Config.Seatbelt.mode == 'builtin' then return belt, true end
    if vehicle == beltVehicle and now < nextBeltRead and nextBeltRead - now <= 200 then return cachedBelt, cachedBeltKnown end
    beltVehicle, nextBeltRead = vehicle, now + 200
    cachedBelt, cachedBeltKnown = false, false
    if GetResourceState(Config.Seatbelt.resource) ~= 'started' then return false, false end
    local ok, value = pcall(function() return exports[Config.Seatbelt.resource][Config.Seatbelt.export]() end)
    cachedBelt, cachedBeltKnown = ok and value == true, ok
    return cachedBelt, cachedBeltKnown
end

CreateThread(function()
    -- only natives that must run every frame belong here
    while true do
        if nativeRadarShown and scaleformReady then
            BeginScaleformMovieMethod(scaleform, 'SETUP_HEALTH_ARMOUR')
            ScaleformMovieMethodAddParamInt(3)
            EndScaleformMovieMethod()
        end
        if belt then
            DisableControlAction(0, 75, true)
            DisableControlAction(27, 75, true)
        end
        if pauseControlActive and not nativeSettings and not menuOpen and not next(fullLeases) and not IsPauseMenuActive() then
            if uiReady and Config.CustomMap.exclusive then DisableFrontendThisFrame() end
            DisableControlAction(0, 199, true)
            DisableControlAction(0, 200, true)
            if IsDisabledControlJustReleased(0, 199) or IsDisabledControlJustReleased(0, 200) then openMenu() end
        end
        VantaWeapon.Tick(GetGameTimer(), settings.weaponHud ~= false, send)
        Wait((pauseControlActive and not menuOpen or belt or nativeRadarShown or VantaWeapon.armed) and 0 or 100)
    end
end)

CreateThread(function()
    local nextLayout, lastRadarVisible = 0, nil
    local nextVitals, vitalsPed, vitalsVehicle, vitals = 0, 0, 0, nil
    local nextVehicleDetails, detailsVehicle, detailsPed, vehicleDetails = 0, 0, 0, nil
    while true do
        local now = GetGameTimer()
        local loaded = VantaBridge.IsLoaded()
        local paused = IsPauseMenuActive()
        local frameworkMenu = loaded and VantaBridge.MenuOpen()
        -- focus is cached; openMenu rechecks it on the actual key press
        pauseControlActive = Config.ReplacePauseMenu and loaded and not frameworkMenu and not next(fullLeases) and not IsNuiFocused()
        HudFrontendTheme.Update(paused)
        if nativeSettings then
            if paused then nativeSettingsSeen = true
            elseif nativeSettingsSeen or now > nativeSettingsUntil then nativeSettings, nativeSettingsSeen = false, false end
        end
        if loaded and uiReady and Config.CustomMap.exclusive and Config.CustomMap.enabled and not nativeSettings then
            if paused and GetCurrentFrontendMenuVersion() == nativePause then
                SetFrontendActive(false) redirectMap = true redirectUntil = now + 1500
            elseif redirectMap and (now > redirectUntil or frameworkMenu) then redirectMap = false
            elseif redirectMap and not paused and not IsNuiFocused() and not next(fullLeases) then
                nextOpen = 0 openMenu()
                if menuOpen then mapPageOpen = true send('mapview', { open = true }) end
                redirectMap = false
            end
        end
        local ped, player = PlayerPedId(), PlayerId()
        motionPed = ped
        local veh = loaded and GetVehiclePedIsIn(ped, false) or 0
        local dead = loaded and IsEntityDead(ped) or false
        if veh ~= vehicle then vehicleDetails = nil vitals = nil nextBeltRead = 0 end
        if veh ~= vehicle or (beltPed and beltPed ~= ped) or dead then releaseBelt() end
        vehicle = veh
        if menuOpen and (not loaded or frameworkMenu or paused or IsScreenFadedOut()) then closeMenu() end
        local shown = loaded and not manuallyHidden and not next(fullLeases) and not paused and not IsScreenFadedOut() and (not menuOpen or layoutDraft ~= nil)
        local bigmap = loaded and IsBigmapActive()
        if bigmap and shown then SetBigmapActive(false, false) bigmap = false end
        local mapShown = shown and (layoutDraft ~= nil or settings.onFoot or vehicle ~= 0) and not bigmap
        local sample = motionSample
        if not sample or sample.ped ~= ped or sample.vehicle ~= vehicle or now < sample.at or now - sample.at > 150 then sample = nil end
        local pos = loaded and (sample and sample.pos or GetEntityCoords(ped)) or nil
        local customMap = Config.CustomMap.enabled and settings.map3d
        local mapActive = uiReady and loaded and customMap and (mapShown or menuOpen) and not manuallyHidden and not paused and not next(fullLeases)
        HudMapData.SetActive(mapActive)
        mapMotionActive = mapActive and mapShown and not menuOpen
        local nativeRadar = not customMap or not HudMapData.IsReady() or HudMapData.NeedsNativeRadar(pos)
        local radarVisible = loaded and mapShown and nativeRadar
        nativeRadarShown = radarVisible
        if radarVisible ~= lastRadarVisible then DisplayRadar(radarVisible) lastRadarVisible = radarVisible end
        if nativeRadarShown then
            if not scaleform then scaleform = RequestScaleformMovie('minimap') end
            if not scaleformReady then scaleformReady = HasScaleformMovieLoaded(scaleform) end
            if now >= nextRadarZoom or nextRadarZoom - now > 500 then
                nextRadarZoom = now + 500 SetRadarZoomToDistance(Config.Radar.distance)
            end
        end
        local payload = { visible = shown, mapVisible = mapShown, bigmap = bigmap, statusVisible = next(statusLeases) == nil, vehicle = false }
        payload.gps = HudNavigation.Read((shown and mapShown and settings.gps) or mapPageOpen)
        if loaded and (shown or menuOpen) then
            local moving = vehicle ~= 0 and vehicle or ped
            local velocity = sample and sample.velocity or GetEntityVelocity(moving)
            local speed = math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z)
            local heading, hours, minutes = sample and sample.heading or GetEntityHeading(ped), GetClockHours(), GetClockMinutes()
            payload.world = { x = round(pos.x), y = round(pos.y), z = round(pos.z), heading = round(heading), sampledAt = sample and sample.at or now,
                vx = round(velocity.x), vy = round(velocity.y), speed = round(speed),
                hour = hours + minutes / 60.0,
                nativeRadar = not customMap or HudMapData.NeedsNativeRadar(pos), supported = HudMapData.SupportedAt(pos) }
            local location = HudContext.Location(pos)
            if not vitals or ped ~= vitalsPed or vehicle ~= vitalsVehicle or dead ~= vitals.context.dead or now >= nextVitals or nextVitals - now > 200 then
                nextVitals, vitalsPed, vitalsVehicle = now + 200, ped, vehicle
                local maxHealth = math.max(1, GetEntityMaxHealth(ped) - 100)
                local proximity = LocalPlayer.state.proximity
                vitals = { context = HudContext.Read(ped, player, vehicle, proximity or false, dead),
                    health = math.floor(clamp((GetEntityHealth(ped) - 100) / maxHealth * 100, 0, 100)),
                    armour = GetPedArmour(ped), talking = NetworkIsPlayerTalking(player),
                    voice = type(proximity) == 'table' and clamp(proximity.index or 2, 1, 3) or 2 }
            end
            for key, value in pairs(vitals) do payload[key] = value end
            payload.hunger = VantaBridge.needs.hunger
            payload.thirst = VantaBridge.needs.thirst
            payload.street = location.street
            payload.crossStreet = location.crossStreet
            payload.zone = location.zone
            payload.clock = ('%02d:%02d'):format(hours, minutes)
            payload.heading = directions[(math.floor((heading + 22.5) / 45) % 8) + 1]
            if vehicle ~= 0 and DoesEntityExist(vehicle) then
                local gear = GetVehicleCurrentGear(vehicle)
                local forwardSpeed = GetEntitySpeedVector(vehicle, true).y
                if not vehicleDetails or detailsVehicle ~= vehicle or detailsPed ~= ped or now >= nextVehicleDetails or nextVehicleDetails - now > 500 then
                    local class = vehicleDetails and detailsVehicle == vehicle and detailsPed == ped and vehicleDetails.class or GetVehicleClass(vehicle)
                    detailsVehicle, detailsPed, nextVehicleDetails = vehicle, ped, now + 500
                    local burst = 0
                    for wheel = 0, 5 do if IsVehicleTyreBurst(vehicle, wheel, false) then burst = burst + 1 end end
                    vehicleDetails = { class = class, engineOn = GetIsVehicleEngineRunning(vehicle),
                        bodyHealth = math.floor(clamp(GetVehicleBodyHealth(vehicle), 0, 1000)), tyres = burst,
                        engineHealth = math.floor(clamp(GetVehicleEngineHealth(vehicle), -4000, 1000)),
                        fuel = math.floor(clamp(GetVehicleFuelLevel(vehicle), 0, 100)) }
                end
                local seatbeltOn, seatbeltKnown = readBelt(now)
                local class = vehicleDetails.class
                local nautical = class == 14 and settings.nautical
                payload.vehicle = { id = vehicle, class = class, engineOn = vehicleDetails.engineOn,
                    altitude = (class == 15 or class == 16) and math.floor(math.max(0, GetEntityHeightAboveGround(vehicle))) or nil,
                    engineHealth = vehicleDetails.engineHealth,
                    bodyHealth = vehicleDetails.bodyHealth, tyres = vehicleDetails.tyres,
                    unit = nautical and 'KN' or settings.speedUnit == 'mph' and 'MPH' or 'KM/H',
                    speed = math.floor(speed * (nautical and 1.943844 or settings.speedUnit == 'mph' and 2.236936 or 3.6) + 0.5),
                    gear = speed < 0.15 and 'N' or (forwardSpeed < -0.1 and 'R' or tostring(gear)),
                    rpm = round(clamp(GetVehicleCurrentRpm(vehicle), 0, 1)),
                    fuel = vehicleDetails.fuel,
                    belt = seatbeltOn, canBelt = canBelt(vehicle, class) and seatbeltKnown }
            end
        end
        VantaWeapon.allowed = shown and not dead and not menuOpen
        if mapActive and (now >= nextMapSync or nextMapSync - now > 1000) then
            nextMapSync = now + 750
            local markers, markerJson = HudMapData.Blips()
            if markerJson ~= lastMapBlips then lastMapBlips = markerJson send('mapblips', { blips = markers }) end
            local trace = HudNavigation.MapRoute((shown and mapShown and settings.gps) or mapPageOpen)
            if not unchanged(trace, lastMapRoute) then lastMapRoute = trace send('maproute', trace) end
        end
        local sameVehicle = lastPayload and (payload.vehicle == false and lastPayload.vehicle == false
            or type(payload.vehicle) == 'table' and type(lastPayload.vehicle) == 'table'
                and payload.vehicle.id == lastPayload.vehicle.id and payload.vehicle.class == lastPayload.vehicle.class)
        if not sameVehicle or not unchangedHud(payload, lastPayload, mapMotionActive and sample ~= nil) then
            send('state', payload)
        elseif not unchanged(payload.vehicle, lastPayload.vehicle) then
            send('vehicleTelemetry', { vehicle = payload.vehicle })
        end
        lastPayload = payload
        if now >= nextLayout or nextLayout - now > 3000 or lastLayout == '' then
            nextLayout = now + 3000 updateLayout(false)
        end
        Wait(not loaded and 500 or (not shown and not menuOpen) and 500 or (vehicle ~= 0 and Config.VehicleUpdateMs or Config.UpdateMs))
    end
end)

-- pose messages run on their own cadence, independent of the rest
CreateThread(function()
    local previous, previousAt = nil, 0
    while true do
        if mapMotionActive and uiReady then
            local ped, now = motionPed, GetGameTimer()
            local pos, velocity = GetEntityCoords(ped), GetEntityVelocity(vehicle ~= 0 and vehicle or ped)
            local heading, cameraHeading = GetEntityHeading(ped), GetGameplayCamRot(2).z
            motionSample = { at = now, ped = ped, vehicle = vehicle, pos = pos, velocity = velocity, heading = heading }
            local difference = previous and ((cameraHeading - previous.cameraHeading + 180) % 360 - 180) or 0
            local changed = not previous or math.abs(pos.x-previous.x)+math.abs(pos.y-previous.y)+math.abs(pos.z-previous.z)>0.01
                or math.abs(difference)>0.03 or math.abs(heading-previous.heading)>0.03
                or math.abs(previous.yawRate)>0.1 or math.abs(previous.vx-velocity.x)+math.abs(previous.vy-velocity.y)>0.03
            if changed then
                local dt = now > previousAt and (now-previousAt)/1000 or 0
                local pose = { x=pos.x,y=pos.y,z=pos.z,heading=heading,cameraHeading=cameraHeading,
                    vx=velocity.x,vy=velocity.y,sampledAt=now,
                    speed=math.sqrt(velocity.x*velocity.x+velocity.y*velocity.y+velocity.z*velocity.z),
                    yawRate=dt>0 and clamp(difference/dt,-360,360) or 0 }
                send('mapmotion',pose)
                previous, previousAt = pose, now
            end
            Wait(changed and 33 or 66)
        else previous = nil motionSample = nil Wait(250) end
    end
end)

AddEventHandler('onResourceStop', function(name)
    if name ~= resource then fullLeases[name] = nil statusLeases[name] = nil return end
    closeMenu()
    releaseBelt()
    radarLayout(true)
    DisplayRadar(not radarWasHidden)
    if scaleform and HasScaleformMovieLoaded(scaleform) then
        BeginScaleformMovieMethod(scaleform, 'SETUP_HEALTH_ARMOUR')
        ScaleformMovieMethodAddParamInt(0)
        EndScaleformMovieMethod()
        SetScaleformMovieAsNoLongerNeeded(scaleform)
    end
end)
