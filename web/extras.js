'use strict';
window.VantaExtras = (() => {
  const ui = {
    options: { compass: true, moneyHud: true, weaponHud: true },
    hudVisible: false,
    menuOpen: false,
    cinema: false,
    // visible if the option is on, the HUD shown, outside menus and cinema
    canShow(option) {
      return this.options[option] && this.hudVisible && !this.menuOpen && !this.cinema;
    }
  };

  const compass = window.VantaCompass(ui);
  const money = window.VantaMoney(ui);
  const weapon = window.VantaWeaponHud(ui);

  const paintAll = () => {
    compass.paint();
    money.paint();
    weapon.paint();
  };

  return {
    init() {
      compass.build();
    },
    settings(value) {
      if (!value) return;
      ui.options = {
        compass: value.compass !== false,
        moneyHud: value.moneyHud !== false,
        weaponHud: value.weaponHud !== false
      };
      paintAll();
    },
    state(data) {
      ui.hudVisible = data.visible === true;
      compass.setPlace(data.street, data.zone);
      compass.fallback(data.world?.heading);
      paintAll();
      weapon.vehicleChanged(!!data.vehicle);
    },
    menu(open) {
      ui.menuOpen = open === true;
      paintAll();
    },
    cinema(on) {
      ui.cinema = on === true;
      document.body.classList.toggle('cinema', ui.cinema);
      paintAll();
    },
    pose: (data) => compass.pose(data && data.cameraHeading),
    economy: (data) => money.update(data),
    weapon: (data) => weapon.update(data),
    relayout: () => weapon.relayout()
  };
})();
