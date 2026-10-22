'use strict';
window.VantaWeaponHud = function createWeaponHud(ui) {
  const MAX_PIPS = 40;
  const LOW_RATIO = 0.25;
  const ICON_NAME = /^WEAPON_[A-Z0-9_]{1,40}$/;

  // fallback silhouettes when the icon is missing from web/weapons
  const SHAPES = {
    pistol: 'M6 8h34v6h-4v3h-9l-2 9h-7l2-9h-6l-3 0z',
    smg: 'M4 9h40v5h-8v3h-8l-2 10h-7l2-10h-9l-4-2zM44 10h14v3H44z',
    rifle: 'M2 11h34l4-3h14v4H42v4H30l-3 3h-9l3-3H6zM40 16h8l1 9h-6z',
    mg: 'M2 10h30l4-3h22v4H38v5H28l-2 3h-9l2-3H4zM38 16h8l1 10h-6z',
    shotgun: 'M2 11h50v4H34l-3 3H8l-4-3zM34 15h10l-2 6h-8z',
    sniper: 'M2 13h46v3H30l-2 4h-6l1-4H6zM44 12h18v2H44zM18 8h14v3H18z',
    heavy: 'M4 9h40l8-2v6H44l-4 3H10l-6-3zM22 16h8v9h-8z',
    melee: 'M30 2l4 4-18 18-6 2 2-6zM6 26l6-2-4 6z',
    thrown: 'M24 8h8v4a10 10 0 11-8 0zM26 2h4v6h-4z'
  };

  const $ = (id) => document.getElementById(id);
  let weapon = null;
  let lastKey = '';
  let lastPlacement = '';
  let layoutFrame = 0;
  let settleTimer = 0;
  let wasInVehicle = false;

  // aligned to the visible vehicle gauge (width, right edge, top with alerts),
  // otherwise bottom right, where it would be
  function place(root) {
    let top = innerHeight;
    let right = 0;
    let width = 0;

    for (const element of document.querySelectorAll('#vehicle, #hud .driving-alert, #hud .vehicle-state')) {
      if (element.hidden || element.closest('[hidden]')) continue;
      const rect = element.getBoundingClientRect();
      if (!(rect.width > 0 && rect.height > 0 && rect.right > innerWidth * 0.55)) continue;
      if (rect.top < top) top = rect.top;
      if (element.id === 'vehicle') { right = rect.right; width = rect.width; }
    }

    const unit = innerHeight / 1080;
    let key = '';
    let bottom = '';
    let rightOffset = '';
    let widthPx = '';
    if (top < innerHeight) {
      bottom = Math.round(Math.max(40 * unit, innerHeight - top + 8 * unit)) + 'px';
      if (width) {
        rightOffset = Math.round(innerWidth - right) + 'px';
        widthPx = Math.round(width) + 'px';
      }
      key = [bottom, rightOffset, widthPx].join('|');
    }
    if (key === lastPlacement) return;
    lastPlacement = key;
    root.style.bottom = bottom;
    root.style.right = rightOffset;
    root.style.width = widthPx;
  }

  function paintIcon(iconName) {
    const image = $('weapon-img');
    const wrapper = $('weapon-icon');
    const name = ICON_NAME.test(iconName || '') ? iconName : '';
    if (name === image.dataset.icon) return;

    image.dataset.icon = name;
    image.hidden = true;
    wrapper.classList.remove('photo');
    if (!name) return;

    image.onload = () => { image.hidden = false; wrapper.classList.add('photo'); };
    image.onerror = () => { image.hidden = true; wrapper.classList.remove('photo'); };
    image.src = 'weapons/' + name + '.png';
  }

  function paintPips(clip, clipSize) {
    const container = $('weapon-pips');
    const count = clipSize > 0 ? Math.min(clipSize, MAX_PIPS) : 0;
    if (container.children.length !== count) {
      container.textContent = '';
      for (let i = 0; i < count; i++) container.appendChild(document.createElement('i'));
    }
    const filled = count ? Math.round((clip / clipSize) * count) : 0;
    for (let i = 0; i < count; i++) container.children[i].className = i < filled ? 'on' : '';
  }

  function paint() {
    const root = $('weapon-hud');
    if (!root) return;

    const visible = ui.canShow('weaponHud') && weapon && !weapon.hidden;
    const wasHidden = root.hidden;
    root.hidden = !visible;
    if (!visible) return;
    place(root);

    const key = [weapon.name, weapon.icon, weapon.kind, weapon.clipSize, weapon.clip, weapon.reserve, weapon.melee, weapon.reloading].join('|');
    if (key === lastKey && !wasHidden) return;
    lastKey = key;

    const firearm = Number.isFinite(weapon.clipSize) && weapon.clipSize > 0;
    const clip = Number.isFinite(weapon.clip) ? weapon.clip : 0;
    const reserve = Number.isFinite(weapon.reserve) ? weapon.reserve : 0;
    const melee = weapon.melee === true;

    $('weapon-name').textContent = String(weapon.name || t("WEAPON")).slice(0, 32);
    $('weapon-shape').setAttribute('d', SHAPES[weapon.kind] || SHAPES.pistol);
    paintIcon(weapon.icon);

    $('weapon-clip').textContent = melee ? '' : String(firearm ? clip : reserve).padStart(2, '0');
    $('weapon-reserve').textContent = melee || !firearm ? '' : '/ ' + reserve;
    paintPips(clip, weapon.clipSize);

    const noClip = firearm && clip === 0;
    const empty = noClip && reserve === 0;
    const low = firearm && !noClip && clip / weapon.clipSize <= LOW_RATIO;
    root.classList.toggle('melee', melee);
    root.classList.toggle('empty', empty);
    root.classList.toggle('low', low || (noClip && !empty));

    let state = '';
    if (weapon.reloading) state = t("RELOADING");
    else if (empty) state = t("OUT OF AMMO");
    else if (noClip) state = t("MAGAZINE EMPTY");
    else if (low) state = t("LOW AMMO");
    $('weapon-state').textContent = state;
  }

  // re-measure after the next render, the gauge can change size
  function relayout() {
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      const root = $('weapon-hud');
      if (root && !root.hidden) place(root);
    });
  }

  return {
    paint,
    relayout,
    update(data) {
      weapon = data && typeof data === 'object' ? data : null;
      paint();
    },
    // the gauge animates in and out: re-measure at the end
    vehicleChanged(inVehicle) {
      relayout();
      if (inVehicle === wasInVehicle) return;
      wasInVehicle = inVehicle;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(relayout, 450);
    }
  };
};
