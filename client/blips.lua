VantaBlips = {}
local owned = {}
local styles = { classic = true, cyan = true, rp = true }
local txd, activeStyle = nil, nil
-- a RuntimeTxd is not reattached after a restart, so the name must be unique
local txdName = ('vanta_blips_%s_%d'):format(GetCurrentResourceName(), GetGameTimer())
local textures = {}
function VantaBlips.SetStyle(value)
    if not styles[value] then return false, 'Unknown style: ' .. tostring(value) end
    if activeStyle == value then return true end
    if not txd then txd = CreateRuntimeTxd(txdName) end
    if not txd or txd == 0 then return false, 'Could not create the texture dictionary: ' .. txdName end
    if not textures[value] then
        local path = 'web/assets/blips/' .. value .. '.png'
        local bytes = LoadResourceFile(GetCurrentResourceName(), path)
        if not bytes or #bytes == 0 then return false, 'Atlas missing from the client package: ' .. path end
        local texture = CreateRuntimeTextureFromImage(txd, value, path)
        if not texture or texture == 0 then return false, 'PNG load refused: ' .. path .. ' (' .. txdName .. ')' end
        if GetRuntimeTextureWidth(texture) ~= 1024 or GetRuntimeTextureHeight(texture) ~= 1024 then
            return false, 'Wrong atlas dimensions: ' .. path
        end
        textures[value] = texture
    end
    -- the native association is a bimap: remove the old link before changing its target
    RemoveReplaceTexture('minimap', 'blips_texturesheet_NG')
    AddReplaceTexture('minimap', 'blips_texturesheet_NG', txdName, value)
    activeStyle = value
    return true
end

local originalColours = {}
-- the native colour multiplies the atlas colour: static POIs are set to white
-- to keep the chosen palette. Players, entities, radius and objective blips are excluded.
local paletteSprites = { 59, 110, 119, 73, 56, 60, 61, 69, 71, 72, 74, 75, 81, 82, 87, 92, 93, 94, 95, 97, 98, 99, 100, 101, 102, 103, 104, 106, 107, 108, 109, 111, 113, 117, 118, 121, 122, 125, 126, 127, 128, 135, 136, 137, 141, 142, 153, 155, 176, 180, 181, 182, 183, 197, 207, 266, 267, 273, 292, 296, 297, 298, 299, 300, 301, 302, 309, 311, 314, 315, 316, 319, 321, 350, 356, 357, 358, 359, 360, 362, 366, 369, 370, 371, 372, 374, 375, 376, 377, 379, 384, 387, 402, 403, 416, 435, 436, 446, 473, 474, 475, 476, 488, 489, 490, 492, 496, 497, 498, 499, 500, 524, 526, 527, 544, 546, 550, 557, 565, 566, 567, 569, 571, 590, 610, 611, 614, 621, 641, 642, 643, 644, 647, 648, 670, 671, 672, 679, 680, 681, 682, 683, 684, 726, 727, 729, 740, 752, 762, 766, 767, 771, 777, 778, 779, 780, 781, 782, 784, 785, 787, 788, 790, 792, 801, 809, 813, 817, 819, 826, 827, 829, 830, 831, 832, 835, 836, 837, 840, 845, 847, 848, 852, 856, 857, 867, 868, 872, 876, 877, 878, 884, 888, 889, 893, 897, 898, 900, 901, 902, 903, 904, 909, 914, 919, 920, 923, 925, 926, 927, 931, 932, 933, 937, 938, 939, 940, 942, 943, 944, 945, 948, 954, 955, 956, 957, 960, 52, 361, 966, 967, 3, 38, 39, 40, 41, 42, 44, 45, 46, 147, 150, 151, 152, 154, 156, 157, 158, 159, 160, 173, 174, 175, 234, 235, 236, 251, 313, 322, 349, 368, 470, 485, 486, 487, 543, 547, 548, 549, 592, 606, 622, 623, 624, 625, 645, 653, 654, 725, 761, 775, 822, 833, 834, 844, 849, 880, 881, 885, 891, 894, 921, 922 }
local paletteLookup = {}
for _, sprite in ipairs(paletteSprites) do paletteLookup[sprite] = true end
-- reuse the map's discovery pass, no second scan
function VantaBlips.Normalize(blip, sprite, kind)
    if not activeStyle or kind ~= 4 or not paletteLookup[sprite] then return end
    local colour = GetBlipColour(blip)
    local saved = originalColours[blip]
    if not saved or saved.sprite ~= sprite or colour ~= 0 then
        originalColours[blip] = { sprite = sprite, colour = colour }
    end
    if colour ~= 0 then SetBlipColour(blip, 0) end
end
function VantaBlips.Forget(blip) originalColours[blip] = nil end
function VantaBlips.PrioritySprites() return paletteSprites end
CreateThread(function()
    if Config.CustomMap.enabled then return end -- The shared scanner owns this work.
    local index = 1
    while true do
        if activeStyle and not Config.CustomMap.enabled then
            for _ = 1, 16 do
                local sprite = paletteSprites[index]
                local blip = GetFirstBlipInfoId(sprite)
                local count = 0
                while blip ~= 0 and DoesBlipExist(blip) and count < 64 do
                    VantaBlips.Normalize(blip, sprite, GetBlipInfoIdType(blip))
                    count = count + 1
                    local nextBlip = GetNextBlipInfoId(sprite)
                    if nextBlip == blip then break end
                    blip = nextBlip
                end
                index = index % #paletteSprites + 1
            end
            for blip in pairs(originalColours) do
                if not DoesBlipExist(blip) then originalColours[blip] = nil end
            end
        end
        Wait(Config.CustomMap.enabled and 2000 or 500)
    end
end)
-- native stand-ins for Vanta icons when minimap.gfx is not streamed (same as shared/blip_info.lua)
local fallbackSprite = { [966] = 356, [967] = 52 }
exports('GetBlipSprite', function(kind)
    return Config.Blips.slots[kind]
end)
CreateThread(function()
    if not Config.Blips.enabled then return end
    while not VantaBridge.IsLoaded() do Wait(1000) end
    for _, point in ipairs(Config.Blips.locations or {}) do
        local sprite = Config.Blips.slots[point.kind]
        if sprite and point.coords then
            local b = AddBlipForCoord(point.coords.x, point.coords.y, point.coords.z)
            SetBlipSprite(b, sprite)
            local icon = GetBlipSprite(b) ~= sprite and fallbackSprite[sprite] and sprite or nil
            if icon then SetBlipSprite(b, fallbackSprite[sprite]) end
            SetBlipColour(b, point.colour or 0)
            SetBlipScale(b, point.scale or 0.7)
            SetBlipAsShortRange(b, true)
            BeginTextCommandSetBlipName('STRING')
            AddTextComponentSubstringPlayerName(point.name or point.kind)
            EndTextCommandSetBlipName(b)
            TriggerEvent('vanta_hud:blipInfo', b, { label = tostring(point.name or point.kind), icon = icon })
            owned[#owned + 1] = b
        end
    end
end)
AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    for blip, saved in pairs(originalColours) do
        if DoesBlipExist(blip) and GetBlipSprite(blip) == saved.sprite and GetBlipColour(blip) == 0 then
            SetBlipColour(blip, saved.colour)
        end
    end
    if activeStyle then RemoveReplaceTexture('minimap', 'blips_texturesheet_NG') end
    for _, b in ipairs(owned) do if DoesBlipExist(b) then RemoveBlip(b) end end
end)
