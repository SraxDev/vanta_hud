HudFrontendTheme = {}
local enabled, applied, previous = false, false, {}
local palette = {
    [116] = { 145, 224, 232, 255 }, -- HUD_COLOUR_FREEMODE: native accent
    [117] = { 16, 30, 36, 220 },    -- HUD_COLOUR_PAUSE_BG
    [157] = { 16, 28, 32, 215 },    -- HUD_COLOUR_PAUSEMAP_TINT
    [158] = { 83, 108, 102, 150 },  -- HUD_COLOUR_PAUSE_DESELECT
    [163] = { 16, 28, 32, 215 }     -- HUD_COLOUR_PAUSEMAP_TINT_HALF
}
local function same(a, b)
    for index = 1, 4 do if a[index] ~= b[index] then return false end end
    return true
end
local function restore()
    if not applied then return end
    for index, colour in pairs(palette) do
        -- if another resource changed the palette meanwhile, leave it alone
        if previous[index] and same({ GetHudColour(index) }, colour) then
            ReplaceHudColourWithRgba(index, table.unpack(previous[index]))
        end
    end
    previous, applied = {}, false
end
local function apply()
    if applied then return end
    for index, colour in pairs(palette) do
        previous[index] = { GetHudColour(index) }
        ReplaceHudColourWithRgba(index, table.unpack(colour))
    end
    applied = true
end
function HudFrontendTheme.SetEnabled(value, theme)
    local accents = { sage = { 180, 222, 209, 255 }, cyan = { 156, 228, 237, 255 }, amber = { 230, 197, 143, 255 } }
    local accent = accents[theme] or accents.sage
    if not same(palette[116], accent) then restore() palette[116] = accent end
    enabled = value == true and Config.NativeMenuTheme.enabled == true
    if not enabled then restore() end
end
-- the pause state comes from the main loop
function HudFrontendTheme.Update(paused)
    if enabled and paused then apply() else restore() end
end
AddEventHandler('onResourceStop', function(name)
    if name == GetCurrentResourceName() then restore() end
end)
