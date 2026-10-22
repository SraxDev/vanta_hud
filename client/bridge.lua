VantaBridge = { needs = {}, economy = nil, ready = false }
local nextLoadedCheck = 0

function VantaBridge.Percent(value)
    value = tonumber(value)
    if not value or value ~= value then return nil end
    return math.floor(math.max(0, math.min(100, value)) + 0.5)
end

-- result cached for 500 ms
function VantaBridge.IsLoaded()
    local now = GetGameTimer()
    if now < nextLoadedCheck and nextLoadedCheck - now <= 500 then return VantaBridge.ready end
    nextLoadedCheck = now + 500
    VantaBridge.ready = NetworkIsPlayerActive(PlayerId()) and VantaFramework.Loaded()
    return VantaBridge.ready
end

-- keeps the quick menu from opening over a framework menu (ESX adapter only)
function VantaBridge.MenuOpen()
    return VantaFramework.MenuOpen()
end

function VantaBridge.Economy()
    return VantaBridge.economy
end

-- hashes are normalised to unsigned 32 bits
-- icons in web/weapons come from ox_inventory (see THIRD_PARTY.md)
local ICON_NAMES = { 'WEAPON_ACIDPACKAGE','WEAPON_ADVANCEDRIFLE','WEAPON_APPISTOL','WEAPON_ASSAULTRIFLE','WEAPON_ASSAULTRIFLE_MK2','WEAPON_ASSAULTSHOTGUN','WEAPON_ASSAULTSMG','WEAPON_AUTOSHOTGUN','WEAPON_BALL','WEAPON_BAT','WEAPON_BATTLEAXE','WEAPON_BOTTLE','WEAPON_BREAD','WEAPON_BRIEFCASE','WEAPON_BRIEFCASE_02','WEAPON_BULLPUPRIFLE','WEAPON_BULLPUPRIFLE_MK2','WEAPON_BULLPUPSHOTGUN','WEAPON_BZGAS','WEAPON_CANDYCANE','WEAPON_CARBINERIFLE','WEAPON_CARBINERIFLE_MK2','WEAPON_CERAMICPISTOL','WEAPON_COMBATMG','WEAPON_COMBATMG_MK2','WEAPON_COMBATPDW','WEAPON_COMBATPISTOL','WEAPON_COMBATSHOTGUN','WEAPON_COMPACTLAUNCHER','WEAPON_COMPACTRIFLE','WEAPON_CROWBAR','WEAPON_DAGGER','WEAPON_DBSHOTGUN','WEAPON_DIGISCANNER','WEAPON_DOUBLEACTION','WEAPON_EMPLAUNCHER','WEAPON_FERTILIZERCAN','WEAPON_FIREEXTINGUISHER','WEAPON_FIREWORK','WEAPON_FLARE','WEAPON_FLAREGUN','WEAPON_FLASHLIGHT','WEAPON_GADGETPISTOL','WEAPON_GARBAGEBAG','WEAPON_GAS','WEAPON_GOLFCLUB','WEAPON_GRENADE','WEAPON_GRENADELAUNCHER','WEAPON_GRENADELAUNCHER_SMOKE','WEAPON_GUSENBERG','WEAPON_HAMMER','WEAPON_HANDCUFFS','WEAPON_HATCHET','WEAPON_HAZARDCAN','WEAPON_HEAVYPISTOL','WEAPON_HEAVYRIFLE','WEAPON_HEAVYSHOTGUN','WEAPON_HEAVYSNIPER','WEAPON_HEAVYSNIPER_MK2','WEAPON_HOMINGLAUNCHER','WEAPON_KNIFE','WEAPON_KNUCKLE','WEAPON_MACHETE','WEAPON_MACHINEPISTOL','WEAPON_MARKSMANPISTOL','WEAPON_MARKSMANRIFLE','WEAPON_MARKSMANRIFLE_MK2','WEAPON_METALDETECTOR','WEAPON_MG','WEAPON_MICROSMG','WEAPON_MILITARYRIFLE','WEAPON_MINIGUN','WEAPON_MINISMG','WEAPON_MOLOTOV','WEAPON_MUSKET','WEAPON_NAVYREVOLVER','WEAPON_NIGHTSTICK','WEAPON_PETROLCAN','WEAPON_PIPEBOMB','WEAPON_PISTOL','WEAPON_PISTOL50','WEAPON_PISTOLXM3','WEAPON_PISTOL_MK2','WEAPON_POOLCUE','WEAPON_PRECISIONRIFLE','WEAPON_PROXMINE','WEAPON_PUMPSHOTGUN','WEAPON_PUMPSHOTGUN_MK2','WEAPON_RAILGUN','WEAPON_RAILGUNXM3','WEAPON_RAYCARBINE','WEAPON_RAYMINIGUN','WEAPON_RAYPISTOL','WEAPON_REVOLVER','WEAPON_REVOLVER_MK2','WEAPON_RPG','WEAPON_SAWNOFFSHOTGUN','WEAPON_SMG','WEAPON_SMG_MK2','WEAPON_SMOKEGRENADE','WEAPON_SNIPERRIFLE','WEAPON_SNOWBALL','WEAPON_SNSPISTOL','WEAPON_SNSPISTOL_MK2','WEAPON_SPECIALCARBINE','WEAPON_SPECIALCARBINE_MK2','WEAPON_STICKYBOMB','WEAPON_STONE_HATCHET','WEAPON_STUNGUN','WEAPON_SWITCHBLADE','WEAPON_TECPISTOL','WEAPON_VINTAGEPISTOL','WEAPON_WRENCH' }
local LABELS = {
    WEAPON_ACIDPACKAGE = 'Acid Package',
    WEAPON_ADVANCEDRIFLE = 'Advanced Rifle',
    WEAPON_APPISTOL = 'AP Pistol',
    WEAPON_ASSAULTRIFLE = 'Assault Rifle',
    WEAPON_ASSAULTRIFLE_MK2 = 'Assault Rifle Mk II',
    WEAPON_ASSAULTSHOTGUN = 'Assault Shotgun',
    WEAPON_ASSAULTSMG = 'Assault SMG',
    WEAPON_AUTOSHOTGUN = 'Sweeper Shotgun',
    WEAPON_BALL = 'Ball',
    WEAPON_BAT = 'Baseball Bat',
    WEAPON_BATTLEAXE = 'Battle Axe',
    WEAPON_BOTTLE = 'Broken Bottle',
    WEAPON_BREAD = 'Baguette',
    WEAPON_BRIEFCASE = 'Briefcase',
    WEAPON_BRIEFCASE_02 = 'Briefcase',
    WEAPON_BULLPUPRIFLE = 'Bullpup Rifle',
    WEAPON_BULLPUPRIFLE_MK2 = 'Bullpup Rifle Mk II',
    WEAPON_BULLPUPSHOTGUN = 'Bullpup Shotgun',
    WEAPON_BZGAS = 'BZ Gas',
    WEAPON_CANDYCANE = 'Candy Cane',
    WEAPON_CARBINERIFLE = 'Carbine Rifle',
    WEAPON_CARBINERIFLE_MK2 = 'Carbine Rifle Mk II',
    WEAPON_CERAMICPISTOL = 'Ceramic Pistol',
    WEAPON_COMBATMG = 'Combat MG',
    WEAPON_COMBATMG_MK2 = 'Combat MG Mk II',
    WEAPON_COMBATPDW = 'Combat PDW',
    WEAPON_COMBATPISTOL = 'Combat Pistol',
    WEAPON_COMBATSHOTGUN = 'Combat Shotgun',
    WEAPON_COMPACTLAUNCHER = 'Compact Grenade Launcher',
    WEAPON_COMPACTRIFLE = 'Compact Rifle',
    WEAPON_CROWBAR = 'Crowbar',
    WEAPON_DAGGER = 'Antique Cavalry Dagger',
    WEAPON_DBSHOTGUN = 'Double Barrel Shotgun',
    WEAPON_DIGISCANNER = 'Digital Scanner',
    WEAPON_DOUBLEACTION = 'Double-Action Revolver',
    WEAPON_EMPLAUNCHER = 'Compact EMP Launcher',
    WEAPON_FERTILIZERCAN = 'Fertilizer Can',
    WEAPON_FIREEXTINGUISHER = 'Fire Extinguisher',
    WEAPON_FIREWORK = 'Firework Launcher',
    WEAPON_FLARE = 'Flare',
    WEAPON_FLAREGUN = 'Flare Gun',
    WEAPON_FLASHLIGHT = 'Flashlight',
    WEAPON_GADGETPISTOL = 'Perico Pistol',
    WEAPON_GARBAGEBAG = 'Garbage Bag',
    WEAPON_GAS = 'Tear Gas',
    WEAPON_GOLFCLUB = 'Golf Club',
    WEAPON_GRENADE = 'Grenade',
    WEAPON_GRENADELAUNCHER = 'Grenade Launcher',
    WEAPON_GRENADELAUNCHER_SMOKE = 'Smoke Grenade Launcher',
    WEAPON_GUSENBERG = 'Gusenberg Sweeper',
    WEAPON_HAMMER = 'Hammer',
    WEAPON_HANDCUFFS = 'Handcuffs',
    WEAPON_HATCHET = 'Hatchet',
    WEAPON_HAZARDCAN = 'Hazardous Jerry Can',
    WEAPON_HEAVYPISTOL = 'Heavy Pistol',
    WEAPON_HEAVYRIFLE = 'Heavy Rifle',
    WEAPON_HEAVYSHOTGUN = 'Heavy Shotgun',
    WEAPON_HEAVYSNIPER = 'Heavy Sniper',
    WEAPON_HEAVYSNIPER_MK2 = 'Heavy Sniper Mk II',
    WEAPON_HOMINGLAUNCHER = 'Homing Launcher',
    WEAPON_KNIFE = 'Knife',
    WEAPON_KNUCKLE = 'Brass Knuckles',
    WEAPON_MACHETE = 'Machete',
    WEAPON_MACHINEPISTOL = 'Machine Pistol',
    WEAPON_MARKSMANPISTOL = 'Marksman Pistol',
    WEAPON_MARKSMANRIFLE = 'Marksman Rifle',
    WEAPON_MARKSMANRIFLE_MK2 = 'Marksman Rifle Mk II',
    WEAPON_METALDETECTOR = 'Metal Detector',
    WEAPON_MG = 'MG',
    WEAPON_MICROSMG = 'Micro SMG',
    WEAPON_MILITARYRIFLE = 'Military Rifle',
    WEAPON_MINIGUN = 'Minigun',
    WEAPON_MINISMG = 'Mini SMG',
    WEAPON_MOLOTOV = 'Molotov',
    WEAPON_MUSKET = 'Musket',
    WEAPON_NAVYREVOLVER = 'Navy Revolver',
    WEAPON_NIGHTSTICK = 'Nightstick',
    WEAPON_PETROLCAN = 'Jerry Can',
    WEAPON_PIPEBOMB = 'Pipe Bomb',
    WEAPON_PISTOL = 'Pistol',
    WEAPON_PISTOL50 = 'Pistol .50',
    WEAPON_PISTOLXM3 = 'Pistol XM3',
    WEAPON_PISTOL_MK2 = 'Pistol Mk II',
    WEAPON_POOLCUE = 'Pool Cue',
    WEAPON_PRECISIONRIFLE = 'Precision Rifle',
    WEAPON_PROXMINE = 'Proximity Mine',
    WEAPON_PUMPSHOTGUN = 'Pump Shotgun',
    WEAPON_PUMPSHOTGUN_MK2 = 'Pump Shotgun Mk II',
    WEAPON_RAILGUN = 'Railgun',
    WEAPON_RAILGUNXM3 = 'Railgun XM3',
    WEAPON_RAYCARBINE = 'Unholy Hellbringer',
    WEAPON_RAYMINIGUN = 'Widowmaker',
    WEAPON_RAYPISTOL = 'Up-n-Atomizer',
    WEAPON_REVOLVER = 'Heavy Revolver',
    WEAPON_REVOLVER_MK2 = 'Heavy Revolver Mk II',
    WEAPON_RPG = 'RPG',
    WEAPON_SAWNOFFSHOTGUN = 'Sawed-Off Shotgun',
    WEAPON_SMG = 'SMG',
    WEAPON_SMG_MK2 = 'SMG Mk II',
    WEAPON_SMOKEGRENADE = 'Smoke Grenade',
    WEAPON_SNIPERRIFLE = 'Sniper Rifle',
    WEAPON_SNOWBALL = 'Snowball',
    WEAPON_SNSPISTOL = 'SNS Pistol',
    WEAPON_SNSPISTOL_MK2 = 'SNS Pistol Mk II',
    WEAPON_SPECIALCARBINE = 'Special Carbine',
    WEAPON_SPECIALCARBINE_MK2 = 'Special Carbine Mk II',
    WEAPON_STICKYBOMB = 'Sticky Bomb',
    WEAPON_STONE_HATCHET = 'Stone Hatchet',
    WEAPON_STUNGUN = 'Stun Gun',
    WEAPON_SWITCHBLADE = 'Switchblade',
    WEAPON_TECPISTOL = 'Tactical SMG',
    WEAPON_VINTAGEPISTOL = 'Vintage Pistol',
    WEAPON_WRENCH = 'Pipe Wrench'
}
local weaponLabels, weaponNames

