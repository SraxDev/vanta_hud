-- Add `client_script '@vanta_hud/shared/blip_info.lua'` (before your own client scripts) to a
-- resource that creates blips. GTA has no native to read a blip's name or a zone's size back,
-- so this tells vanta_hud when the blip is made. Harmless when vanta_hud is not running.
local native = {
    radius = AddBlipForRadius, area = AddBlipForArea, sprite = SetBlipSprite, remove = RemoveBlip,
    beginName = BeginTextCommandSetBlipName, endName = EndTextCommandSetBlipName,
    addString = AddTextComponentString, addPlayerName = AddTextComponentSubstringPlayerName,
}
-- Vanta icons (fishing, merchant) only exist with vanta_hud's minimap.gfx streamed.
-- Without it the game turns them into a plain dot, so show these natives instead.
local fallback = { [966] = 356, [967] = 52 }
local iconed, pendingName = {}, nil

local function report(blip, info) TriggerEvent('vanta_hud:blipInfo', blip, info) end

function AddBlipForRadius(x, y, z, radius)
    local blip = native.radius(x, y, z, radius)
    report(blip, { radius = type(x) == 'vector3' and y or radius })
    return blip
end

function AddBlipForArea(x, y, z, width, height)
    local blip = native.area(x, y, z, width, height)
    if type(x) == 'vector3' then width, height = y, z end
    report(blip, { width = width, height = height })
    return blip
end

function SetBlipSprite(blip, sprite)
    native.sprite(blip, sprite)
    if fallback[sprite] and GetBlipSprite(blip) ~= sprite then
        native.sprite(blip, fallback[sprite])
        iconed[blip] = true
        report(blip, { icon = sprite })
    elseif iconed[blip] then
        iconed[blip] = nil
        report(blip, { icon = false })
    end
end

function RemoveBlip(blip)
    iconed[blip] = nil
    report(blip, false)
    return native.remove(blip)
end

function BeginTextCommandSetBlipName(label)
    pendingName = label == 'STRING' and '' or GetLabelText(label)
    return native.beginName(label)
end

function AddTextComponentString(text)
    if pendingName then pendingName = pendingName .. tostring(text) end
    return native.addString(text)
end

function AddTextComponentSubstringPlayerName(text)
    if pendingName then pendingName = pendingName .. tostring(text) end
    return native.addPlayerName(text)
end

function EndTextCommandSetBlipName(blip)
    if pendingName and pendingName ~= '' then report(blip, { label = pendingName }) end
    pendingName = nil
    return native.endName(blip)
end
