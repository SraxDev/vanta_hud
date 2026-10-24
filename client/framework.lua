VantaFramework = { name = 'standalone' }
local adapter

local percent = VantaBridge.Percent
local function pushEconomy(cash, bank, job, grade)
    VantaBridge.SetEconomy({ cash = cash, bank = bank, job = job, grade = grade })
end

local esx = { resource = 'es_extended' }
do
    local ESX, nextTry, hudMode = nil, 0, nil
    local function object()
        if GetResourceState('es_extended') ~= 'started' then ESX = nil return nil end
        if not ESX and GetGameTimer() >= nextTry then
            nextTry = GetGameTimer() + 2000
            local ok, obj = pcall(function() return exports['es_extended']:getSharedObject() end)
            if ok then ESX = obj end
        end
        return ESX
    end
    local function ingest(list)
        if type(list) ~= 'table' then return end
        for _, status in pairs(list) do
            if type(status) == 'table' and (status.name == 'hunger' or status.name == 'thirst') then
                VantaBridge.needs[status.name] = percent(status.percent or ((tonumber(status.val) or 0) / 1000000 * 100))
            end
        end
    end
    -- both run from the HUD loop: a stale object after an es_extended restart must not kill it
    function esx.loaded()
        local obj = object()
        if not obj then return false end
        local ok, loaded = pcall(obj.IsPlayerLoaded)
        if not ok then ESX = nil end
        return ok and loaded == true
    end
    function esx.menuOpen()
        local obj = object()
        if not obj or not obj.UI or not obj.UI.Menu then return false end
        local ok, menus = pcall(obj.UI.Menu.GetOpenedMenus)
        return ok and type(menus) == 'table' and next(menus) ~= nil
    end
    function esx.refresh()
        local obj = object()
        if not obj then return end
        local ok, data = pcall(obj.GetPlayerData)
        if not ok or type(data) ~= 'table' then return end
        local cash, bank
        for _, account in pairs(data.accounts or {}) do
            if account.name == 'money' then cash = account.money end
            if account.name == 'bank' then bank = account.money end
        end
        local job = type(data.job) == 'table' and data.job or {}
        pushEconomy(cash or data.money, bank, job.label or job.name, job.grade_label)
    end
    function esx.poll()
        esx.refresh()
        if GetResourceState('esx_status') == 'started' then TriggerEvent('esx_status:getAllStatus', ingest) end
    end
    function esx.hideOwn()
        if GetResourceState('esx_hud') == 'started' then
            local ok, accepted = pcall(function() return exports['esx_hud']:VantaHudHidden(true) end)
            if ok and accepted == true then hudMode = 'lease'
            elseif pcall(function() exports['esx_hud']:HudToggle(false) end) then hudMode = 'toggle' end
        end
        if GetResourceState('esx_status') == 'started' then TriggerEvent('esx_status:setDisplay', 0.0) end
    end
    function esx.restoreOwn()
        if not hudMode or GetResourceState('esx_hud') ~= 'started' then return end
        if hudMode == 'lease' then pcall(function() exports['esx_hud']:VantaHudHidden(false) end)
        else pcall(function() exports['esx_hud']:HudToggle(true) end) end
    end
    AddEventHandler('esx_status:onTick', function(list) if adapter == esx then ingest(list) end end)
    for _, name in ipairs({ 'esx:setAccountMoney', 'esx:setJob', 'esx:playerLoaded' }) do
        RegisterNetEvent(name, function() if adapter == esx then SetTimeout(150, esx.refresh) end end)
    end
    RegisterNetEvent('esx:onPlayerLogout', function()
        if adapter ~= esx then return end
        VantaBridge.needs = {} VantaBridge.SetEconomy(nil)
    end)
end

-- QBCore, and QBox through its qb-core compatibility. Not tried in game yet.
local qb = { resource = 'qb-core' }
do
    local QB, nextTry
    local function object()
        if GetResourceState('qb-core') ~= 'started' then QB = nil return nil end
        if not QB and GetGameTimer() >= (nextTry or 0) then
            nextTry = GetGameTimer() + 2000
            local ok, obj = pcall(function() return exports['qb-core']:GetCoreObject() end)
            if ok then QB = obj end
        end
        return QB
    end
    function qb.loaded()
        return object() ~= nil and LocalPlayer.state.isLoggedIn == true
    end
    function qb.menuOpen() return false end
    function qb.refresh()
        local obj = object()
        if not obj then return end
        local ok, data = pcall(obj.Functions.GetPlayerData)
        if not ok or type(data) ~= 'table' then return end
        local meta, money, job = data.metadata or {}, data.money or {}, data.job or {}
        VantaBridge.needs.hunger, VantaBridge.needs.thirst = percent(meta.hunger), percent(meta.thirst)
        pushEconomy(money.cash, money.bank, job.label or job.name, type(job.grade) == 'table' and job.grade.name or nil)
    end
    qb.poll = qb.refresh
    function qb.hideOwn() end
    function qb.restoreOwn() end
    for _, name in ipairs({ 'QBCore:Player:SetPlayerData', 'QBCore:Client:OnPlayerLoaded', 'QBCore:Client:OnJobUpdate', 'QBCore:Client:OnMoneyChange' }) do
        RegisterNetEvent(name, function() if adapter == qb then SetTimeout(150, qb.refresh) end end)
    end
    RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
        if adapter ~= qb then return end
        VantaBridge.needs = {} VantaBridge.SetEconomy(nil)
    end)
end

local byName = { esx = esx, qb = qb }
-- the framework may start after us, so resolve lazily
local function resolve()
    if adapter then return adapter end
    local wanted = Config.Framework or 'standalone'
    if wanted == 'auto' then
        for _, name in ipairs({ 'esx', 'qb' }) do
            if GetResourceState(byName[name].resource) == 'started' then wanted = name break end
        end
    end
    local found = byName[wanted]
    if found and GetResourceState(found.resource) == 'started' then
        adapter, VantaFramework.name = found, wanted
    end
    return adapter
end

function VantaFramework.Loaded()
    local wanted = Config.Framework or 'standalone'
    if wanted == 'standalone' then return true end
    local a = resolve()
    if a then return a.loaded() end
    -- 'auto' with nothing detected = standalone; a chosen framework that has not started = wait
    return wanted == 'auto'
end
function VantaFramework.MenuOpen()
    return adapter ~= nil and adapter.menuOpen()
end

CreateThread(function()
    local nextHide = 0
    while true do
        local a = resolve()
        if a and VantaBridge.IsLoaded() then
            a.poll()
            if Config.HideFrameworkHud and GetGameTimer() >= nextHide then nextHide = GetGameTimer() + 5000 a.hideOwn() end
        end
        Wait(2000)
    end
end)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    if adapter then adapter.restoreOwn() end
end)
