HudNavigation = {}
local mapRoute, nextMapRoute = { points = {}, partial = false }, 0
local cached, nextRead = false, 0
local routePoint = GetPosAlongGpsTypeRoute or GetGpsWaypointRouteEnd
local sampleDistances = { 0.0, 12.0, 30.0, 55.0, 90.0, 140.0, 210.0, 300.0 }
local waypointMeta = nil
local missingRouteId, missingSince = nil, 0
local routeGeneration, routeBusy, lastOrigin, lastTarget = 0, false, nil, nil

local function finite(value)
    return type(value) == 'number' and value == value and math.abs(value) < 10000000
end
local function point(distance, slot)
    local ok, found, position
    if type(routePoint) == 'function' then
        ok, found, position = pcall(routePoint, true, distance, slot)
    end
    if not ok or not found or found == 0 or not position then
        -- explicit out pointer, works with the older native aliases too
        ok, found, position = pcall(Citizen.InvokeNative, 0xF3162836C28F9DA5,
            Citizen.PointerValueVector(), true, distance, slot,
            Citizen.ReturnResultAnyway(), Citizen.ResultAsInteger())
    end
    if not ok or not found or found == 0 or not position then return nil end
    if type(position) ~= 'vector3' and type(position) ~= 'table' then return nil end
    if not finite(position.x) or not finite(position.y) or not finite(position.z) then return nil end
    return position
end

function HudNavigation.Invalidate()
    routeGeneration = routeGeneration + 1
    routeBusy, nextMapRoute, nextRead = false, 0, 0
    mapRoute, lastTarget, lastOrigin = { points = {}, partial = true }, nil, nil
    waypointMeta = nil
end

