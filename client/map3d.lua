HudMapData = {}
local active, ready, spriteCursor, firstSweep = false, false, 1, true
local handles, count, revision = {}, 0, 0
local snapshot, snapshotRevision, colourCache = {}, -1, {}
local hiddenDisplay = { [0] = true, [1] = true, [7] = true }
-- names, zone sizes and Vanta icons reported by shared/blip_info.lua: no native reads them back
local extras = {}
AddEventHandler('vanta_hud:blipInfo', function(blip, info)
    if type(blip) ~= 'number' then return end
    if info == false then extras[blip] = nil return end
    if type(info) ~= 'table' then return end
    local function size(n) return type(n) == 'number' and n > 0 and math.min(n, 5000) or nil end
    local extra = extras[blip] or {}
    local radius, width, height = size(info.radius), size(info.width), size(info.height)
    if radius then extra.radius = radius
    elseif width and height then extra.width, extra.height = width, height end
    if type(info.label) == 'string' then extra.label = info.label:sub(1, 60) end
    if info.icon == false then extra.icon = nil
    elseif math.type(info.icon) == 'integer' and info.icon >= 0 and info.icon <= 1023 then extra.icon = info.icon end
    extras[blip] = extra
end)
-- earliest deadline first
local due = {}
local function push(record)
    local index = #due + 1
    while index > 1 do
        local parent = math.floor(index / 2)
        if due[parent].nextAt <= record.nextAt then break end
        due[index] = due[parent] index = parent
    end
    due[index] = record
end
local function pop()
    local first, last = due[1], table.remove(due)
    if #due > 0 then
        local index = 1
        while index * 2 <= #due do
            local child = index * 2
            if child < #due and due[child + 1].nextAt < due[child].nextAt then child = child + 1 end
            if last.nextAt <= due[child].nextAt then break end
            due[index] = due[child] index = child
        end
        due[index] = last
    end
    return first
end
local spriteOrder, added = {}, {}
for _, sprite in ipairs(VantaBlips.PrioritySprites()) do
    if not added[sprite] then spriteOrder[#spriteOrder + 1] = sprite added[sprite] = true end
end
for sprite = 0, 1023 do
    if not added[sprite] then spriteOrder[#spriteOrder + 1] = sprite end
end

function HudMapData.SetActive(value) active = value == true end
function HudMapData.SetReady(value) ready = value == true end
function HudMapData.IsReady() return ready end
function HudMapData.Diagnostics() return { active = active, known = count, queued = #due } end
function HudMapData.SupportedAt(pos)
    if not pos or pos.x > 3500 and pos.y < -3500 then return false end
    return pos.x >= -5500 and pos.x <= 5500 and pos.y >= -5000 and pos.y <= 8500
end

local function same(a, b)
    if not a or not b then return a == b end
    for key, value in pairs(a) do
        if key == 'colour' then
            for i = 1, 3 do if value[i] ~= b.colour[i] then return false end end
        elseif value ~= b[key] then return false end
    end
    for key in pairs(b) do if a[key] == nil then return false end end
    return true
end
local function refresh(blip, record, now)
    if not DoesBlipExist(blip) then
        handles[blip] = nil count = count - 1 VantaBlips.Forget(blip) extras[blip] = nil
        if record.data then revision = revision + 1 end
        return
    end
    local kind = GetBlipInfoIdType(blip)
    record.kind = kind
    record.nextAt = now + (kind == 4 and 2000 or 250)
    local display, alpha = GetBlipInfoIdDisplay(blip), GetBlipAlpha(blip)
    if hiddenDisplay[display] or alpha <= 0 then
        if record.data then record.data = nil revision = revision + 1 end
        return
    end
    local pos, sprite = GetBlipInfoIdCoord(blip), GetBlipSprite(blip)
    VantaBlips.Normalize(blip, sprite, kind)
    if kind == 4 and (not record.streetPos or #(pos - record.streetPos) > 3 or record.sprite ~= sprite) then
        record.streetPos = pos
        record.street = GetStreetNameFromHashKey(GetStreetNameAtCoord(pos.x, pos.y, pos.z))
    end
    record.sprite = sprite
    local colourId = GetBlipHudColour(blip)
    local colour = colourCache[colourId]
    if not colour or now >= colour.untilAt or colour.untilAt - now > 1000 then
        local r, g, b = GetHudColour(colourId)
        colour = { rgb = { r or 255, g or 255, b or 255 }, untilAt = now + 1000 }
        colourCache[colourId] = colour
    end
    local function round(n) return math.floor(n * 100 + 0.5) / 100 end
    local item = { id = blip, sprite = sprite, x = round(pos.x), y = round(pos.y), z = round(pos.z),
        kind = kind, alpha = alpha, display = display, street = kind == 4 and record.street or nil,
        colour = colour.rgb, mini = display ~= 3 and display ~= 4, full = display ~= 5 and display ~= 9,
        selectable = display == 2 or display == 3 or display == 4 or display == 6, short = IsBlipShortRange(blip) }
    local extra = extras[blip]
    if extra then
        item.radius, item.width, item.height = extra.radius, extra.width, extra.height
        item.label, item.icon = extra.label, extra.icon
        if extra.width then item.rotation = GetBlipRotation(blip) end
    end
    if not same(record.data, item) or (record.data and record.data.street ~= item.street) then
        record.data = item revision = revision + 1
    end
end

CreateThread(function()
    local nextDiscovery, previousNow = 0, nil
    while true do
        if active and Config.CustomMap.enabled then
            local now = GetGameTimer()
            if previousNow and now < previousNow then
                due = {}
                for _, record in pairs(handles) do record.nextAt = now push(record) end
                nextDiscovery = 0
            end
            previousNow = now
            if now >= nextDiscovery or nextDiscovery - now > 250 then
                nextDiscovery = now + (firstSweep and 100 or 250)
                for _ = 1, 32 do
                    local sprite, visited = spriteOrder[spriteCursor], 0
                    local blip = GetFirstBlipInfoId(sprite)
                    while blip ~= 0 and DoesBlipExist(blip) and visited < 128 do
                        if not handles[blip] and count < Config.CustomMap.maxBlips then
                            local record = { blip = blip, nextAt = now }
                            handles[blip] = record count = count + 1 push(record)
                        end
                        visited = visited + 1
                        local nextBlip = GetNextBlipInfoId(sprite)
                        if nextBlip == blip then break end
                        blip = nextBlip
                    end
                    spriteCursor = spriteCursor + 1
                    if spriteCursor > #spriteOrder then spriteCursor = 1 firstSweep = false end
                end
            end
            -- one queue entry per blip, at most 48 native refreshes per pass
            local budget = 48
            while due[1] and due[1].nextAt <= now and budget > 0 do
                local record = pop()
                budget = budget - 1
                if handles[record.blip] == record then
                    refresh(record.blip, record, now)
                    if handles[record.blip] == record then push(record) end
                end
            end
        end
        Wait(active and 100 or 500)
    end
end)

function HudMapData.Blips()
    if snapshotRevision ~= revision then
        snapshot = {}
        for _, record in pairs(handles) do if record.data then snapshot[#snapshot + 1] = record.data end end
        table.sort(snapshot, function(a, b) return a.id < b.id end)
        snapshotRevision = revision
    end
    -- the second return value is a change token, saves one more JSON encode
    return snapshot, tostring(snapshotRevision)
end
function HudMapData.NeedsNativeRadar(pos) return not HudMapData.SupportedAt(pos) end
