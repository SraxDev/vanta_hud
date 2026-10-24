VantaWeapon = { armed = false, allowed = false }

local UNARMED = joaat('WEAPON_UNARMED') & 0xFFFFFFFF
local READ_ARMED_MS, READ_IDLE_MS = 66, 100

-- GTA weapon group -> fallback silhouette
local kinds = {
    [416676503] = 'pistol', [690389602] = 'pistol', [3337201093] = 'smg', [970310034] = 'rifle',
    [1159398588] = 'mg', [860033945] = 'shotgun', [3082541095] = 'sniper', [2725924767] = 'heavy',
    [2685387236] = 'melee', [1548507267] = 'thrown', [1595662460] = 'thrown'
}

local lastSent, nextRead = nil, 0

local function readCurrent()
    local ped = PlayerPedId()
    local hash = GetSelectedPedWeapon(ped) & 0xFFFFFFFF
    if hash == UNARMED then return nil end

    local clipSize = GetWeaponClipSize(hash) or 0
    local hasClip, clip = GetAmmoInClip(ped, hash)
    local total = GetAmmoInPedWeapon(ped, hash) or 0
    clip = hasClip and clip or 0
    local firearm = clipSize > 0

    return {
        name = VantaBridge.WeaponLabel(hash) or T('WEAPON'),
        icon = VantaBridge.WeaponName(hash),
        kind = kinds[GetWeapontypeGroup(hash) & 0xFFFFFFFF] or 'pistol',
        clipSize = clipSize,
        clip = firearm and clip or nil,
        reserve = firearm and math.max(total - clip, 0) or total,
        melee = not firearm and total <= 0,
        reloading = firearm and IsPedReloading(ped) or false
    }
end

function VantaWeapon.Reset()
    lastSent = nil
end

function VantaWeapon.Tick(now, enabled, send)
    -- every frame, before the rate limit below
    if VantaWeapon.armed and enabled then
        DisplayAmmoThisFrame(false)
        HideHudComponentThisFrame(2)
    end

    if now < nextRead and nextRead - now < 500 then return end

    local info = VantaWeapon.allowed and enabled and readCurrent() or nil
    VantaWeapon.armed = info ~= nil and not info.melee
    nextRead = now + (info and READ_ARMED_MS or READ_IDLE_MS)

    local encoded = info and json.encode(info) or ''
    if encoded ~= lastSent then
        lastSent = encoded
        send('weapon', info or { hidden = true })
    end
end
