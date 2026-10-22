HudContext = {}
local effortUntil, lastPed = 0, 0
local location, nextLocation, lastPosition = {}, 0, nil
local microphoneMuted, microphoneOwner = nil, nil
local nextVoiceConnection, voiceConnected = 0, false

exports('SetMicrophoneMuted', function(value)
    if value ~= nil and type(value) ~= 'boolean' then return false end
    microphoneMuted = value
    microphoneOwner = value ~= nil and GetInvokingResource() or nil
    return true
end)
AddEventHandler('onResourceStop', function(name)
    if name == microphoneOwner then microphoneMuted, microphoneOwner = nil, nil end
end)

function HudContext.Location(pos)
    local now = GetGameTimer()
    if now >= nextLocation or nextLocation - now > 1000 then
        nextLocation = now + 500
        if lastPosition and #(pos - lastPosition) < 3.0 then return location end
        lastPosition = pos
        local street, cross = GetStreetNameAtCoord(pos.x, pos.y, pos.z)
        local zone = GetLabelText(GetNameOfZone(pos.x, pos.y, pos.z))
        location = { street = GetStreetNameFromHashKey(street),
            crossStreet = cross ~= 0 and GetStreetNameFromHashKey(cross) or '',
            zone = zone ~= 'NULL' and zone or '' }
    end
    return location
end

function HudContext.Read(ped, player, vehicle, proximity, dead)
    local now = GetGameTimer()
    if dead == nil then dead = IsEntityDead(ped) end
    if lastPed ~= ped or dead then effortUntil = 0 lastPed = ped end
    local underwater = IsPedSwimmingUnderWater(ped)
    local effort = not dead and not underwater and (IsPedSprinting(ped)
        or vehicle ~= 0 and GetVehicleClass(vehicle) == 13 and GetEntitySpeed(vehicle) > 1.5)
    if effort then effortUntil = now + Config.Context.recoveryMs end
    if now >= nextVoiceConnection or nextVoiceConnection - now > 1000 then
        nextVoiceConnection = now + 1000 voiceConnected = MumbleIsConnected()
    end
    local out = { dead = dead, underwater = underwater,
        radio = LocalPlayer.state.radioActive == true,
        radioChannel = tonumber(LocalPlayer.state.radioChannel),
        voiceConnected = voiceConnected, micMuted = microphoneMuted }
    if proximity == nil then proximity = LocalPlayer.state.proximity end
    if type(proximity) == 'table' then
        out.voiceDistance = tonumber(proximity.distance)
    end
    if underwater and not dead then
        local seconds = GetPlayerUnderwaterTimeRemaining(player)
        if type(seconds) == 'number' and seconds == seconds then
            out.oxygen = math.max(0, math.floor(seconds * 10) / 10)
            out.oxygenScale = Config.Context.oxygenScaleSeconds
        end
    elseif effort or now < effortUntil then
        local stamina = GetPlayerSprintStaminaRemaining(player)
        if type(stamina) == 'number' and stamina == stamina then
            out.stamina = math.max(0, math.min(100, math.floor(stamina + 0.5)))
        end
    end
    return out
end
