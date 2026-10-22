'use strict';
window.VantaCompass = function createCompass(ui) {
  const PX_PER_DEGREE = 2.4;
  const CARDINALS = {
    0: 'N',
    45: 'NE',
    90: 'E',
    135: 'SE',
    180: 'S',
    225: t('SW'),
    270: t('W'),
    315: t('NW'),
  };
  const POSE_TIMEOUT_MS = 1500;

  let bearing = null;
  let place = '';
  let lastPoseAt = 0;

  // strip repeated three times so 0°/360° wraps without a jump
  function build() {
    const ribbon = document.getElementById('compass-ribbon');
    if (!ribbon || ribbon.childElementCount) return;

    const fragment = document.createDocumentFragment();
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let degree = 0; degree < 360; degree += 15) {
        const mark = document.createElement('i');
        mark.style.left = (cycle * 360 + degree) * PX_PER_DEGREE + 'px';
        if (degree % 45 === 0) {
          mark.className = 'cardinal' + (degree === 0 ? ' north' : '');
          mark.textContent = CARDINALS[degree];
        } else {
          mark.className = 'tick' + (degree % 30 === 0 ? ' major' : '');
        }
        fragment.append(mark);
      }
    }
    ribbon.append(fragment);
    ribbon.style.width = 1080 * PX_PER_DEGREE + 'px';
  }

  function paint() {
    const root = document.getElementById('compass');
    if (!root) return;

    const visible = ui.canShow('compass') && bearing !== null;
    root.hidden = !visible;
    if (!visible) return;

    const half = root.clientWidth / 2 || 180;
    document.getElementById('compass-ribbon').style.left =
      Math.round(half - (360 + bearing) * PX_PER_DEGREE) + 'px';
    document.getElementById('compass-degrees').textContent =
      String(Math.round(bearing) % 360).padStart(3, '0') + '°';
    document.getElementById('compass-place').textContent = place;
  }

  const toBearing = (yaw) => (360 - (yaw % 360) + 360) % 360;

  function setBearing(value) {
    if (bearing !== null && Math.abs(value - bearing) < 0.4) return false;
    bearing = value;
    return true;
  }

  return {
    build,
    paint,
    setPlace(street, zone) {
      place = street || zone || '';
    },
    // camera yaw, 0 = north, grows to the left
    pose(cameraHeading) {
      const yaw = Number(cameraHeading);
      if (!Number.isFinite(yaw)) return;
      lastPoseAt = performance.now();
      if (setBearing(toBearing(yaw))) paint();
    },
    // sans flux de pose on prend le cap du personnage
    fallback(heading) {
      if (typeof heading !== 'number') return;
      if (bearing === null || performance.now() - lastPoseAt > POSE_TIMEOUT_MS)
        setBearing(toBearing(heading));
    },
  };
};