local function indexWeapons()
    if weaponNames then return end
    weaponLabels, weaponNames = {}, {}
    for _, name in ipairs(ICON_NAMES) do
        local key = joaat(name) & 0xFFFFFFFF
        weaponNames[key] = name
        weaponLabels[key] = LABELS[name] and T(LABELS[name])
    end
    for name, label in pairs(Config.WeaponLabels or {}) do
        if type(name) == 'string' and type(label) == 'string' then
            local key = joaat(name) & 0xFFFFFFFF
            weaponLabels[key] = label
            weaponNames[key] = weaponNames[key] or name
        end
    end
end

function VantaBridge.WeaponLabel(hash)
    indexWeapons()
    return weaponLabels[hash & 0xFFFFFFFF]
end

function VantaBridge.WeaponName(hash)
    indexWeapons()
    return weaponNames[hash & 0xFFFFFFFF]
end

function VantaBridge.Available(id)
    local integration = Config.Integrations[id]
    return integration ~= nil and GetResourceState(integration.resource) == 'started'
end

function VantaBridge.Open(id)
    local integration = Config.Integrations[id]
    if not integration or not VantaBridge.Available(id) then return false, T('Resource unavailable.') end
    -- the export comes from the config, never from the UI
    local ok, result = pcall(function() return exports[integration.resource][integration.export]() end)
    if not ok then
        print(('[vanta_hud] could not open %s: %s'):format(id, result))
        return false, T('Could not open this application.')
    end
    if result == false then return false, T('Action currently unavailable.') end
    return true
end

-- percentages, nil hides the gauge
exports('SetNeeds', function(hunger, thirst)
    VantaBridge.needs.hunger = VantaBridge.Percent(hunger)
    VantaBridge.needs.thirst = VantaBridge.Percent(thirst)
end)

-- SetEconomy({ cash, bank, job, grade }), nil hides the block
function VantaBridge.SetEconomy(data)
    if type(data) ~= 'table' then VantaBridge.economy = nil if VantaBridge.onEconomy then VantaBridge.onEconomy() end return end
    local cash, bank = tonumber(data.cash), tonumber(data.bank)
    VantaBridge.economy = {
        cash = cash and math.floor(cash) or nil, bank = bank and math.floor(bank) or nil,
        job = tostring(data.job or ''):sub(1, 40), grade = tostring(data.grade or ''):sub(1, 40)
    }
    if VantaBridge.onEconomy then VantaBridge.onEconomy() end
end