function HudNavigation.MapRoute(enabled)
    if not enabled then
        if lastTarget or routeBusy or #mapRoute.points > 0 then HudNavigation.Invalidate() end
        return mapRoute
    end
    local ped, now = PlayerPedId(), GetGameTimer()
    local waypoint, target = IsWaypointActive(), nil
    if waypoint then
        local blip = GetFirstBlipInfoId(8)
        if blip ~= 0 and DoesBlipExist(blip) then target = GetBlipInfoIdCoord(blip) end
    end
    local key = target and ('%.1f:%.1f'):format(target.x, target.y) or 'mission'
    if key ~= lastTarget then
        HudNavigation.Invalidate()
        lastTarget = key
        mapRoute.destination = target and { x = target.x, y = target.y, z = target.z } or nil
    end
    -- player waypoints go through the NUI road worker
    if target then
        if routeBusy or #mapRoute.points > 0 then routeGeneration = routeGeneration + 1 routeBusy = false end
        mapRoute = { points = {}, partial = true, destination = { x = target.x, y = target.y, z = target.z }, source = 'roads' }
        return mapRoute
    end
    if cached == false then
        if routeBusy or #mapRoute.points > 0 then
            routeGeneration = routeGeneration + 1 routeBusy = false
            mapRoute = { points = {}, partial = false }
        end
        return mapRoute
    end
    local origin = GetEntityCoords(ped)
    if routeBusy or (now < nextMapRoute and nextMapRoute - now < 3000) then return mapRoute end
    if lastOrigin and #(origin - lastOrigin) < 8 and #mapRoute.points > 1 and now - nextMapRoute < 3000 then return mapRoute end
    nextMapRoute, lastOrigin, routeBusy = now + 2000, origin, true
    local generation, slot = routeGeneration, waypoint and 0 or 1
    CreateThread(function()
        local points, visited, stopped, previous, repeated = {}, {}, false, nil, 0
        for index = 0, 4095 do
            if generation ~= routeGeneration then return end
            local p = point(index * 8.0, slot)
            if not p then break end
            if previous then
                local step = math.sqrt((p.x-previous.x)^2+(p.y-previous.y)^2+(p.z-previous.z)^2)
                if step > 28.0 then break end -- Never draw across a discontinuity or wrap.
                if step < 0.05 then repeated = repeated + 1 else repeated = 0 end
                if repeated >= 2 then stopped = true break end
            end
            local cell = ('%d:%d'):format(math.floor(p.x), math.floor(p.y))
            if visited[cell] and index - visited[cell] > 3 then break end
            visited[cell] = index
            if not previous or math.sqrt((p.x-previous.x)^2+(p.y-previous.y)^2+(p.z-previous.z)^2) > 0.05 then points[#points + 1] = { x = p.x, y = p.y, z = p.z } end
            previous = p
            if target and math.sqrt((p.x-target.x)^2+(p.y-target.y)^2) < 12 then stopped = true break end
            if index % 8 == 7 then Wait(0) end -- Mission routes only; bounded work per frame.
        end
        if generation ~= routeGeneration then return end
        mapRoute = { points = points, partial = not stopped or #points < 2, source = 'native',
            destination = target and { x = target.x, y = target.y, z = target.z } or nil }
        routeBusy = false
    end)
    return mapRoute
end

local function blipDistance()
    -- some server artifacts only expose these natives by hash
    local ok, found = pcall(Citizen.InvokeNative, 0x869DAACBBE9FA006, Citizen.ResultAsInteger())
    if not ok or (found ~= true and found ~= 1) then return nil end
    local success, distance = pcall(Citizen.InvokeNative, 0xBBB45C3CF5C8AA85, Citizen.ResultAsInteger())
    if success and finite(distance) and distance > 0 then return distance end
end

local function waypointDistance()
    local blip = GetFirstBlipInfoId(8)
    if blip == 0 or not DoesBlipExist(blip) then return nil end
    local target, origin = GetBlipInfoIdCoord(blip), GetEntityCoords(PlayerPedId())
    if not waypointMeta or waypointMeta.x ~= target.x or waypointMeta.y ~= target.y then
        local street = GetStreetNameAtCoord(target.x, target.y, target.z)
        waypointMeta = { x = target.x, y = target.y,
            label = GetStreetNameFromHashKey(street),
            id = GetHashKey(('%0.1f:%0.1f'):format(target.x, target.y)) }
    end
    local dx, dy = origin.x - target.x, origin.y - target.y
    local direct = math.sqrt(dx * dx + dy * dy)
    -- straight-line distance until the road worker sends the real one (navigationMeta)
    return direct, 'direct'
end

function HudNavigation.Read(enabled)
    if not enabled then
        cached = false nextRead = 0 missingRouteId = nil return false
    end
    local now = GetGameTimer()
    if now < nextRead and nextRead - now < 1000 then return cached end
    nextRead = now + 500
    local waypoint = IsWaypointActive()
    local remaining, distanceKind
    if waypoint then
        remaining, distanceKind = waypointDistance()
    else
        waypointMeta = nil
        remaining, distanceKind = blipDistance(), 'route'
    end
    if not finite(remaining) or remaining <= 0 then cached = false missingRouteId = nil return false end
    cached = { remaining = math.floor(remaining + 0.5), direction = 'continue', estimated = true, distanceKind = distanceKind }
    cached.destination = waypointMeta and waypointMeta.label or T('Active route')
    cached.routeId = waypointMeta and waypointMeta.id or 'blip'
    if remaining < 25 then cached.direction = 'near' return cached end
    if distanceKind == 'direct' then return cached end
    -- player waypoint first, otherwise the active blip route
    local slot = waypoint and 0 or 1
    local first = point(0.0, slot)
    if not first then
        if missingRouteId ~= cached.routeId then missingRouteId, missingSince = cached.routeId, now end
        cached.phase = now - missingSince < 3000 and 'calculating' or 'unavailable'
        return cached
    end
    missingRouteId = nil
    cached.phase = 'active'
    local points = { { position = first, distance = 0.0 } }
    local originHash = GetStreetNameAtCoord(first.x, first.y, first.z)
    for index = 2, #sampleDistances do
        local distance = sampleDistances[index]
        if distance >= remaining then break end
        local position = point(distance, slot)
        if not position then break end
        points[#points + 1] = { position = position, distance = distance }
        if not cached.nextStreet then
            local hash = GetStreetNameAtCoord(position.x, position.y, position.z)
            local name = GetStreetNameFromHashKey(hash)
            if hash ~= 0 and hash ~= originHash and name ~= '' then cached.nextStreet = name end
        end
    end
    for index = 2, #points - 1 do
        local a, b, c = points[index - 1].position, points[index].position, points[index + 1].position
        local ux, uy, vx, vy = b.x - a.x, b.y - a.y, c.x - b.x, c.y - b.y
        local firstLength, secondLength = math.sqrt(ux * ux + uy * uy), math.sqrt(vx * vx + vy * vy)
        if firstLength > 4 and secondLength > 4 then
            local angle = math.deg(math.atan(ux * vy - uy * vx, ux * vx + uy * vy))
            if math.abs(angle) >= 35 then
                cached.direction = math.abs(angle) > 140 and 'uturn' or (angle > 0 and 'left' or 'right')
                cached.turnDistance = math.max(10, math.floor(points[index].distance / 10 + 0.5) * 10)
                break
            end
        end
    end
    return cached
end
