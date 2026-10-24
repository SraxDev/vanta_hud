'use strict';
(() => {
  const preview = typeof GetParentResourceName !== 'function';
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const controls = window.HudControls;
  const map3d = window.HudMap2D;
  let mapBackendEnabled = true;
  const defaults = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    onFoot: true,
    location: true,
    speedUnit: 'kmh',
    blipStyle: 'classic',
    motion: true,
    opacity: 0.6,
    vehicleHud: true,
    vehicleScale: 1,
    beltIndicator: true,
    fuelIndicator: true,
    lowAlerts: true,
    voice: true,
    armourZero: false,
    adaptiveHud: true,
    gps: true,
    vehicleAlerts: true,
    nativeTheme: true,
    displayMode: 'custom',
    theme: 'cyan',
    textScale: 1,
    highContrast: false,
    contextual: true,
    voiceDetails: true,
    nautical: true,
    favoriteAction: 'map',
    favoriteAction2: 'gamesettings',
    favoriteAction3: 'none',
    uiSounds: true,
    uiVolume: 0.18,
    vehicleOffsetX: 0,
    vehicleOffsetY: 0,
    map3d: true,
    mapTheme: 'auto',
    mapQuality: 'balanced',
    compass: true,
    moneyHud: true,
    weaponHud: true,
    lastTab: 0,
  };
  const categories = [
    {
      label: t('INTERFACE'),
      description: t('Adjust the size and presence of the HUD on screen.'),
      rows: [
        {
          key: 'scale',
          label: t('HUD SIZE'),
          min: 0.8,
          max: 1.3,
          step: 0.01,
          format: (v) => `${Math.round(v * 100)} %`,
          description: t('Adjust the size of the minimap, navigation and character gauges.'),
          hint: t('A compact size keeps the road and interactions in view.'),
        },
        {
          key: 'opacity',
          label: t('BACKGROUND OPACITY'),
          min: 0.35,
          max: 0.9,
          step: 0.05,
          format: (v) => `${Math.round(v * 100)} %`,
          description: t('Set the transparency of the panels behind HUD information.'),
          hint: t('Raise the opacity to improve readability in very bright scenes.'),
        },
        {
          key: 'location',
          label: t('STREET AND DISTRICT'),
          description: t('Show the street name, district, time and heading above the minimap.'),
          hint: t('The heading stays grouped next to the map.'),
        },
      ],
    },
    {
      label: 'MINIMAP',
      description: t('Position the map and choose when it appears.'),
      rows: [
        {
          key: 'onFoot',
          label: t('MINIMAP ON FOOT'),
          description: t('Keep the minimap while walking.'),
          hint: t('Character gauges stay visible when the map is hidden.'),
        },
        {
          key: 'offsetX',
          label: t('HORIZONTAL POSITION'),
          min: -0.025,
          max: 0.8,
          step: 0.001,
          format: (v) => `${v > 0 ? '+' : ''}${Math.round(v * 1000)}`,
          description: t('Move the minimap, navigation and gauges together to the left or right.'),
          hint: t('Keep a comfortable margin from the edge of your screen.'),
        },
        {
          key: 'offsetY',
          label: t('VERTICAL POSITION'),
          min: -0.75,
          max: 0.025,
          step: 0.001,
          format: (v) => `${v > 0 ? '+' : ''}${Math.round(v * 1000)}`,
          description: t('Move the whole HUD up or down.'),
          hint: t('A negative value moves the HUD up; a positive value moves it down.'),
        },
      ],
    },
    {
      label: t('VEHICLE'),
      description: t('Customise the information shown while driving.'),
      rows: [
        {
          key: 'vehicleHud',
          label: t('VEHICLE GAUGE'),
          description: t('Show the gauge only when you get into a vehicle.'),
          hint: t('Driving information disappears automatically when you get out.'),
        },
        {
          key: 'vehicleScale',
          label: t('GAUGE SIZE'),
          min: 0.8,
          max: 1.25,
          step: 0.01,
          format: (v) => `${Math.round(v * 100)} %`,
          description: t('Adjust the gauge size independently of the minimap.'),
          hint: t('Speed stays the main information; fuel and seatbelt stay secondary.'),
        },
        {
          key: 'speedUnit',
          label: t('SPEED UNIT'),
          options: [
            ['kmh', t('KILOMETRES / HOUR')],
            ['mph', t('MILES / HOUR')],
          ],
          description: t('Choose the unit used to display speed.'),
          hint: t("Changing the unit keeps the vehicle's real speed."),
        },
        {
          key: 'fuelIndicator',
          label: t('FUEL GAUGE'),
          description: t("Show a thin gauge for the vehicle's fuel."),
          hint: t('The gauge follows the fuel level reported by your vehicle.'),
        },
        {
          key: 'beltIndicator',
          label: t('SEATBELT INDICATOR'),
          description: t(
            'Show your seatbelt state and a discreet alert when it is unfastened while driving.'
          ),
          hint: t("This setting only changes the display. The seatbelt key is still the server's."),
        },
      ],
    },
    {
      label: 'BLIPS',
      description: t('Choose the style of markers on the map and minimap.'),
      rows: [
        {
          key: 'blipStyle',
          label: t('BLIP STYLE'),
          options: [
            ['classic', t('CLASSIC')],
            ['cyan', 'CYAN'],
            ['rp', t('RP COLOURS')],
          ],
          description: t(
            'Choose the classic white silhouettes, their cyan frame or colours by activity. The choice is saved on your computer.'
          ),
          hint: t(
            'With RP Colours: blue police, red hospital, yellow garage, green shops and turquoise bank.'
          ),
        },
      ],
    },
    {
      label: t('ACCESSIBILITY'),
      description: t('Adapt animations and indicators to your preferences.'),
      rows: [
        {
          key: 'motion',
          label: t('ANIMATIONS'),
          description: t("Enable light gauge transitions and the microphone's visual reactions."),
          hint: t("Your system's reduce-motion setting still takes priority."),
        },
        {
          key: 'lowAlerts',
          label: t('NEEDS ALERTS'),
          description: t('Gently draw attention to health, hunger or thirst when they run low.'),
          hint: t('Alerts stay focused on the icons.'),
        },
        {
          key: 'voice',
          label: t('MICROPHONE AND VOICE RANGE'),
          description: t('Show the microphone and the three voice range levels under the map.'),
          hint: t('The microphone turns cyan when you talk.'),
        },
        {
          key: 'armourZero',
          label: t('EMPTY ARMOUR'),
          description: t('Keep the armour gauge even when it is empty.'),
          hint: t('When hidden, the health gauge uses the freed space.'),
        },
      ],
    },
  ];
  const captions = {
    scale: t('Size of the minimap and indicators'),
    opacity: t('Contrast of information over the scenery'),
    location: t('Street, district and heading'),
    onFoot: t('Show the map outside vehicles'),
    voice: t('Microphone and voice range'),
    lowAlerts: t('Flag low hunger or thirst'),
    motion: t('Interface transitions and movement'),
    blipStyle: t('Three styles, same places and activities'),
  };
  categories
    .flatMap((c) => c.rows)
    .forEach((row) => {
      row.caption = captions[row.key] || row.description;
    });
  const allRows = categories.flatMap((category) => category.rows);
  for (const key of ['onFoot', 'voice']) categories[0].rows.push(allRows.find((row) => row.key === key));
  categories[1].rows = categories[1].rows.filter((row) => row.key !== 'onFoot');
  categories[4].rows = categories[4].rows.filter((row) =>
    ['motion', 'armourZero', 'lowAlerts'].includes(row.key)
  );
  categories[0].rows.push({
    key: 'adaptiveHud',
    label: t('ADAPTIVE HUD'),
    caption: t('Discreet gauges when all is well'),
    description: t('Dims health and needs when nearly full. Their contrast increases as they drop.'),
    hint: t('Gauges keep their place and stay visible; low alerts are set under Accessibility.'),
  });
  categories[1].rows.push({
    key: 'gps',
    label: t('GPS GUIDANCE'),
    caption: t('Direction and distance of the active route'),
    description: t('Show a small banner near the map when a native route is active.'),
    hint: t(
      'Turns are estimated from the shape of the route. No guidance is invented when the points are unavailable.'
    ),
  });
  categories[2].rows.push({
    key: 'vehicleAlerts',
    label: t('VEHICLE WARNINGS'),
    caption: t('Low fuel and damaged engine'),
    description: t('Show a targeted alert only when fuel or engine condition calls for it.'),
    hint: t('Bicycles and vehicles without usable data show no engine alert.'),
  });
  categories[4].rows.push({
    key: 'nativeTheme',
    label: t('GTA MENU STYLE'),
    caption: t('Palette matched to the map and the native settings'),
    description: t(
      'Matches the background and accent colours of the GTA menu. The real graphics, audio and controls settings stay native.'
    ),
    hint: t(
      'The theme does not replace the GTA menu layout. Turn it off if another resource already customises its colours.'
    ),
  });
  categories[0].rows.push(
    {
      key: 'theme',
      label: t('VISUAL PALETTE'),
      options: [
        ['sage', t('SAGE')],
        ['cyan', 'CYAN'],
        ['amber', t('AMBER')],
      ],
      caption: t('A shared accent for the HUD and menus'),
      description: t('Choose a restrained accent colour for navigation, selections and voice.'),
      hint: t('Health and alert colours stay distinct.'),
    },
    {
      key: 'favoriteAction',
      label: t('FAVOURITE SHORTCUT'),
      options: [
        ['map', t('MAP')],
        ['gamesettings', t('SETTINGS')],
        ['inventory', t('INVENTORY')],
        ['phone', t('PHONE')],
      ],
      caption: t('An action reachable straight from Esc'),
      description: t('Choose the app reachable with the favourite button or the F key in the quick menu.'),
      hint: t('Unavailable shortcuts are disabled when their resource is stopped.'),
    }
  );
  categories[2].rows.push({
    key: 'nautical',
    label: t('NAUTICAL SPEED'),
    caption: t('Boats use knots'),
    description: t('Show boat speed in knots (KN). Other vehicles keep your usual unit.'),
    hint: t('Turn this off to keep km/h or mph on boats.'),
  });
  categories[4].rows.push(
    {
      key: 'textScale',
      label: t('TEXT SIZE'),
      min: 0.9,
      max: 1.25,
      step: 0.05,
      format: (v) => Math.round(v * 100) + ' %',
      caption: t('Readability independent of the map'),
      description: t('Enlarge HUD labels without moving or resizing the native radar.'),
      hint: t('Long texts are truncated to keep alignments.'),
    },
    {
      key: 'highContrast',
      label: t('HIGH CONTRAST'),
      caption: t('Stronger backgrounds in bright scenes'),
      description: t('Strengthens instrument backgrounds and text. The map keeps its native transparency.'),
      hint: t('Warnings always come with text and symbols.'),
    },
    {
      key: 'contextual',
      label: t('OXYGEN AND STAMINA'),
      caption: t('Indicators shown only when useful'),
      description: t('Show remaining oxygen time underwater and stamina during exertion.'),
      hint: t('These gauges only read the game and never change a character ability.'),
    },
    {
      key: 'voiceDetails',
      label: t('VOICE AND RADIO DETAILS'),
      caption: t('Range when it changes, channel while transmitting'),
      description: t('Tell proximity speech, radio transmission and a disconnected voice apart.'),
      hint: t('A muted-microphone state is shown only when an integration explicitly provides it.'),
    }
  );
  // Keep the approved six primary controls together; secondary preferences remain available.
  categories[0].rows.push(
    {
      key: 'compass',
      label: t('COMPASS'),
      caption: t('Heading and street at the top of the screen'),
      description: t(
        'Show a discreet compass at the top centre, with cardinal points, heading in degrees and the current street.'
      ),
      hint: t('Hidden in menus and in cinema mode.'),
    },
    {
      key: 'moneyHud',
      label: t('CASH AND JOB'),
      caption: t('Cash, bank and job'),
      description: t(
        'Show your cash, bank balance and job at the top right. Gains and expenses appear briefly.'
      ),
      hint: t('Read-only: nothing on your account is modified.'),
    },
    {
      key: 'weaponHud',
      label: t('WEAPON HUD'),
      caption: t('Weapon in hand, ammo and magazine'),
      description: t('Show the equipped weapon, magazine ammo and reserve as soon as a weapon is in hand.'),
      hint: t('Hidden when unarmed, in menus and in cinema mode.'),
    }
  );
  const rowLookup = new Map(categories.flatMap((category) => category.rows).map((row) => [row.key, row]));
  const visualOrder = [
    [
      'scale',
      'opacity',
      'adaptiveHud',
      'theme',
      'textScale',
      'highContrast',
      'favoriteAction',
      'compass',
      'moneyHud',
      'weaponHud',
    ],
    ['onFoot', 'location', 'offsetX', 'offsetY', 'gps'],
    [
      'vehicleHud',
      'vehicleScale',
      'speedUnit',
      'fuelIndicator',
      'beltIndicator',
      'vehicleAlerts',
      'nautical',
    ],
    ['blipStyle'],
    ['motion', 'lowAlerts', 'armourZero', 'voice', 'voiceDetails', 'contextual', 'nativeTheme'],
  ];
  categories.forEach((category, index) => {
    category.rows = visualOrder[index].map((key) => rowLookup.get(key));
  });
  categories[0].rows.push(
    ...['favoriteAction2', 'favoriteAction3'].map((key, index) => ({
      key,
      label: t('FAVOURITE ') + (index + 2),
      options: [
        ['none', t('NONE')],
        ['map', t('MAP')],
        ['inventory', t('INVENTORY')],
        ['phone', t('PHONE')],
      ],
      caption: t('An extra shortcut from the Esc menu'),
      description: t('Choose an extra action. An action already assigned is swapped to avoid duplicates.'),
      hint: t('Keys 1, 2 and 3: direct access. On a gamepad: left/right, then X.'),
    }))
  );
  categories[2].rows.push(
    ...[
      ['vehicleOffsetX', t('GAUGE HORIZONTAL POSITION')],
      ['vehicleOffsetY', t('GAUGE VERTICAL POSITION')],
    ].map(([key, label]) => ({
      key,
      label,
      min: -0.8,
      max: 0,
      step: 0.001,
      format: (v) => Math.round(v * 1000),
      caption: t('Placement independent of the map'),
      description: t('Move the gauge and its alerts without moving the minimap.'),
      hint: t('Use Place the HUD to adjust the frames directly with the mouse.'),
    }))
  );
  categories[4].rows.push(
    {
      key: 'uiSounds',
      label: t('NAVIGATION SOUNDS'),
      caption: t('Soft confirmations in menus'),
      description: t('Accompany movement and actions with a short, discreet sound.'),
      hint: t('Sounds apply to this menu only; game sounds are unchanged.'),
    },
    {
      key: 'uiVolume',
      label: t('MENU VOLUME'),
      min: 0,
      max: 0.5,
      step: 0.01,
      format: (v) => Math.round(v * 100) + ' %',
      caption: t('An independent volume, silent at zero'),
      description: t("Set the volume of this interface's navigation sounds."),
      hint: t('Sounds are spaced out during fast changes to stay discreet.'),
    }
  );
  categories[1].rows.push({
    key: 'mapQuality',
    label: t('MAP RENDERING'),
    options: [
      ['low', t('LIGHT')],
      ['balanced', t('BALANCED')],
      ['high', t('DETAILED')],
    ],
    caption: t('Sharpness and smoothness'),
    description: t('Adjust the render resolution and the atlas detail cache.'),
    hint: t('The map and minimap automatically follow the game time.'),
  });
  const rowIcons = {
    scale: 'monitor',
    opacity: 'opacity',
    adaptiveHud: 'monitor',
    theme: 'palette',
    textScale: 'text',
    highContrast: 'contrast',
    favoriteAction: 'star',
    onFoot: 'run',
    location: 'pin',
    offsetX: 'position',
    offsetY: 'position',
    gps: 'map',
    vehicleHud: 'car',
    vehicleScale: 'gauge',
    speedUnit: 'gauge',
    fuelIndicator: 'fuel',
    beltIndicator: 'shield',
    vehicleAlerts: 'warning',
    nautical: 'wave',
    blipStyle: 'pin',
    motion: 'wave',
    lowAlerts: 'warning',
    armourZero: 'shield',
    voice: 'voice',
    voiceDetails: 'radio',
    contextual: 'run',
    nativeTheme: 'palette',
  };
  Object.assign(rowIcons, {
    map3d: 'map',
    mapTheme: 'contrast',
    mapQuality: 'gauge',
    favoriteAction2: 'star',
    favoriteAction3: 'star',
    vehicleOffsetX: 'position',
    vehicleOffsetY: 'position',
    uiSounds: 'voice',
    uiVolume: 'voice',
  });
  function makeIcon(name) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    icon.classList.add('icon');
    icon.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', '#ui-' + name);
    icon.append(use);
    return icon;
  }
  function setIcon(element, name) {
    if (element.dataset.symbol === name) return;
    element.dataset.symbol = name;
    element.replaceChildren(makeIcon(name));
  }
  function setUse(element, name) {
    const use = element.querySelector('use');
    if (use && use.getAttribute('href') !== '#ui-' + name) use.setAttribute('href', '#ui-' + name);
  }
  function createFrame() {
    const template = document.querySelector('#vehicle>.ui-frame');
    return template.cloneNode(true);
  }
  const kinds = [
    ['police', t('POLICE')],
    ['hospital', t('HOSPITAL')],
    ['garage', 'GARAGE'],
    ['shop', t('SHOP')],
    ['bank', t('BANK')],
    ['fuel', t('FUEL')],
    ['fishing', t('FISHING')],
    ['merchant', t('MERCHANT')],
  ];
  const buttons = [...document.querySelectorAll('#menu-list button')];
  let settings = { ...defaults },
    state = {},
    menu = false,
    settingsOpen = false,
    selected = 0,
    tab = 0,
    rowIndex = 0,
    threshold = 20;
  let noticeTimer,
    saveTimer,
    activeSave = null,
    dirty = false,
    revision = 0,
    gamepadFrame,
    lastPad = 0,
    previousPad = [],
    baseUnit = innerHeight / 1080;
  let blipPreviewStyle = '',
    catalogOpen = false,
    catalogTimer;
  const number = (value, min = 0, max = 100) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : null;

  // Local presentation preferences. Editor drafts are never autosaved.
  let layoutEditor = null,
    layoutMetrics = null,
    editorPreviewPromise = null,
    editorPending = false,
    editorTimer = null,
    lastEditorPreviewAt = 0;
  let activeFavorite = 0,
    previewScenario = 'live',
    audioContext = null,
    lastUiSound = 0,
    menuEpoch = 0;
  const placementKeys = ['offsetX', 'offsetY', 'vehicleOffsetX', 'vehicleOffsetY'];
  const favoriteKeys = ['favoriteAction', 'favoriteAction2', 'favoriteAction3'];
  function unlockUiAudio() {
    if (!menu || !settings.uiSounds || settings.uiVolume <= 0) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext ??= new Audio();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch {}
  }
  function uiSound(kind = 'move') {
    if (
      !menu ||
      !settings.uiSounds ||
      settings.uiVolume <= 0 ||
      !audioContext ||
      audioContext.state !== 'running'
    )
      return;
    const now = performance.now();
    if (now - lastUiSound < (kind === 'move' ? 85 : 55)) return;
    lastUiSound = now;
    try {
      const tone = audioContext.createOscillator(),
        gain = audioContext.createGain(),
        start = audioContext.currentTime;
      const frequencies = { move: 540, adjust: 650, confirm: 880, back: 410 };
      tone.type = 'sine';
      tone.frequency.setValueAtTime(frequencies[kind] || 540, start);
      tone.frequency.exponentialRampToValueAtTime((frequencies[kind] || 540) * 0.8, start + 0.045);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.065 * settings.uiVolume, start + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.055);
      tone.connect(gain);
      gain.connect(audioContext.destination);
      tone.start(start);
      tone.stop(start + 0.06);
      tone.onended = () => {
        tone.disconnect();
        gain.disconnect();
      };
    } catch {}
  }
  function previewData() {
    const sample = { ...state, context: { ...state.context } };
    if (previewScenario === 'health') Object.assign(sample, { health: 12, hunger: 18, thirst: 15 });
    if (previewScenario === 'radio')
      Object.assign(sample.context, { radio: true, radioChannel: 12, voiceConnected: true });
    return sample;
  }
  function previewSignal() {
    const labels = {
      live: '',
      health: t('LOW HEALTH · 12 %'),
      fuel: t('LOW FUEL · 6 %  /  DAMAGED ENGINE'),
      radio: t('RADIO TRANSMISSION · CHANNEL 12'),
      night: t('NIGHT READING'),
    };
    const signal = $('preview-signal');
    signal.hidden = previewScenario === 'live';
    signal.textContent = labels[previewScenario];
    signal.dataset.scenario = previewScenario;
    $('settings-preview').classList.toggle('preview-night', previewScenario === 'night');
    $('preview-simulation').hidden = previewScenario === 'live';
  }
  function favoriteSlots() {
    return favoriteKeys
      .map((key) => settings[key])
      .map((action, index, slots) => (action !== 'none' && slots.indexOf(action) === index ? action : null));
  }
  function selectFavorite(index) {
    activeFavorite = (index + 3) % 3;
    paintFavorite();
    uiSound('move');
  }
  function layoutValues() {
    return Object.fromEntries(placementKeys.map((key) => [key, layoutEditor?.draft[key] ?? settings[key]]));
  }
  function cssNumber(name, fallback = 0) {
    const n = parseFloat(getComputedStyle(root).getPropertyValue(name));
    return Number.isFinite(n) ? n : fallback;
  }
  function placementLimits() {
    return (
      layoutMetrics?.limits || {
        offsetX: [-0.025, 0.7],
        offsetY: [-0.65, 0.025],
        vehicleOffsetX: [-0.75, 0],
        vehicleOffsetY: [-0.65, 0],
      }
    );
  }
  function setEditorTarget(target) {
    if (!layoutEditor) return;
    layoutEditor.target = target;
    paintEditor();
    uiSound('move');
  }
  function editorBounds(target) {
    const m = layoutMetrics || {},
      draft = layoutEditor.draft;
    if (target === 'map') {
      const u = m.unit || (innerHeight / 1080) * settings.scale;
      return {
        left: (m.left || 0) + (draft.offsetX - (m.offsetX || 0)) * innerWidth,
        top: (m.top || 0) + (draft.offsetY - (m.offsetY || 0)) * innerHeight - 47 * u,
        width: m.width || 272 * u,
        height: (m.height || 172 * u) + 121 * u,
      };
    }
    const u = baseUnit * settings.vehicleScale,
      right = (m.right || innerWidth * 0.025) - draft.vehicleOffsetX * innerWidth,
      bottom = (m.bottom || innerHeight * 0.025) - draft.vehicleOffsetY * innerHeight;
    const vehicle = $('vehicle');
    return {
      left: innerWidth - right - 280 * u,
      top: innerHeight - bottom - (vehicle.hidden ? 175 * u : vehicle.getBoundingClientRect().height),
      width: 280 * u,
      height: vehicle.hidden ? 175 * u : vehicle.getBoundingClientRect().height,
    };
  }
  function paintEditor() {
    if (!layoutEditor) return;
    applyMapPlacement();
    const editor = $('layout-editor'),
      draft = layoutEditor.draft;
    editor
      .querySelectorAll('[data-layout-target]')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.layoutTarget === layoutEditor.target))
      );
    const instrumentBounds = { map: editorBounds('map'), vehicle: editorBounds('vehicle') };
    for (const target of ['map', 'vehicle']) {
      const frame = $('layout-' + target),
        bounds = instrumentBounds[target];
      for (const key of ['left', 'top', 'width', 'height']) frame.style[key] = bounds[key] + 'px';
      frame.classList.toggle('selected', layoutEditor.target === target);
      frame.tabIndex = layoutEditor.target === target ? 0 : -1;
    }
    $('layout-vehicle').classList.toggle('sample', !state.vehicle || !settings.vehicleHud);
    $('layout-snap').setAttribute('aria-pressed', String(layoutEditor.snap));
    const name = layoutEditor.target === 'map' ? t('MAP AND GAUGES') : t('GAUGE');
    const x = layoutEditor.target === 'map' ? draft.offsetX : draft.vehicleOffsetX,
      y = layoutEditor.target === 'map' ? draft.offsetY : draft.vehicleOffsetY;
    $('layout-position').textContent =
      `${name} · X ${Math.round(x * innerWidth)} / Y ${Math.round(y * innerHeight)} PX`;
    const a = instrumentBounds.map,
      b = instrumentBounds.vehicle;
    const overlap =
      a.left < b.left + b.width &&
      a.left + a.width > b.left &&
      a.top < b.top + b.height &&
      a.top + a.height > b.top;
    $('layout-overlap').hidden = !overlap;
    const vehicleX = draft.vehicleOffsetX,
      vehicleY = draft.vehicleOffsetY;
    root.style.setProperty('--vehicle-offset-x', `${vehicleX * innerWidth}px`);
    root.style.setProperty('--vehicle-offset-y', `${vehicleY * innerHeight}px`);
  }
  // Immediate map preview while dragging: the position confirmed by the game (~80 ms round trip) is the base, the draft offset
  // is applied right away to the CSS variables the NUI minimap re-reads every frame. The game's confirmation lands on the same value.
  function applyMapPlacement() {
    const m = layoutMetrics;
    if (!layoutEditor || !m || !Number.isFinite(m.left) || !Number.isFinite(m.top)) return;
    const draft = layoutEditor.draft;
    root.style.setProperty('--map-x', `${m.left + (draft.offsetX - (m.offsetX || 0)) * innerWidth}px`);
    root.style.setProperty('--map-y', `${m.top + (draft.offsetY - (m.offsetY || 0)) * innerHeight}px`);
  }
  function moveEditor(dx, dy, snap = false) {
    if (!layoutEditor || layoutEditor.busy) return;
    const draft = layoutEditor.draft,
      keys = layoutEditor.target === 'map' ? ['offsetX', 'offsetY'] : ['vehicleOffsetX', 'vehicleOffsetY'],
      limits = placementLimits();
    keys.forEach((key, i) => {
      const size = i ? innerHeight : innerWidth,
        bounds = limits[key],
        delta = i ? dy : dx;
      let pixels = draft[key] * size + delta;
      if (snap && layoutEditor.snap) {
        pixels = Math.round(pixels / 8) * 8;
        for (const anchor of [0, bounds[0] * size, bounds[1] * size])
          if (Math.abs(pixels - anchor) < 9) pixels = anchor;
        // Snap the selected instrument's centre to the screen centre.
        const rect = editorBounds(layoutEditor.target),
          centre = i ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
        const correction = size / 2 - (centre + delta);
        if (Math.abs(correction) < 9) pixels = draft[key] * size + delta + correction;
      }
      draft[key] = number(pixels / size, bounds[0], bounds[1]);
    });
    paintEditor();
    queueEditorPreview();
  }
  function queueEditorPreview() {
    editorPending = true;
    if (!editorTimer && !editorPreviewPromise)
      editorTimer = setTimeout(() => {
        editorTimer = null;
        flushEditorPreview();
      }, 80);
  }
  async function flushEditorPreview() {
    clearTimeout(editorTimer);
    editorTimer = null;
    if (editorPreviewPromise) return editorPreviewPromise;
    if (!layoutEditor || !editorPending) return;
    const session = layoutEditor;
    editorPreviewPromise = (async () => {
      while (editorPending && layoutEditor === session) {
        const wait = 80 - (performance.now() - lastEditorPreviewAt);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        if (layoutEditor !== session) break;
        editorPending = false;
        const values = layoutValues();
        lastEditorPreviewAt = performance.now();
        try {
          const response = await post('layoutEditor', { open: true, epoch: menuEpoch, settings: values });
          if (!response.ok) throw Error(response.error || t('Preview unavailable.'));
          if (layoutEditor === session && !editorPending)
            for (const key of placementKeys) session.draft[key] = response.settings[key];
        } catch (error) {
          if (layoutEditor === session) {
            $('layout-feedback').textContent = error.message;
            session.failed = true;
          }
          break;
        }
      }
    })();
    try {
      await editorPreviewPromise;
    } finally {
      editorPreviewPromise = null;
      if (layoutEditor === session) paintEditor();
    }
  }
  async function openLayoutEditor() {
    if (layoutEditor || !settingsOpen || restoringSettings || !(await save()) || !menu || !settingsOpen)
      return;
    controls.close();
    const session = { draft: { ...settings }, target: 'map', snap: true, busy: true, drag: null };
    layoutEditor = session;
    try {
      const response = await post('layoutEditor', { open: true, epoch: menuEpoch, settings: layoutValues() });
      if (!response.ok) throw Error(response.error || t('Placement unavailable.'));
      if (layoutEditor !== session || !menu) return;
      Object.assign(session.draft, response.settings);
      session.busy = false;
      document.body.classList.add('layout-editing');
      $('layout-editor').hidden = false;
      $('layout-feedback').textContent = t('Drag a frame, or use the arrow keys. Shift: move by 10 px.');
      $('settings-panel').inert = true;
      $('notifications').classList.add('editor-hidden');
      paintEditor();
      render(state);
      $('layout-map').focus({ preventScroll: true });
      animate($('layout-editor'), [{ opacity: 0 }, { opacity: 1 }], 140);
      uiSound('confirm');
    } catch (error) {
      if (layoutEditor === session) {
        layoutEditor = null;
        notice(error.message, 'error');
      }
    }
  }
  function clearLayoutEditor() {
    clearTimeout(editorTimer);
    editorTimer = null;
    editorPending = false;
    const drag = layoutEditor?.drag;
    if (drag && drag.element.hasPointerCapture(drag.id)) drag.element.releasePointerCapture(drag.id);
    layoutEditor = null;
    document.body.classList.remove('layout-editing');
    $('layout-editor').hidden = true;
    $('settings-panel').inert = false;
    $('notifications').classList.remove('editor-hidden');
    root.style.setProperty('--vehicle-offset-x', `${settings.vehicleOffsetX * innerWidth}px`);
    root.style.setProperty('--vehicle-offset-y', `${settings.vehicleOffsetY * innerHeight}px`);
  }
  async function finishLayoutEditor(commit) {
    const session = layoutEditor;
    if (!session || session.busy) return;
    session.busy = true;
    $('layout-editor').setAttribute('aria-busy', 'true');
    try {
      await flushEditorPreview();
      if (layoutEditor !== session || !menu) return;
      if (commit) {
        const result = await post('settings', { settings: { ...settings, ...layoutValues() } });
        if (!result.ok) throw Error(result.error || t('Placement not saved.'));
        revision++;
        dirty = false;
        updateSettings(result.settings);
        $('save-status').textContent = t('CHANGES SAVED');
      }
      const response = await post('layoutEditor', { open: false, epoch: menuEpoch });
      if (!response.ok) throw Error(response.error || t('Could not return to settings.'));
      if (layoutEditor !== session) return;
      clearLayoutEditor();
      render(state);
      paintPreview();
      updateUndo();
      $('layout-open').focus({ preventScroll: true });
      uiSound(commit ? 'confirm' : 'back');
      if (commit) notice(t('The HUD placement has been saved.'), 'success');
    } catch (error) {
      if (layoutEditor === session) $('layout-feedback').textContent = error.message;
    } finally {
      if (layoutEditor === session) session.busy = false;
      $('layout-editor').removeAttribute('aria-busy');
    }
  }
  function editorKey(event) {
    if (!layoutEditor) return false;
    event.preventDefault();
    if (layoutEditor.busy) return true;
    if (event.key === 'Escape') finishLayoutEditor(false);
    else if (event.key === 'Enter') {
      if (document.activeElement.matches('#layout-editor button')) document.activeElement.click();
      else finishLayoutEditor(true);
    } else if (event.key === 'Tab') {
      const nodes = [...$('layout-editor').querySelectorAll('button:not(:disabled),[tabindex="0"]')],
        index = nodes.indexOf(document.activeElement);
      nodes[(index + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length]?.focus();
    } else if (event.key === ' ' && document.activeElement.matches('#layout-editor button'))
      document.activeElement.click();
    else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      const step = event.shiftKey ? 10 : 1;
      moveEditor(
        event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
        event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
      );
      uiSound('adjust');
    }
    return true;
  }
  function editorGamepad(pad, pressed, now) {
    if (!layoutEditor) return false;
    if (pressed[1] && !previousPad[1]) finishLayoutEditor(false);
    if (layoutEditor.busy) return true;
    if (pressed[0] && !previousPad[0]) finishLayoutEditor(true);
    if ((pressed[4] && !previousPad[4]) || (pressed[5] && !previousPad[5]))
      setEditorTarget(layoutEditor.target === 'map' ? 'vehicle' : 'map');
    if (pressed[2] && !previousPad[2]) {
      layoutEditor.snap = !layoutEditor.snap;
      paintEditor();
    }
    if (now - lastPad > 85) {
      const dx = pressed[15] || pad.axes[0] > 0.6 ? 1 : pressed[14] || pad.axes[0] < -0.6 ? -1 : 0,
        dy = pressed[13] || pad.axes[1] > 0.6 ? 1 : pressed[12] || pad.axes[1] < -0.6 ? -1 : 0;
      if (dx || dy) {
        moveEditor(dx * 8, dy * 8, true);
        lastPad = now;
        uiSound('adjust');
      }
    }
    return true;
  }
  function initPersonalisation() {
    document.addEventListener('pointerdown', unlockUiAudio, { passive: true });
    document.addEventListener('keydown', unlockUiAudio, { capture: true });
    document.addEventListener('click', (event) => {
      if (menu && event.target.closest('button:not(:disabled)')) uiSound('confirm');
    });
    $('layout-open').addEventListener('click', openLayoutEditor);
    $('layout-save').addEventListener('click', () => finishLayoutEditor(true));
    $('layout-cancel').addEventListener('click', () => finishLayoutEditor(false));
    $('layout-snap').addEventListener('click', () => {
      if (layoutEditor && !layoutEditor.busy) {
        layoutEditor.snap = !layoutEditor.snap;
        paintEditor();
      }
    });
    $('layout-reset').addEventListener('click', () => {
      if (!layoutEditor || layoutEditor.busy) return;
      for (const key of placementKeys) layoutEditor.draft[key] = 0;
      paintEditor();
      queueEditorPreview();
    });
    document
      .querySelectorAll('[data-layout-target]')
      .forEach((button) =>
        button.addEventListener('click', () => setEditorTarget(button.dataset.layoutTarget))
      );
    for (const target of ['map', 'vehicle']) {
      const frame = $('layout-' + target);
      frame.addEventListener('focus', () => {
        if (layoutEditor) layoutEditor.target = target;
        paintEditor();
      });
      frame.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || !layoutEditor || layoutEditor.busy) return;
        event.preventDefault();
        setEditorTarget(target);
        frame.focus({ preventScroll: true });
        frame.setPointerCapture(event.pointerId);
        layoutEditor.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, element: frame };
      });
      frame.addEventListener('pointermove', (event) => {
        const drag = layoutEditor?.drag;
        if (!drag || drag.id !== event.pointerId) return;
        moveEditor(event.clientX - drag.x, event.clientY - drag.y, false);
        drag.x = event.clientX;
        drag.y = event.clientY;
      });
      const release = (event) => {
        const drag = layoutEditor?.drag;
        if (!drag || drag.id !== event.pointerId) return;
        layoutEditor.drag = null;
        if (frame.hasPointerCapture(event.pointerId)) frame.releasePointerCapture(event.pointerId);
        moveEditor(0, 0, true);
        flushEditorPreview();
      };
      frame.addEventListener('pointerup', release);
      frame.addEventListener('pointercancel', release);
      frame.addEventListener('lostpointercapture', (event) => {
        if (layoutEditor?.drag?.id === event.pointerId) release(event);
      });
    }
    $('preview-scenario').addEventListener('change', () => {
      previewScenario = $('preview-scenario').value;
      if (previewScenario === 'fuel') selectPreview('vehicle');
      else paintPreview();
      uiSound('adjust');
    });
    for (let slot = 1; slot < 3; slot++)
      $('menu-favorite-' + (slot + 1)).addEventListener('click', () => {
        activeFavorite = slot;
        activateFavorite(slot);
      });
    window.addEventListener('resize', () => {
      if (layoutEditor) {
        layoutEditor.drag = null;
        paintEditor();
        queueEditorPreview();
      }
    });
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)'),
    animations = new Map();
  let menuGeneration = 0;
  function motionAllowed() {
    return settings.motion && !reducedMotion.matches;
  }
  function cancelMotion() {
    for (const animation of animations.values()) animation.cancel();
    animations.clear();
    finishPresence();
  }
  function animate(element, frames, duration = 180, delay = 0) {
    if (!element || !motionAllowed()) return;
    animations.get(element)?.cancel();
    const animation = element.animate(frames, {
      duration,
      delay,
      easing: 'cubic-bezier(.22,.75,.25,1)',
      fill: 'backwards',
    });
    animations.set(element, animation);
    animation.onfinish = animation.oncancel = () => {
      if (animations.get(element) === animation) animations.delete(element);
    };
  }
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) cancelMotion();
  });
  function fitMenu() {
    root.style.setProperty('--fit', Math.min(innerWidth / 1920, innerHeight / 1080));
  }
  function enterMenu() {
    animate(
      document.querySelector('.paper'),
      [
        { translate: '-44px 0', opacity: 0.7 },
        { translate: '0 0', opacity: 1 },
      ],
      270
    );
    animate(document.querySelector('.paper-edge'), [{ opacity: 0 }, { opacity: 1 }], 240);
    animate(
      document.querySelector('.menu-title'),
      [
        { translate: '-16px 0', opacity: 0 },
        { translate: '0 0', opacity: 1 },
      ],
      220,
      45
    );
    buttons.forEach((button, index) =>
      animate(
        button,
        [
          { translate: '-12px 0', opacity: 0 },
          { translate: '0 0', opacity: 1 },
        ],
        200,
        60 + index * 22
      )
    );
    animate(
      document.querySelector('.context-card'),
      [
        { translate: '0 12px', opacity: 0 },
        { translate: '0 0', opacity: 1 },
      ],
      220,
      100
    );
  }
  const menuDetails = {
    resume: [t('BACK TO THE GAME'), t('Pick your session up where you left it.')],
    map: [t('EXPLORE THE CITY'), t('Find places, activities and your next route.')],
    settings: [t('YOUR INTERFACE'), t('Adjust the HUD, driving and markers to your preferences.')],
    gamesettings: [t('GAME SETTINGS'), t('Sound, graphics, controls and other general GTA V settings.')],
    inventory: [t('YOUR GEAR'), t("Find your character's items and equipment.")],
    phone: [t('STAY CONNECTED'), t('Access your contacts and messages.')],
  };
  function paintMenuDetail() {
    const [title, copy] = menuDetails[buttons[selected].dataset.action];
    if ($('context-title').textContent === title) return;
    $('context-title').textContent = title;
    $('context-copy').textContent = copy;
    animate(
      document.querySelector('.context-card'),
      [
        { translate: '0 5px', opacity: 0.35 },
        { translate: '0 0', opacity: 1 },
      ],
      180
    );
  }

  async function post(name, data = {}) {
    if (
      ![
        'settings',
        'action',
        'close',
        'map3dReady',
        'mapWaypoint',
        'mapView',
        'layoutEditor',
        'ready',
        'viewport',
      ].includes(name)
    )
      throw Error(t('Action not allowed'));
    if (['settings', 'action', 'close'].includes(name)) data = { ...data, epoch: menuEpoch };
    if (preview) return previewPost(name, data);
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 4000);
    try {
      const parent = GetParentResourceName();
      if (typeof parent !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(parent))
        throw Error(t('Invalid resource'));
      const response = await fetch(`https://${parent}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      if (!response.ok) throw Error(t('Callback unavailable'));
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }
  let openingSettings = null,
    restoringSettings = false,
    previewMode = 'live',
    previewClass = 0,
    activationBusy = false;
  function markAdaptive(element, value, id) {
    const valid = number(value),
      enabled = settings.adaptiveHud && ['health', 'hunger', 'thirst'].includes(id) && valid !== null;
    const calm =
      enabled &&
      !element.classList.contains('recent-change') &&
      valid >= (element.classList.contains('adaptive-muted') ? 88 : 92);
    element.classList.toggle('adaptive-muted', calm);
    element.classList.toggle('adaptive-attention', enabled && valid <= 50);
  }
  function capabilities(vehicle) {
    const type = Number(vehicle?.class ?? 0),
      road = ![13, 14, 15, 16, 21].includes(type);
    return {
      gear: road,
      rpm: road,
      fuel: ![13, 21].includes(type),
      belt: vehicle?.canBelt === true && ![8, 13, 14, 15, 16, 21].includes(type),
      profile:
        type === 13
          ? 'bicycle'
          : type === 14
            ? 'boat'
            : type === 15
              ? 'helicopter'
              : type === 16
                ? 'plane'
                : type === 21
                  ? 'train'
                  : 'road',
    };
  }
  function paintVehicle(target, vehicle, mini = false) {
    if (!vehicle) return;
    const caps = capabilities(vehicle),
      gear = target.querySelector('.gear'),
      rpm = target.querySelector('.rpm'),
      fuel = mini ? null : $('fuel'),
      belt = target.querySelector('.belt'),
      footer = target.querySelector('.vehicle-bottom');
    target.dataset.profile = caps.profile;
    target.classList.toggle('simplified', !caps.gear);
    gear.hidden = !caps.gear;
    rpm.hidden = !caps.rpm;
    const fuelShown = settings.fuelIndicator && caps.fuel,
      beltShown = settings.beltIndicator && caps.belt;
    if (fuel) fuel.hidden = !fuelShown;
    else
      target
        .querySelectorAll('.vehicle-bottom>.icon,.vehicle-bottom>.track,.vehicle-bottom>b')
        .forEach((el) => (el.hidden = !fuelShown));
    belt.hidden = !beltShown;
    footer.hidden = !fuelShown && !beltShown;
  }
  function updateUndo() {
    const changed =
      openingSettings && Object.keys(defaults).some((key) => settings[key] !== openingSettings[key]);
    $('settings-undo').disabled = restoringSettings || !changed;
    $('settings-reset-category').disabled = restoringSettings;
    $('settings-reset').disabled = restoringSettings || !!activeSave;
    paintPreset();
  }
  async function restoreSettings(candidate, label, preset) {
    if (restoringSettings || !settingsOpen) return;
    restoringSettings = true;
    clearTimeout(saveTimer);
    $('settings-panel').inert = true;
    updateUndo();
    try {
      if (activeSave) await activeSave;
      $('save-status').textContent = t('SAVING…');
      document.querySelector('.session-save').classList.add('busy');
      const response = await post('settings', preset ? { preset } : { settings: candidate });
      if (!response.ok) throw Error(response.error || t('Could not apply the change.'));
      revision++;
      dirty = false;
      updateSettings(response.settings || candidate);
      $('save-status').textContent = t('CHANGES SAVED');
      notice(label);
    } catch (error) {
      $('save-status').textContent = t('RESTORE FAILED');
      notice(error.message || t('The settings could not be restored.'), 'error');
    } finally {
      restoringSettings = false;
      $('settings-panel').inert = false;
      document.querySelector('.session-save').classList.remove('busy');
      updateUndo();
      if (settingsOpen && menu) focusRow(rowIndex, true);
    }
  }
  function selectPreview(mode) {
    if (mode !== 'vehicle' && previewScenario === 'fuel') {
      previewScenario = 'live';
      $('preview-scenario').value = 'live';
    }
    previewMode = mode;
    document
      .querySelectorAll('[data-preview-mode]')
      .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.previewMode === mode)));
    $('preview-vehicle-kind').hidden = mode !== 'vehicle';
    paintPreview();
  }
  function previewVehicle() {
    if (previewScenario === 'fuel')
      return {
        speed: 75,
        gear: '3',
        rpm: 0.65,
        fuel: 6,
        engineHealth: 250,
        belt: false,
        canBelt: true,
        class: 0,
      };
    if (previewMode === 'foot') return false;
    if (previewMode === 'live') return state.vehicle;
    return {
      speed: 0,
      gear: 'N',
      rpm: 0.22,
      fuel: 68,
      belt: true,
      canBelt: ![8, 13, 14, 15, 16, 21].includes(previewClass),
      class: previewClass,
    };
  }
  let presets = {
    minimal: {
      adaptiveHud: true,
      opacity: 0.45,
      onFoot: false,
      location: true,
      voice: true,
      fuelIndicator: true,
      beltIndicator: true,
      gps: true,
      vehicleAlerts: true,
    },
    balanced: {
      adaptiveHud: true,
      opacity: 0.6,
      onFoot: true,
      location: true,
      voice: true,
      fuelIndicator: true,
      beltIndicator: true,
      gps: true,
      vehicleAlerts: true,
    },
    detailed: {
      adaptiveHud: false,
      opacity: 0.8,
      onFoot: true,
      location: true,
      voice: true,
      fuelIndicator: true,
      beltIndicator: true,
      gps: true,
      vehicleAlerts: true,
    },
  };
  let warningThresholds = {
    fuelLow: 15,
    fuelCritical: 5,
    engineLow: 650,
    engineCritical: 300,
    bodyLow: 600,
    bodyCritical: 300,
  };
  const managedPresetKeys = new Set([
    'adaptiveHud',
    'opacity',
    'onFoot',
    'location',
    'voice',
    'fuelIndicator',
    'beltIndicator',
    'gps',
    'vehicleAlerts',
  ]);
  const presence = new Map();
  function finishPresence() {
    for (const [element, item] of presence) {
      clearTimeout(item.timer);
      element.hidden = !item.visible;
      item.timer = null;
    }
  }
  function setPresence(element, visible, immediate = false, move = false) {
    visible = visible === true;
    const old = presence.get(element);
    if (old && old.visible === visible) {
      if (immediate) {
        clearTimeout(old.timer);
        old.timer = null;
        element.hidden = !visible;
      }
      return;
    }
    if (old) clearTimeout(old.timer);
    const item = { visible, timer: null };
    presence.set(element, item);
    if (immediate || !motionAllowed()) {
      animations.get(element)?.cancel();
      element.hidden = !visible;
      return;
    }
    if (visible) {
      element.hidden = false;
      animate(
        element,
        move
          ? [
              { translate: '0 5px', opacity: 0 },
              { translate: '0 0', opacity: 1 },
            ]
          : [{ opacity: 0 }, { opacity: 1 }],
        180
      );
    } else if (!element.hidden) {
      animate(
        element,
        move
          ? [
              { translate: '0 0', opacity: 1 },
              { translate: '0 4px', opacity: 0 },
            ]
          : [{ opacity: 1 }, { opacity: 0 }],
        140
      );
      item.timer = setTimeout(() => {
        if (presence.get(element) === item) element.hidden = true;
      }, 140);
    }
  }
  function paintPreset() {
    const mode = ['minimal', 'balanced', 'detailed'].includes(settings.displayMode)
      ? settings.displayMode
      : 'custom';
    document.body.dataset.displayMode = mode;
    document.querySelectorAll('[data-preset]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.preset === mode));
      button.disabled = restoringSettings;
    });
    $('preset-status').textContent = {
      minimal: t('MINIMAL'),
      balanced: t('BALANCED'),
      detailed: t('DETAILED'),
      custom: t('CUSTOM'),
    }[mode];
  }
  function distanceText(value) {
    const meters = number(value, 0, 10000000);
    if (meters === null) return '—';
    return meters < 1000
      ? Math.max(0, Math.round(meters / 10) * 10) + ' m'
      : (meters / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' km';
  }
  let warningVehicle = null,
    fuelWarning = 0,
    engineWarning = 0,
    damageWarning = 0;
  function warningLevel(value, old, low, critical, recovery) {
    if (value === null) return 0;
    if (value <= critical || (old === 2 && value < critical + recovery)) return 2;
    if (value <= low || (old > 0 && value < low + recovery)) return 1;
    return 0;
  }
  function paintDriving(data) {
    const gps = map3d.navigationMeta(data.gps),
      showGps =
        settings.gps && data.visible && data.mapVisible && gps && number(gps.remaining, 0, 10000000) !== null;
    $('map-cluster').classList.toggle('without-location', !settings.location);
    setPresence($('gps-panel'), !!showGps, !data.visible || !data.mapVisible);
    if (showGps) {
      const labels = {
          left: t('Turn left'),
          right: t('Turn right'),
          uturn: 'Demi-tour',
          continue: t('Follow the route'),
          near: t('Destination nearby'),
        },
        direction = Object.prototype.hasOwnProperty.call(labels, gps.direction) ? gps.direction : 'continue';
      $('gps-direction').textContent = labels[direction];
      $('gps-distance').textContent =
        (gps.distanceKind === 'road-estimate' ? '≈ ' : '') + distanceText(gps.remaining);
      $('gps-step').textContent =
        gps.distanceKind === 'direct'
          ? t('STRAIGHT-LINE DISTANCE')
          : number(gps.turnDistance, 0, 1000) !== null
            ? t('Estimated heading · ≈ ') + distanceText(gps.turnDistance)
            : gps.distanceKind === 'road-estimate'
              ? t('ESTIMATED ROAD DISTANCE')
              : t('GPS ROUTE');
      if (gps.distanceKind === 'direct' && direction !== 'near') {
        $('gps-direction').textContent = t('Towards the marker');
      } else if (gps.phase === 'calculating' && direction !== 'near') {
        $('gps-direction').textContent = t('Calculating the route');
      } else if (gps.phase === 'unavailable' && direction !== 'near') {
        $('gps-direction').textContent = t('Towards the marker');
        $('gps-step').textContent = t('ROAD GUIDANCE UNAVAILABLE');
      }
      $('gps-destination').textContent = gps.nextStreet || gps.destination || '';
      const turn = number(gps.turnDistance, 1, 1000),
        showTurn =
          turn !== null &&
          !['near'].includes(direction) &&
          gps.distanceKind !== 'direct' &&
          gps.phase !== 'calculating' &&
          gps.phase !== 'unavailable';
      $('gps-manoeuvre').hidden = !showTurn;
      $('gps-turn').textContent = showTurn ? '≈ ' + distanceText(turn) : '';
      const navSymbol =
        direction === 'near'
          ? 'pin'
          : gps.phase === 'calculating'
            ? 'clock'
            : gps.distanceKind === 'direct' || gps.phase === 'unavailable'
              ? 'pin'
              : { left: 'left', right: 'right', uturn: 'uturn', continue: 'straight' }[direction];
      setIcon($('gps-arrow'), navSymbol || 'straight');
      markArrival(gps);
    }
    const vehicle = data.vehicle,
      showWarnings = !!vehicle && settings.vehicleHud && settings.vehicleAlerts;
    if (!vehicle || warningVehicle !== (vehicle.id ?? 'preview')) {
      warningVehicle = vehicle ? (vehicle.id ?? 'preview') : null;
      fuelWarning = 0;
      engineWarning = 0;
      damageWarning = 0;
    }
    const caps = capabilities(vehicle);
    fuelWarning =
      vehicle && caps.fuel
        ? warningLevel(
            number(vehicle.fuel),
            fuelWarning,
            warningThresholds.fuelLow,
            warningThresholds.fuelCritical,
            3
          )
        : 0;
    engineWarning =
      vehicle && caps.fuel
        ? warningLevel(
            number(vehicle.engineHealth, -4000, 1000),
            engineWarning,
            warningThresholds.engineLow,
            warningThresholds.engineCritical,
            50
          )
        : 0;
    $('fuel-alert').hidden = !showWarnings || !fuelWarning;
    $('engine-alert').hidden = !showWarnings || !engineWarning;
    $('fuel-alert').classList.toggle('critical', fuelWarning === 2);
    $('engine-alert').classList.toggle('critical', engineWarning === 2);
    $('fuel-alert-text').textContent = fuelWarning === 2 ? t('FUEL CRITICAL') : t('LOW FUEL');
    $('fuel-alert-value').textContent = vehicle ? Math.round(number(vehicle.fuel) ?? 0) + ' %' : '';
    $('engine-alert-text').textContent = engineWarning === 2 ? t('ENGINE CRITICAL') : t('DAMAGED ENGINE');
    $('engine-alert-value').textContent = vehicle
      ? Math.round((number(vehicle.engineHealth, 0, 1000) ?? 0) / 10) + ' %'
      : '';
    const tyres = Math.max(0, Math.round(number(vehicle?.tyres, 0, 6) ?? 0)),
      body = number(vehicle?.bodyHealth, 0, 1000);
    damageWarning =
      vehicle && caps.fuel
        ? tyres > 0
          ? 2
          : warningLevel(body, damageWarning, warningThresholds.bodyLow, warningThresholds.bodyCritical, 50)
        : 0;
    $('damage-alert').hidden = !showWarnings || !damageWarning;
    $('damage-alert').classList.toggle('critical', damageWarning === 2);
    $('damage-alert-text').textContent =
      tyres > 0
        ? tyres > 1
          ? t('BURST TYRES')
          : t('BURST TYRE')
        : damageWarning === 2
          ? t('BODY CRITICAL')
          : t('BODY DAMAGED');
    $('damage-alert-value').textContent =
      tyres > 0 ? String(tyres) : body === null ? '' : Math.round(body / 10) + ' %';
    $('vehicle-alerts').hidden = !showWarnings || (!fuelWarning && !engineWarning && !damageWarning);
  }

  function applyAppearance() {
    window.VantaExtras?.settings(settings);
    document.body.dataset.theme = settings.theme;
    document.body.classList.toggle('high-contrast', settings.highContrast === true);
    root.style.setProperty('--text-scale', number(settings.textScale, 0.9, 1.25) ?? 1);
    if (!layoutEditor) {
      root.style.setProperty('--vehicle-offset-x', `${settings.vehicleOffsetX * innerWidth}px`);
      root.style.setProperty('--vehicle-offset-y', `${settings.vehicleOffsetY * innerHeight}px`);
    }
    paintFavorite();
  }
  function paintFavorite() {
    const slots = favoriteSlots(),
      labels = { map: t('MAP'), gamesettings: t('SETTINGS'), inventory: t('INVENTORY'), phone: t('PHONE') };
    if (!slots[activeFavorite]) activeFavorite = 0;
    for (let index = 0; index < 3; index++) {
      const action = slots[index],
        suffix = index ? '-' + (index + 1) : '',
        button = $('menu-favorite' + suffix),
        source = buttons.find((b) => b.dataset.action === action);
      button.hidden = !action;
      button.disabled = !source || source.disabled;
      button.classList.toggle('favorite-selected', index === activeFavorite);
      $('favorite-label' + suffix).textContent = labels[action] || t('NONE');
      $('favorite-icon' + suffix).setAttribute('href', '#ui-' + (action || 'star'));
      button.title = source?.disabled
        ? t('Resource unavailable')
        : 'Ouvrir ' + (labels[action] || '').toLowerCase();
    }
  }
  function activateFavorite(index = activeFavorite) {
    const action = favoriteSlots()[index],
      source = buttons.find((button) => button.dataset.action === action);
    if (source) activate(source);
  }
  $('menu-favorite').addEventListener('click', () => {
    activeFavorite = 0;
    activateFavorite(0);
  });
  const recentMeters = new Map();
  let lastStreet = '',
    crossUntil = 0,
    crossTimer;
  function highlightChange(element, value, id) {
    if (!['health', 'armour', 'hunger', 'thirst'].includes(id)) return;
    let previous = recentMeters.get(element);
    if (!previous) {
      previous = { value, timer: null };
      recentMeters.set(element, previous);
      return;
    }
    if (value !== null && previous.value !== null && Math.abs(value - previous.value) >= 3) {
      element.classList.add('recent-change');
      element.classList.remove('adaptive-muted');
      clearTimeout(previous.timer);
      previous.timer = setTimeout(() => {
        element.classList.remove('recent-change');
        markAdaptive(element, previous.value, id);
      }, 2200);
    }
    previous.value = value;
  }
  function locationSubtitle(data) {
    if (data.street && data.street !== lastStreet) {
      const hadStreet = !!lastStreet;
      lastStreet = data.street;
      if (hadStreet && data.crossStreet && data.crossStreet !== data.street) {
        crossUntil = performance.now() + 4000;
        clearTimeout(crossTimer);
        crossTimer = setTimeout(() => {
          $('zone').textContent = state.zone || '';
        }, 4000);
      }
    }
    return performance.now() < crossUntil && data.crossStreet ? '↳ ' + data.crossStreet : data.zone || '';
  }
  let voiceIndex = null,
    voiceDistance = null,
    voiceUntil = 0,
    voiceTimer;
  function paintContext(data) {
    const c = data.context || {},
      now = performance.now();
    const voiceChanged =
      voiceIndex !== null && (data.voice !== voiceIndex || c.voiceDistance !== voiceDistance);
    if (voiceChanged) {
      voiceUntil = now + 2400;
      clearTimeout(voiceTimer);
      voiceTimer = setTimeout(() => paintContext(state), 2450);
    }
    voiceIndex = data.voice ?? null;
    voiceDistance = c.voiceDistance;
    const available =
      data.visible &&
      data.statusVisible !== false &&
      !data.bigmap &&
      !menu &&
      settings.voice &&
      settings.voiceDetails;
    const offline = c.voiceConnected === false || c.micMuted === true;
    const speaking = c.radio === true || data.talking === true;
    const voiceShown = available && (offline || speaking || now < voiceUntil);
    setPresence($('voice-detail'), !!voiceShown, !data.visible);
    $('voice-detail').classList.toggle('radio-talking', c.radio === true);
    setUse($('voice-detail'), offline ? 'muted' : c.radio ? 'radio' : 'voice');
    $('voice-detail').classList.toggle('voice-offline', offline);
    $('voice-detail-label').textContent = offline
      ? c.micMuted === true
        ? t('MIC MUTED')
        : t('VOICE OFFLINE')
      : c.radio
        ? t('RADIO TRANSMISSION')
        : data.talking
          ? t('PROXIMITY')
          : t('VOICE RANGE');
    $('voice-detail-value').textContent = offline
      ? '—'
      : c.radio
        ? (number(c.radioChannel, 0, 999999) ?? '—') + ' CH'
        : number(c.voiceDistance, 0, 10000) !== null
          ? c.voiceDistance + ' m'
          : { 1: t('LOW'), 2: t('NORMAL'), 3: t('HIGH') }[data.voice] || '';
    const oxygen = number(c.oxygen, 0, 100000),
      stamina = number(c.stamina);
    const effortInCounter = data.vehicle?.class === 13 && settings.vehicleHud;
    const show =
      data.visible &&
      data.statusVisible !== false &&
      !data.bigmap &&
      !menu &&
      settings.contextual &&
      (c.dead || oxygen !== null || (stamina !== null && !effortInCounter));
    setPresence($('context-strip'), !!show, !data.visible);
    $('context-strip').classList.toggle(
      'critical',
      c.dead || (oxygen !== null && oxygen <= 3) || (stamina !== null && stamina <= 20)
    );
    $('context-strip').classList.toggle('is-dead', c.dead === true);
    if (oxygen !== null) {
      if ($('context-symbol').dataset.symbol !== 'oxygen') {
        $('context-symbol').dataset.symbol = 'oxygen';
        $('context-symbol').textContent = 'O₂';
      }
    } else setIcon($('context-symbol'), c.dead ? 'warning' : 'run');
    $('context-title-live').textContent = c.dead
      ? t('CHARACTER DOWN')
      : oxygen !== null
        ? t('OXYGEN')
        : t('STAMINA');
    $('context-value').textContent = c.dead
      ? ''
      : oxygen !== null
        ? oxygen.toFixed(1) + ' s'
        : stamina !== null
          ? stamina + ' %'
          : '';
    $('context-fill').style.transform =
      'scaleX(' +
      (c.dead
        ? 0
        : oxygen !== null
          ? Math.min(1, oxygen / Math.max(1, number(c.oxygenScale, 1, 10000) ?? 10))
          : (stamina ?? 0) / 100) +
      ')';
  }
  function paintVehicleState(data) {
    const vehicle = data.vehicle,
      caps = capabilities(vehicle),
      engineOff = vehicle?.engineOn === false && caps.fuel;
    const show = data.visible && !menu && settings.vehicleHud && vehicle && engineOff;
    $('vehicle-state').hidden = !show;
    $('vehicle-state').textContent = show ? t('ENGINE OFF') : '';
    $('vehicle-context').classList.toggle('has-state', !!show);
    paintVehicleDetails($('vehicle'), vehicle, data.statusVisible === false ? {} : data.context || {});
  }
  function paintVehicleDetails(target, vehicle, context) {
    const air = vehicle && [15, 16].includes(vehicle.class),
      altitude = number(vehicle?.altitude, 0, 100000),
      extra = target.querySelector('.vehicle-extra');
    extra.hidden = !air || altitude === null;
    if (!extra.hidden) extra.querySelector('strong').textContent = Math.round(altitude) + ' m';
    const effort = target.querySelector('.cycle-effort'),
      stamina = number(context.stamina);
    effort.hidden = !vehicle || vehicle.class !== 13 || !settings.contextual || stamina === null;
    if (!effort.hidden) {
      effort.querySelector('strong').textContent = stamina + ' %';
      effort.querySelector('.track i').style.transform = 'scaleX(' + stamina / 100 + ')';
      effort.classList.toggle('low', stamina <= 20);
    }
  }

  const arrivals = new Set();
  function markArrival(gps) {
    if (gps.direction !== 'near' || !gps.routeId || arrivals.has(gps.routeId)) return;
    arrivals.add(gps.routeId);
    if (arrivals.size > 16) arrivals.delete(arrivals.values().next().value);
    notice(t('You are near the marker.'), 'success', t('DESTINATION NEARBY'), 3200);
  }
  function paintContextPreview() {
    const sample = previewData(),
      c = sample.context || {},
      vehicle = previewVehicle(),
      lines = [];
    if (settings.gps && state.gps)
      lines.push((state.gps.destination || 'DESTINATION') + ' · ' + distanceText(state.gps.remaining));
    if (settings.voice && settings.voiceDetails && (c.radio || sample.talking))
      lines.push(
        c.radio
          ? t('RADIO · ') + (c.radioChannel ?? '—') + ' CH'
          : t('PROXIMITY · ') +
              (number(c.voiceDistance, 0, 10000) !== null
                ? c.voiceDistance + ' m'
                : { 1: t('LOW'), 2: t('NORMAL'), 3: t('HIGH') }[state.voice] || t('NORMAL'))
      );
    if (settings.contextual && number(c.oxygen, 0, 100000) !== null)
      lines.push(t('OXYGEN · ') + c.oxygen + ' s');
    else if (settings.contextual && number(c.stamina) !== null)
      lines.push(t('STAMINA · ') + c.stamina + ' %');
    if (vehicle && [15, 16].includes(vehicle.class))
      lines.push(t('GROUND ALTITUDE · ') + Math.round(vehicle.altitude ?? 0) + ' m');
    $('preview-context').hidden = !lines.length;
    $('preview-context').textContent = lines.join('   /   ');
  }

  const notificationQueue = [],
    activeNotices = new Map();
  let nextNotice = 0;
  function cleanNotice(value, max = 1024) {
    return String(value ?? '')
      .replace(/<br\s*\/?\s*>|~br~/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/~[^~\n]{1,40}~/g, '')
      .trim()
      .slice(0, max);
  }
  function dismissNotice(id) {
    const item = activeNotices.get(id);
    if (!item || item.exiting) return;
    item.exiting = true;
    clearTimeout(item.timer);
    const delay = motionAllowed() ? 120 : 0;
    animate(
      item.element,
      [
        { translate: '0 0', opacity: 1 },
        { translate: '8px 0', opacity: 0 },
      ],
      120
    );
    item.timer = setTimeout(() => {
      activeNotices.delete(id);
      item.element.remove();
      showNextNotice();
    }, delay);
  }
  function showNextNotice() {
    while (activeNotices.size < 3 && notificationQueue.length) {
      const data = notificationQueue.shift(),
        id = ++nextNotice,
        card = document.createElement('article'),
        mark = document.createElement('span'),
        body = document.createElement('div'),
        title = document.createElement('strong'),
        message = document.createElement('p'),
        count = document.createElement('span');
      card.className = 'notification notification-' + data.kind;
      mark.className = 'notification-mark';
      mark.append(
        makeIcon({ info: 'info', success: 'success', warning: 'warning', error: 'error' }[data.kind])
      );
      title.textContent = data.title;
      message.textContent = data.message;
      count.className = 'notification-count';
      count.hidden = !(data.count > 1);
      count.textContent = '×' + (data.count || 1);
      body.append(title, message);
      card.append(mark, body, count, createFrame());
      $('notifications').append(card);
      const item = {
        ...data,
        element: card,
        count: data.count || 1,
        countElement: count,
        timer: setTimeout(() => dismissNotice(id), data.duration),
      };
      activeNotices.set(id, item);
      animate(
        card,
        [
          { translate: '10px 0', opacity: 0 },
          { translate: '0 0', opacity: 1 },
        ],
        180
      );
    }
  }
  function notice(message, kind = 'info', title = '', duration = 4000) {
    if (typeof message === 'object' && message) {
      ({ message, kind = 'info', title = '', duration = 4000 } = message);
    }
    message = cleanNotice(message);
    if (!message) return;
    kind = ['info', 'success', 'warning', 'error'].includes(kind) ? kind : 'info';
    title =
      cleanNotice(title, 80) ||
      {
        info: t('INFORMATION'),
        success: t('CONFIRMATION'),
        warning: t('WARNING'),
        error: t('ACTION FAILED'),
      }[kind];
    duration = Math.max(1800, Math.min(10000, Number(duration) || 4000));
    for (const [id, item] of activeNotices) {
      if (!item.exiting && item.message === message && item.title === title && item.kind === kind) {
        item.count = Math.min(99, item.count + 1);
        item.countElement.hidden = false;
        item.countElement.textContent = '×' + item.count;
        clearTimeout(item.timer);
        item.timer = setTimeout(() => dismissNotice(id), duration);
        return;
      }
    }
    const queued = notificationQueue.find(
      (item) => item.message === message && item.title === title && item.kind === kind
    );
    if (queued) {
      queued.count = Math.min(99, (queued.count || 1) + 1);
      queued.duration = Math.max(queued.duration, duration);
      return;
    }
    duration = Math.max(duration, Math.min(10000, 1800 + message.length * 35));
    const priority = { error: 3, warning: 2, success: 1, info: 0 };
    if (notificationQueue.length >= 6) {
      const last = notificationQueue.length - 1;
      if (priority[kind] < priority[notificationQueue[last].kind]) return;
      notificationQueue.splice(last, 1);
    }
    notificationQueue.push({ message, kind, title, duration, count: 1 });
    notificationQueue.sort((a, b) => priority[b.kind] - priority[a.kind]);
    if (activeNotices.size >= 3 && priority[kind] >= 2) {
      const lower = [...activeNotices].find(
        ([, item]) => !item.exiting && priority[item.kind] < priority[kind]
      );
      if (lower) dismissNotice(lower[0]);
    }
    showNextNotice();
  }

  function meter(id, value) {
    const element = $(id),
      v = number(value);
    if (id === 'hunger' || id === 'thirst') element.hidden = v === null;
    element.classList.toggle('unknown', v === null);
    markAdaptive(element, v, id);
    element.classList.toggle('low', settings.lowAlerts && v !== null && v <= threshold && id !== 'armour');
    element.style.setProperty('--value', (v ?? 0) / 100);
    element.setAttribute('aria-valuenow', String(v ?? 0));
    highlightChange(element, v, id);
    const valueElement = $(`${id}-value`);
    if (valueElement)
      valueElement.textContent = v === null ? '—' : `${Math.round(v)}${id === 'fuel' ? ' %' : ''}`;
  }
  function syncMap3d() {
    map3d.update(state, mapBackendEnabled ? settings : { ...settings, map3d: false }, {
      menu,
      settings: settingsOpen,
      editing: !!layoutEditor,
      scenario: previewScenario,
    });
  }
  function paintCounter(data) {
    const vehicle = data.vehicle;
    setPresence($('vehicle'), !!vehicle && settings.vehicleHud, !data.visible, true);
    if (vehicle && typeof vehicle === 'object') {
      const speed = String(Math.round(number(vehicle.speed, 0, 999) ?? 0)).padStart(3, '0');
      const dim = speed.match(/^0{1,2}/)?.[0] || '';
      if ($('speed').dataset.value !== speed) {
        const span = document.createElement('span');
        span.className = 'speed-dim';
        span.textContent = dim;
        $('speed').replaceChildren(span, document.createTextNode(speed.slice(dim.length)));
        $('speed').dataset.value = speed;
      }
      $('speed-unit').textContent = vehicle.unit || (settings.speedUnit === 'mph' ? 'MPH' : 'KM/H');
      $('gear').textContent = String(vehicle.gear ?? 'N').slice(0, 2);
      const rpm = number(vehicle.rpm, 0, 1) ?? 0,
        segments = document.querySelectorAll('#rpm i');
      $('rpm').setAttribute('aria-valuenow', String(Math.round(rpm * 100)));
      segments.forEach((segment, index) =>
        segment.classList.toggle('filled', index < Math.round(rpm * segments.length))
      );
      meter('fuel', vehicle.fuel);
      $('fuel').hidden = !settings.fuelIndicator;
      $('belt').hidden = !vehicle.canBelt || !settings.beltIndicator;
      $('belt').classList.toggle('fastened', vehicle.belt === true);
      $('belt').classList.toggle('warning', settings.lowAlerts && !vehicle.belt && vehicle.speed > 20);
      $('belt').setAttribute('aria-label', vehicle.belt ? t('Seatbelt fastened') : t('Seatbelt unfastened'));
      $('belt').title = vehicle.belt ? t('Seatbelt fastened') : t('Seatbelt unfastened');
      paintVehicle($('vehicle'), vehicle);
    }
  }
  function render(data) {
    state = data;
    window.VantaExtras?.state(data);
    $('menu-zone').textContent = data.zone || 'LOS SANTOS';
    $('menu-street').textContent = data.street || '';
    $('menu-clock').textContent = data.clock || '';
    $('hud').hidden = !data.visible || (menu && !layoutEditor);
    $('map-cluster').hidden = !data.visible || data.bigmap === true;
    $('map-cluster').classList.toggle('no-map', !data.mapVisible);
    $('map-frame').hidden = !data.mapVisible;
    $('location').hidden = !settings.location || !data.mapVisible;
    document.querySelector('#hud .vitals').hidden = data.statusVisible === false;
    document.querySelector('#hud .needs').hidden = data.statusVisible === false;
    for (const id of ['health', 'armour', 'hunger', 'thirst']) meter(id, data[id]);
    setPresence(
      $('armour'),
      settings.armourZero || data.armour > 0,
      !data.visible || data.statusVisible === false
    );
    $('street').textContent = data.street || 'LOS SANTOS';
    $('zone').textContent = locationSubtitle(data);
    $('clock').textContent = data.clock || '';
    $('direction').textContent = t(data.heading || 'N');
    $('voice').hidden = !settings.voice;
    $('voice').classList.toggle('talking', data.talking === true || data.context?.radio === true);
    $('voice').classList.toggle('radio-talking', data.context?.radio === true);
    $('voice').classList.toggle(
      'disconnected',
      data.context?.voiceConnected === false || data.context?.micMuted === true
    );
    setUse($('voice'), data.context?.micMuted ? 'muted' : data.context?.radio ? 'radio' : 'voice');
    const voice = number(data.voice, 1, 3) ?? 2;
    $('voice').setAttribute(
      'aria-label',
      data.context?.radio
        ? t('Radio transmission')
        : data.context?.micMuted
          ? t('Mic muted')
          : data.context?.voiceConnected === false
            ? t('Voice offline')
            : t('Voice range {0}, {1}', voice, data.talking ? t('talking') : t('silent'))
    );
    document
      .querySelectorAll('#voice .voice-bars i')
      .forEach((el, i) => el.classList.toggle('active', i < voice));
    paintCounter(data);
    paintDriving(data);
    paintContext(data);
    paintVehicleState(data);
    if (settingsOpen) paintPreview();
    syncMap3d();
  }
  function layout(data) {
    layoutMetrics = { ...layoutMetrics, ...data };
    if (!layoutEditor) {
      for (const key of placementKeys) if (number(data[key], -1, 1) !== null) settings[key] = data[key];
      root.style.setProperty('--vehicle-offset-x', `${settings.vehicleOffsetX * innerWidth}px`);
      root.style.setProperty('--vehicle-offset-y', `${settings.vehicleOffsetY * innerHeight}px`);
    }
    if (data.limits)
      for (const category of categories)
        for (const spec of category.rows) {
          const bounds = data.limits[spec.key];
          if (bounds) {
            spec.min = Math.ceil(bounds[0] * 1000) / 1000;
            spec.max = Math.floor(bounds[1] * 1000) / 1000;
          }
        }
    if (settingsOpen && !layoutEditor) paintRows();
    for (const [key, css] of Object.entries({
      left: '--map-x',
      top: '--map-y',
      width: '--map-w',
      height: '--map-h',
      unit: '--u',
      right: '--safe-right',
      bottom: '--safe-bottom',
      safeTop: '--safe-top',
    })) {
      if (layoutEditor && (key === 'left' || key === 'top')) continue;
      const v = number(data[key], -2000, 20000);
      if (v !== null) root.style.setProperty(css, `${v}px`);
    }
    if (layoutEditor) applyMapPlacement();
    if (number(data.unit, 0.1, 10) !== null)
      baseUnit = data.unit / (number(data.scale, 0.8, 1.3) ?? settings.scale);
    root.style.setProperty('--vehicle-u', `${baseUnit * settings.vehicleScale}px`);
    if (layoutEditor) paintEditor();
    syncMap3d();
  }
  function updateSettings(value) {
    settings = { ...defaults, ...value };
    settings.mapTheme = 'auto';
    settings.map3d = mapBackendEnabled;
    if (!['low', 'balanced', 'high'].includes(settings.mapQuality)) settings.mapQuality = 'balanced';
    const used = new Set([settings.favoriteAction]);
    for (const key of ['favoriteAction2', 'favoriteAction3']) {
      if (used.has(settings[key])) settings[key] = 'none';
      if (settings[key] !== 'none') used.add(settings[key]);
    }
    if (!['classic', 'cyan', 'rp'].includes(settings.blipStyle)) settings.blipStyle = 'classic';
    if (!['sage', 'cyan', 'amber'].includes(settings.theme)) settings.theme = 'sage';
    document.body.classList.toggle('no-motion', !settings.motion);
    if (!settings.motion) cancelMotion();
    root.style.setProperty('--hud-opacity', number(settings.opacity, 0.35, 0.9) ?? 0.6);
    root.style.setProperty('--vehicle-u', `${baseUnit * settings.vehicleScale}px`);
    applyAppearance();
    paintRows();
    render(state);
    if (settingsOpen) paintPreview();
    updateUndo();
    paintPreset();
  }
  function choose(index, focus = false) {
    const previous = selected;
    selected = (index + buttons.length) % buttons.length;
    if (buttons[selected].disabled) {
      const first = buttons.findIndex((button) => !button.disabled);
      selected = first < 0 ? 0 : first;
    }
    buttons.forEach((b, i) => {
      b.classList.toggle('selected', i === selected);
      b.setAttribute('aria-current', i === selected ? 'true' : 'false');
    });
    if (focus) buttons[selected].focus({ preventScroll: true });
    paintMenuDetail();
    if (previous !== selected) {
      uiSound('move');
    }
    if (previous !== selected)
      animate(
        buttons[selected].querySelector('.action-text'),
        [
          { translate: '0 4px', opacity: 0.6 },
          { translate: '0 0', opacity: 1 },
        ],
        150
      );
  }
  function toggleMenu(open) {
    window.VantaExtras?.menu(open === true);
    controls.close();
    map3d.setFullscreen(false);
    const previous = menu;
    if (layoutEditor) clearLayoutEditor();
    menu = open === true;
    document.body.classList.toggle('menu-visible', menu);
    menuGeneration++;
    const generation = menuGeneration;
    if (menu) {
      $('quick-menu').hidden = false;
      animate($('quick-menu'), [{ opacity: 0 }, { opacity: 1 }], 160);
    } else if (previous) {
      animate($('quick-menu'), [{ opacity: 1 }, { opacity: 0 }], 100);
      setTimeout(
        () => {
          if (generation === menuGeneration && !menu) $('quick-menu').hidden = true;
        },
        motionAllowed() ? 100 : 0
      );
    } else $('quick-menu').hidden = true;
    $('hud').hidden = menu || !state.visible;
    hideSettings(false);
    cancelAnimationFrame(gamepadFrame);
    if (menu) {
      choose(0, true);
      previousPad = [];
      pollGamepad();
      enterMenu();
    }
    syncMap3d();
  }
  function showSettings() {
    if (settingsOpen) return;
    openingSettings = { ...settings };
    settingsOpen = true;
    updateUndo();
    $('settings-panel').hidden = false;
    $('quick-menu').classList.add('settings-open');
    $('quick-menu').setAttribute('aria-label', t('Settings'));
    $('quick-menu').removeAttribute('aria-labelledby');
    switchTab(number(settings.lastTab, 0, 4) ?? 0, false);
    paintPreview();
    focusRow(rowIndex, true);
    animate(
      $('settings-panel'),
      [
        { translate: '0 8px', opacity: 0 },
        { translate: '0 0', opacity: 1 },
      ],
      220
    );
  }
  async function hideSettings(focus = true) {
    if (restoringSettings && focus) return;
    if (focus && !(await save())) return;
    controls.close();
    closeCatalog(false);
    previewScenario = 'live';
    $('preview-scenario').value = 'live';
    settingsOpen = false;
    $('settings-panel').hidden = true;
    $('quick-menu').classList.remove('settings-open');
    $('quick-menu').removeAttribute('aria-label');
    $('quick-menu').setAttribute('aria-labelledby', 'menu-title');
    if (focus && menu) {
      choose(selected, true);
      enterMenu();
    }
    syncMap3d();
  }
  async function close() {
    if (restoringSettings || !(await save())) return;
    try {
      const result = await post('close');
      if (!result.ok) throw Error();
    } catch {
      notice(t('Could not close. Try again with Esc or F1.'));
    }
  }
  async function activate(button) {
    if (button.disabled || activationBusy || restoringSettings) return;
    activationBusy = true;
    button.classList.add('activating');
    button.setAttribute('aria-busy', 'true');
    try {
      if (button.dataset.action === 'settings') {
        showSettings();
        return;
      }
      if (!(await save())) return;
      const response = await post('action', { id: button.dataset.action });
      if (!response.ok) notice(response.error || t('Action unavailable.'), 'error');
    } catch {
      notice(t('This action is not responding.'), 'error');
    } finally {
      activationBusy = false;
      button.classList.remove('activating');
      button.removeAttribute('aria-busy');
    }
  }
  async function save() {
    clearTimeout(saveTimer);
    if (activeSave) return activeSave;
    if (!dirty) return true;
    $('settings-reset').disabled = true;
    activeSave = (async () => {
      try {
        // One request at a time; newer changes are sent afterwards.
        while (dirty) {
          const submitted = { ...settings },
            submittedRevision = revision;
          $('save-status').textContent = t('SAVING…');
          document.querySelector('.session-save').classList.add('busy');
          const result = await post('settings', { settings: submitted });
          if (!result.ok) throw Error(result.error || t('Local save failed.'));
          if (revision === submittedRevision) {
            dirty = false;
            updateSettings(result.settings || submitted);
          }
        }
        $('save-status').textContent = t('CHANGES SAVED');
        return true;
      } catch (error) {
        $('save-status').textContent = t('SAVE FAILED');
        notice(error.message || t('Settings not saved. Try again before closing.'), 'error');
        return false;
      } finally {
        activeSave = null;
        updateUndo();
        document.querySelector('.session-save').classList.remove('busy');
      }
    })();
    return activeSave;
  }
  function changed(key, value) {
    if (restoringSettings) return;
    if (favoriteKeys.includes(key) && value !== 'none') {
      const other = favoriteKeys.find((k) => k !== key && settings[k] === value);
      if (other)
        settings[other] = settings[key] === 'none' && other === 'favoriteAction' ? 'map' : settings[key];
    }
    settings[key] = value;
    uiSound('adjust');
    if (managedPresetKeys.has(key)) settings.displayMode = 'custom';
    dirty = true;
    revision++;
    if (!settings.motion) cancelMotion();
    document.body.classList.toggle('no-motion', !settings.motion);
    root.style.setProperty('--hud-opacity', settings.opacity);
    root.style.setProperty('--vehicle-u', `${baseUnit * settings.vehicleScale}px`);
    applyAppearance();
    paintRows();
    paintPreview();
    render(state);
    updateUndo();
    paintPreset();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 160);
  }
  function valueText(spec) {
    if (spec.min !== undefined) return spec.format(settings[spec.key]);
    if (spec.options) return spec.options.find(([v]) => v === settings[spec.key])?.[1] || '';
    return settings[spec.key] ? t('ON') : t('OFF');
  }
  function adjust(spec, delta) {
    if (spec.min !== undefined) {
      const value = number(settings[spec.key] + delta * spec.step, spec.min, spec.max);
      changed(spec.key, Math.round(value * 10000) / 10000);
    } else if (spec.options) {
      const i = spec.options.findIndex(([v]) => v === settings[spec.key]);
      changed(spec.key, spec.options[(i + delta + spec.options.length) % spec.options.length][0]);
    } else changed(spec.key, !settings[spec.key]);
  }
  function paintRows() {
    categories[tab].rows.forEach((spec) => {
      const row = document.querySelector(`[data-row="${spec.key}"]`);
      if (!row) return;
      row.querySelector('output').textContent = valueText(spec);
      row.querySelector('output').classList.toggle('off', settings[spec.key] === false);
      const input = row.querySelector('input');
      if (input) {
        input.min = spec.min;
        input.max = spec.max;
        input.value = settings[spec.key];
        input.style.setProperty(
          '--progress',
          `${((settings[spec.key] - spec.min) / Math.max(0.0001, spec.max - spec.min)) * 100}%`
        );
      }
      row
        .querySelectorAll('.setting-segments i')
        .forEach((el, i) =>
          el.classList.toggle(
            'on',
            spec.options
              ? i === spec.options.findIndex(([v]) => v === settings[spec.key])
              : i === (settings[spec.key] ? 1 : 0)
          )
        );
      row.setAttribute('aria-label', `${spec.label}, ${valueText(spec)}`);
    });
  }
  function focusRow(index, focus = false) {
    const previous = rowIndex;
    const specs = categories[tab].rows;
    rowIndex = (index + specs.length) % specs.length;
    const rows = [...document.querySelectorAll('.setting-row')];
    rows.forEach((row, i) => {
      row.classList.toggle('active', i === rowIndex);
      row.tabIndex = i === rowIndex ? 0 : -1;
    });
    const spec = specs[rowIndex];
    $('detail-title').replaceChildren(
      makeIcon(rowIcons[spec.key] || 'settings'),
      document.createTextNode(spec.label)
    );
    $('detail-description').textContent = spec.description;
    $('detail-hint').textContent = spec.hint;
    $('detail-kicker').textContent = [
      t('SIZE AND READABILITY'),
      t('POSITION AND NAVIGATION'),
      t('READING AND DRIVING'),
      t('MARKERS AND IDENTIFICATION'),
      t('VISUAL COMFORT'),
    ][tab];
    $('setting-count').textContent =
      String(rowIndex + 1).padStart(2, '0') + ' / ' + String(specs.length).padStart(2, '0');
    if (previous !== rowIndex) uiSound('move');
    if (previous !== rowIndex)
      animate(
        document.querySelector('.detail-copy'),
        [
          { translate: '0 5px', opacity: 0.4 },
          { translate: '0 0', opacity: 1 },
        ],
        150
      );
    if (focus) {
      rows[rowIndex]?.focus({ preventScroll: true });
      rows[rowIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }
  function switchTab(index, focus = true) {
    controls.close();
    const previousTab = tab;
    if (index !== tab) uiSound('move');
    tab = (index + categories.length) % categories.length;
    rowIndex = 0;
    if (menu && settingsOpen && settings.lastTab !== tab) {
      settings.lastTab = tab;
      dirty = true;
      revision++;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, 250);
    }
    if (tab === 3) {
      previewScenario = 'live';
      $('preview-scenario').value = 'live';
    }
    const current = categories[tab];
    $('settings-category-label').textContent = `${String(tab + 1).padStart(2, '0')} / 05`;
    $('settings-title').textContent = current.label;
    $('settings-section-label').textContent =
      current.label === 'BLIPS' ? t('MARKERS AND IDENTIFICATION') : current.description;
    document.querySelectorAll('#settings-tabs button').forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === tab));
      button.tabIndex = i === tab ? 0 : -1;
    });
    $('category-description').textContent = current.description;
    $('settings-rows').setAttribute('aria-labelledby', `settings-tab-${tab}`);
    $('settings-rows').replaceChildren(
      ...current.rows.map((spec, index) => {
        const row = document.createElement('div');
        row.className = 'setting-row';
        row.dataset.row = spec.key;
        row.tabIndex = -1;
        const number = document.createElement('span');
        number.className = 'setting-index';
        number.append(makeIcon(rowIcons[spec.key] || 'settings'));
        row.append(number);
        const label = document.createElement('span');
        label.className = 'setting-label';
        const title = document.createElement('strong');
        title.textContent = spec.label;
        label.append(title);
        const caption = document.createElement('small');
        caption.textContent = spec.caption || spec.description;
        label.append(caption);
        label.id = `label-${spec.key}`;
        const controls = document.createElement('div');
        controls.className = 'setting-control';
        const left = document.createElement('button');
        left.textContent = '‹';
        left.tabIndex = -1;
        left.setAttribute('aria-label', `Diminuer : ${spec.label}`);
        const center = document.createElement('div');
        center.className = 'setting-value';
        const output = document.createElement('output');
        if (spec.min === undefined && !spec.options) output.className = 'toggle-value';
        center.append(output);
        if (spec.min !== undefined) {
          const input = document.createElement('input');
          input.type = 'range';
          input.min = spec.min;
          input.max = spec.max;
          input.step = spec.step;
          input.dataset.setting = spec.key;
          input.setAttribute('aria-labelledby', label.id);
          input.addEventListener('input', () => changed(spec.key, Number(input.value)));
          input.addEventListener('focus', () => focusRow(index));
          center.append(input);
        } else {
          const segments = document.createElement('div');
          segments.className = 'setting-segments';
          segments.setAttribute('aria-hidden', 'true');
          for (let i = 0; i < (spec.options?.length || 2); i++) segments.append(document.createElement('i'));
          center.append(segments);
        }
        const right = document.createElement('button');
        right.textContent = '›';
        right.tabIndex = -1;
        right.setAttribute('aria-label', `Augmenter : ${spec.label}`);
        left.addEventListener('click', () => adjust(spec, -1));
        right.addEventListener('click', () => adjust(spec, 1));
        row.addEventListener('mousemove', () => {
          if (rowIndex !== index) focusRow(index);
        });
        row.addEventListener('focus', () => focusRow(index));
        row.addEventListener('click', (event) => {
          focusRow(index);
          if (!event.target.closest('input,button')) row.focus({ preventScroll: true });
        });
        controls.append(left, center, right);
        row.append(label, controls);
        return row;
      })
    );
    $('setting-count').textContent = t(
      current.rows.length > 1 ? '{0} SETTINGS' : '{0} SETTING',
      current.rows.length
    );
    $('settings-preview').classList.toggle('blips-preview', tab === 3);
    $('blip-samples').hidden = tab !== 3;
    document.body.dataset.tab = tab;
    $('preset-toolbar').hidden = tab !== 0;
    $('style-cards').hidden = tab !== 3;
    $('catalog-open').hidden = tab !== 3;
    $('layout-open').hidden = ![0, 1, 2].includes(tab);
    paintRows();
    paintPreview();
    focusRow(0, focus);
    if (previousTab !== tab) {
      const dx = tab > previousTab ? 12 : -12;
      animate(
        $('settings-rows'),
        [
          { translate: dx + 'px 0', opacity: 0.35 },
          { translate: '0 0', opacity: 1 },
        ],
        150
      );
      animate($('settings-preview'), [{ opacity: 0.55 }, { opacity: 1 }], 140);
    }
    document.querySelectorAll('.setting-row').forEach((row, i) =>
      animate(
        row,
        [
          { translate: '0 7px', opacity: 0 },
          { translate: '0 0', opacity: 1 },
        ],
        170,
        i * 18
      )
    );
  }
  function paintPreview() {
    const sample = previewData();
    previewSignal();
    const tile = $('settings-preview'),
      group = tile.querySelector('.hud-group'),
      vehicle = tile.querySelector('.vehicle');
    const width = tile.clientWidth,
      previewBottom = width ? 1080 - tile.clientHeight / (width / 1920) + 36 : 120;
    if (width) tile.querySelector('.mini-stage').style.transform = `scale(${width / 1920})`;
    group.style.transform = `scale(${settings.scale})`;
    group.style.transformOrigin = 'bottom left';
    // The small preview anchors instruments in view; full-screen placement uses native bounds.
    group.style.left = '65px';
    group.style.bottom = `${previewBottom}px`;
    vehicle.style.bottom = `${previewBottom}px`;
    const shownVehicle = previewVehicle(),
      mapShown = settings.onFoot || !!shownVehicle;
    group.querySelector('.minimap').hidden = !mapShown;
    group.querySelector('.address').hidden = !settings.location || !mapShown;
    group.querySelector('.address strong').textContent = state.street || 'LOS SANTOS';
    group.querySelector('.address small').textContent = state.zone || '';
    group.querySelector('time').textContent = state.clock || '';
    group.querySelector('.compass').textContent = t(state.heading || 'N');
    group.querySelector('.voice').hidden = !settings.voice;
    group
      .querySelector('.voice')
      .classList.toggle('talking', sample.talking === true || sample.context.radio === true);
    group
      .querySelectorAll('.voice-bars i')
      .forEach((bar, index) => bar.classList.toggle('on', index < (number(state.voice, 1, 3) ?? 2)));
    for (const id of ['health', 'armour', 'hunger', 'thirst']) {
      const meter = group.querySelector('.' + id),
        value = number(sample[id]);
      meter.hidden =
        (id === 'armour' && !settings.armourZero && !(value > 0)) ||
        ((id === 'hunger' || id === 'thirst') && value === null);
      meter.querySelector('b').textContent = value === null ? '—' : Math.round(value);
      meter.querySelector('.track i').style.width = `${value ?? 0}%`;
      markAdaptive(meter, value, id);
      meter.classList.toggle(
        'low',
        settings.lowAlerts && value !== null && value <= threshold && id !== 'armour'
      );
    }
    group.querySelectorAll('.map-point').forEach((point, index) => {
      const src = `assets/blips/${settings.blipStyle}-${index ? 'merchant' : 'fishing'}.png`;
      if (point.getAttribute('src') !== src) point.src = src;
    });
    vehicle.hidden = !settings.vehicleHud || !shownVehicle;
    vehicle.style.transform = `scale(${settings.vehicleScale})`;
    vehicle.style.transformOrigin = 'bottom right';
    const v = shownVehicle;
    if (v) {
      const speed = String(Math.round(number(v.speed, 0, 999) ?? 0)).padStart(3, '0');
      vehicle.querySelector('.speed').textContent = speed;
      vehicle.querySelector('.gear strong').textContent = String(v.gear ?? 'N').slice(0, 2);
      vehicle.querySelector('.speed-unit').textContent = settings.speedUnit === 'mph' ? 'MPH' : 'KM/H';
      vehicle.querySelector('.vehicle-bottom>.track i').style.width = `${number(v.fuel) ?? 0}%`;
      vehicle.querySelector('.vehicle-bottom>b').textContent = `${Math.round(number(v.fuel) ?? 0)} %`;
      vehicle.querySelector('.belt').hidden = !settings.beltIndicator || !v.canBelt;
      vehicle
        .querySelectorAll('.vehicle-bottom>.icon,.vehicle-bottom>.track,.vehicle-bottom>b')
        .forEach((el) => (el.hidden = !settings.fuelIndicator));
      vehicle.querySelector('.vehicle-bottom').hidden =
        !settings.fuelIndicator && (!settings.beltIndicator || !v.canBelt);
    }
    if (v) {
      paintVehicle(vehicle, v, true);
      paintVehicleDetails(vehicle, v, sample.context || {});
      vehicle.querySelector('.speed-unit').textContent =
        v.class === 14 && settings.nautical
          ? 'KN'
          : v.unit || (settings.speedUnit === 'mph' ? 'MPH' : 'KM/H');
      vehicle.querySelector('.belt').classList.toggle('fastened', v.belt === true);
      vehicle
        .querySelector('.belt')
        .classList.toggle('warning', settings.lowAlerts && !v.belt && v.speed > 20);
      vehicle.querySelectorAll('.rpm i').forEach((segment, index, segments) => {
        const filled = index < Math.round((number(v.rpm, 0, 1) ?? 0) * segments.length);
        segment.classList.toggle('on', filled);
        segment.classList.toggle('filled', filled);
      });
    }
    document.querySelectorAll('[data-blipstyle]').forEach((button) => {
      const selected = button.dataset.blipstyle === settings.blipStyle;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    controls.sync();
    paintContextPreview();
    syncMap3d();
    if (blipPreviewStyle !== settings.blipStyle) {
      blipPreviewStyle = settings.blipStyle;
      $('blip-samples').replaceChildren(
        ...kinds.map(([kind, name]) => {
          const box = document.createElement('div'),
            img = new Image(),
            label = document.createElement('small');
          img.src = `assets/blips/${settings.blipStyle}-${kind}.png`;
          img.alt = name;
          label.textContent = name;
          box.append(img, label);
          return box;
        })
      );
    }
  }
  for (const [style, title, caption] of [
    ['classic', t('CLASSIC'), t('White silhouettes, dark outline.')],
    ['cyan', 'CYAN', t('Closed cyan frame, discreet background.')],
    ['rp', t('RP COLOURS'), t('A palette for each activity.')],
  ]) {
    const button = document.createElement('button');
    button.dataset.blipstyle = style;
    button.className = 'style-card';
    const info = document.createElement('div'),
      heading = document.createElement('strong'),
      copy = document.createElement('small'),
      icons = document.createElement('span'),
      check = document.createElement('span');
    heading.textContent = title;
    copy.textContent = caption;
    info.append(heading, copy);
    icons.className = 'style-card-icons';
    for (const kind of ['police', 'hospital', 'garage', 'shop', 'bank', 'fuel']) {
      const img = new Image();
      img.alt = '';
      img.src = `assets/blips/${style}-${kind}.png`;
      icons.append(img);
    }
    check.className = 'style-check';
    check.textContent = '✓';
    check.setAttribute('aria-hidden', 'true');
    button.append(info, icons, check);
    button.addEventListener('click', () => changed('blipStyle', style));
    $('style-cards').append(button);
  }

  function paintCatalog() {
    controls.sync();
    const query = $('catalog-search').value.trim().toLowerCase().slice(0, 100),
      category = $('catalog-category').value;
    const items = (window.HudBlipCatalog || []).filter(
      (e) => (!category || e.category === category) && (e.id + ' ' + e.name).toLowerCase().includes(query)
    );
    $('catalog-grid').style.setProperty(
      '--catalog-atlas',
      'url("assets/blips/' + settings.blipStyle + '.png")'
    );
    $('catalog-count').textContent = items.length + ' / ' + (window.HudBlipCatalog || []).length;
    $('catalog-grid').replaceChildren(
      ...items.map((e) => {
        const card = document.createElement('article'),
          icon = document.createElement('i'),
          copy = document.createElement('div'),
          title = document.createElement('strong'),
          name = document.createElement('span');
        icon.style.backgroundPosition = -(e.id % 32) * 32 + 'px ' + -Math.floor(e.id / 32) * 32 + 'px';
        icon.setAttribute('aria-hidden', 'true');
        title.textContent = '#' + e.id;
        name.textContent =
          e.name.replace(/^radar_/, '').replaceAll('_', ' ') + (e.visible ? '' : t(' · transparent'));
        copy.append(title, name);
        card.append(icon, copy);
        return card;
      })
    );
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'catalog-empty';
      empty.textContent = t('No blip matches this search.');
      $('catalog-grid').append(empty);
    }
  }
  function closeCatalog(focus = true) {
    if (!catalogOpen) return;
    controls.close();
    catalogOpen = false;
    $('blip-catalog').hidden = true;
    if (focus) $('catalog-open').focus();
  }
  $('catalog-open').addEventListener('click', () => {
    catalogOpen = true;
    $('blip-catalog').hidden = false;
    paintCatalog();
    $('catalog-search').focus();
  });
  $('catalog-close').addEventListener('click', () => closeCatalog());
  $('catalog-search').addEventListener('input', () => {
    clearTimeout(catalogTimer);
    catalogTimer = setTimeout(paintCatalog, 100);
  });
  $('catalog-category').addEventListener('change', paintCatalog);

  categories.forEach((category, index) => {
    const button = document.createElement('button');
    button.textContent = category.label;
    button.id = `settings-tab-${index}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'settings-rows');
    button.addEventListener('click', () => switchTab(index));
    $('settings-tabs').append(button);
  });
  buttons.forEach((button, index) => {
    button.addEventListener('mouseenter', () => button.classList.add('hovered'));
    button.addEventListener('mouseleave', () => button.classList.remove('hovered'));
    button.addEventListener('focus', () => choose(index));
    button.addEventListener('click', () => activate(button));
  });
  $('tab-prev').addEventListener('click', () => switchTab(tab - 1));
  $('tab-next').addEventListener('click', () => switchTab(tab + 1));
  $('settings-close').addEventListener('click', () => hideSettings());
  document
    .querySelectorAll('.menu-screen [data-go="hud"]')
    .forEach((button) => button.addEventListener('click', close));
  $('settings-reset').addEventListener('click', () =>
    restoreSettings({ ...defaults }, t('All settings have been reset.'))
  );
  $('settings-reset-category').addEventListener('click', () => {
    const candidate = { ...settings };
    for (const spec of categories[tab].rows) candidate[spec.key] = defaults[spec.key];
    if (categories[tab].rows.some((spec) => managedPresetKeys.has(spec.key)))
      candidate.displayMode = 'custom';
    restoreSettings(candidate, t('This tab has been reset.'));
  });
  $('settings-undo').addEventListener('click', () => {
    if (openingSettings)
      restoreSettings(
        { ...openingSettings },
        t('The settings from when you opened the menu have been restored.')
      );
  });
  document.querySelectorAll('[data-preset]').forEach((button) =>
    button.addEventListener('click', () => {
      const id = button.dataset.preset;
      restoreSettings({ ...settings, ...presets[id], displayMode: id }, '', id);
    })
  );
  document
    .querySelectorAll('[data-preview-mode]')
    .forEach((button) => button.addEventListener('click', () => selectPreview(button.dataset.previewMode)));
  $('preview-vehicle-kind').addEventListener('change', () => {
    previewClass = Number($('preview-vehicle-kind').value);
    paintPreview();
  });
  document.addEventListener('keydown', (event) => {
    if (map3d.key(event)) return;
    if (controls.key(event)) return;
    if (editorKey(event)) return;
    if (catalogOpen) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCatalog();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        const nodes = [$('catalog-close'), $('catalog-search'), controls.triggerFor('catalog-category')],
          i = nodes.indexOf(document.activeElement);
        nodes[(i + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length].focus();
      }
      return;
    }
    if (event.target instanceof HTMLSelectElement && !['Escape', 'Tab'].includes(event.key)) return;
    if (!menu) {
      if (preview && (event.key === 'F1' || event.key === 'Escape')) {
        event.preventDefault();
        toggleMenu(true);
      }
      return;
    }
    if (restoringSettings) {
      event.preventDefault();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      if (settingsOpen) hideSettings();
      else close();
      return;
    }
    if (event.key === 'Tab') {
      const scope = settingsOpen ? $('settings-panel') : document.querySelector('.menu-screen');
      const nodes = [...scope.querySelectorAll('button:not(:disabled),input,select,[tabindex="0"]')].filter(
        (el) => el.getClientRects().length && el.tabIndex >= 0
      );
      if (nodes.length) {
        event.preventDefault();
        let i = nodes.indexOf(document.activeElement);
        nodes[(i + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length].focus();
      }
      return;
    }
    if (settingsOpen) {
      const key = event.key.toLowerCase();
      if (key === 'q' || key === 'e') {
        event.preventDefault();
        switchTab(tab + (key === 'e' ? 1 : -1));
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        focusRow(rowIndex + (event.key === 'ArrowDown' ? 1 : -1), true);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        adjust(categories[tab].rows[rowIndex], event.key === 'ArrowRight' ? 1 : -1);
      } else if (event.key === 'Enter' && document.activeElement.classList.contains('setting-row')) {
        event.preventDefault();
        adjust(categories[tab].rows[rowIndex], 1);
      }
      return;
    }
    if ((['1', '2', '3'].includes(event.key) || /^Digit[123]$/.test(event.code)) && !event.repeat) {
      event.preventDefault();
      activateFavorite(Number(event.code.startsWith('Digit') ? event.code.slice(-1) : event.key) - 1);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      selectFavorite(activeFavorite + (event.key === 'ArrowRight' ? 1 : -1));
      return;
    }
    if (event.key.toLowerCase() === 'f' && !event.repeat) {
      event.preventDefault();
      activateFavorite(0);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      let i = selected;
      do {
        i = (i + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      } while (buttons[i].disabled && i !== selected);
      choose(i, true);
    }
  });
  function pollGamepad() {
    if (!menu) return;
    if (restoringSettings) {
      gamepadFrame = requestAnimationFrame(pollGamepad);
      return;
    }
    const pad = navigator.getGamepads?.()[0];
    if (pad) {
      const now = performance.now(),
        pressed = pad.buttons.map((b) => b.pressed);
      if (map3d.gamepad(pad, pressed, previousPad)) {
        previousPad = pressed;
        gamepadFrame = requestAnimationFrame(pollGamepad);
        return;
      }
      if (controls.gamepad(pad, pressed, previousPad, now)) {
        previousPad = pressed;
        gamepadFrame = requestAnimationFrame(pollGamepad);
        return;
      }
      if (editorGamepad(pad, pressed, now)) {
        previousPad = pressed;
        gamepadFrame = requestAnimationFrame(pollGamepad);
        return;
      }
      if (pressed[1] && !previousPad[1]) {
        if (catalogOpen) closeCatalog();
        else if (settingsOpen) hideSettings();
        else close();
      }
      if (catalogOpen) {
        if (now - lastPad > 140) {
          const direction = pressed[13] || pad.axes[1] > 0.6 ? 1 : pressed[12] || pad.axes[1] < -0.6 ? -1 : 0;
          if (direction) {
            $('catalog-grid').scrollTop += direction * 110;
            lastPad = now;
          }
          if ((pressed[4] && !previousPad[4]) || (pressed[5] && !previousPad[5])) {
            const select = $('catalog-category');
            select.selectedIndex =
              (select.selectedIndex + (pressed[5] ? 1 : -1) + select.options.length) % select.options.length;
            paintCatalog();
            lastPad = now;
          }
        }
        previousPad = pressed;
        gamepadFrame = requestAnimationFrame(pollGamepad);
        return;
      }
      if (now - lastPad > 190) {
        const dy = pressed[13] || pad.axes[1] > 0.6 ? 1 : pressed[12] || pad.axes[1] < -0.6 ? -1 : 0;
        if (settingsOpen) {
          const dx = pressed[15] || pad.axes[0] > 0.6 ? 1 : pressed[14] || pad.axes[0] < -0.6 ? -1 : 0;
          if (pressed[4] && !previousPad[4]) switchTab(tab - 1);
          else if (pressed[5] && !previousPad[5]) switchTab(tab + 1);
          else if (dy) focusRow(rowIndex + dy, true);
          else if (dx) adjust(categories[tab].rows[rowIndex], dx);
          if (pressed[3] && !previousPad[3]) {
            const actions = [
              ...document.querySelectorAll('#settings-panel button:not(:disabled),#settings-panel select'),
            ].filter(
              (el) =>
                el.getClientRects().length &&
                !el.closest('#settings-tabs,#blip-catalog') &&
                el.id !== 'tab-prev' &&
                el.id !== 'tab-next' &&
                el.tabIndex >= 0
            );
            const index = actions.indexOf(document.activeElement);
            actions[(index + 1) % actions.length]?.focus();
          }
          if (pressed[2] && !previousPad[2])
            selectPreview(
              ['live', 'foot', 'vehicle'][(['live', 'foot', 'vehicle'].indexOf(previewMode) + 1) % 3]
            );
          if (pressed[0] && !previousPad[0]) {
            if (document.activeElement.tagName === 'SELECT') {
              const select = document.activeElement;
              select.selectedIndex = (select.selectedIndex + 1) % select.options.length;
              select.dispatchEvent(new Event('change'));
            } else if (
              document.activeElement.tagName === 'BUTTON' &&
              document.activeElement.getClientRects().length
            )
              document.activeElement.click();
            else adjust(categories[tab].rows[rowIndex], 1);
          }
          if (dx || dy || pressed[4] || pressed[5]) lastPad = now;
        } else {
          if (pressed[14] && !previousPad[14]) selectFavorite(activeFavorite - 1);
          if (pressed[15] && !previousPad[15]) selectFavorite(activeFavorite + 1);
          if (dy) {
            let i = selected;
            do {
              i = (i + dy + buttons.length) % buttons.length;
            } while (buttons[i].disabled && i !== selected);
            choose(i, true);
            lastPad = now;
          }
          if (pressed[0] && !previousPad[0]) activate(buttons[selected]);
          if (pressed[2] && !previousPad[2]) activateFavorite();
        }
      }
      previousPad = pressed;
    }
    gamepadFrame = requestAnimationFrame(pollGamepad);
  }
  function receive(type, data) {
    if (!data || typeof data !== 'object') return;
    if (type === 'mapview') {
      controls.close();
      map3d.setFullscreen(data.open === true && menu);
      syncMap3d();
      if (!data.open && menu) choose(selected, true);
      return;
    }
    if (type === 'weapon') {
      window.VantaExtras?.weapon(data);
      return;
    }
    if (type === 'economy') {
      window.VantaExtras?.economy(data);
      return;
    }
    if (type === 'cinema') {
      window.VantaExtras?.cinema(data.on === true);
      return;
    }
    if (type === 'mapmotion') {
      window.VantaExtras?.pose(data);
      const pose = map3d.setMotion(data);
      if (pose && state.world) Object.assign(state.world, pose);
      return;
    }
    if (type === 'vehicleTelemetry') {
      const vehicle = data.vehicle;
      if (
        !vehicle ||
        typeof vehicle !== 'object' ||
        !state.vehicle ||
        !Number.isSafeInteger(vehicle.id) ||
        vehicle.id !== state.vehicle.id ||
        vehicle.class !== state.vehicle.class
      )
        return;
      state.vehicle = vehicle;
      paintCounter(state);
      paintDriving(state);
      paintVehicleState(state);
      window.VantaExtras?.relayout();
      return;
    }
    if (type === 'mapblips') {
      map3d.setBlips(data.blips);
      return;
    }
    if (type === 'maproute') {
      map3d.setRoute(data);
      return;
    }
    if (type === 'state') render(data);
    else if (type === 'layout') {
      layout(data);
      window.VantaExtras?.relayout();
    } else if (type === 'menu') {
      menuEpoch = number(data.epoch, 0, Number.MAX_SAFE_INTEGER) ?? menuEpoch;
      toggleMenu(data.open);
    } else if (type === 'notice' && typeof data.message === 'string') notice(data);
    else if (type === 'init') {
      mapBackendEnabled = data.map3dEnabled !== false;
      threshold = number(data.lowThreshold) ?? 20;
      if (data.presets && typeof data.presets === 'object') presets = data.presets;
      if (data.vehicleWarnings && typeof data.vehicleWarnings === 'object')
        warningThresholds = { ...warningThresholds, ...data.vehicleWarnings };
      updateSettings(data.settings);
      map3d.syncReadiness();
      buttons.forEach((button) => {
        if (['inventory', 'phone'].includes(button.dataset.action))
          button.disabled = data.actions?.[button.dataset.action] !== true;
      });
      paintFavorite();
    }
  }
  window.addEventListener('message', (event) => {
    if (event.source && event.source !== window && event.source !== window.parent) return;
    if (event.data && typeof event.data.type === 'string') receive(event.data.type, event.data.data);
  });
  map3d.init({
    animate,
    motionAllowed,
    sound: uiSound,
    notice,
    preference: changed,
    routeChanged: () => paintDriving(state),
    reportReady: (ready) => post('map3dReady', { ready }),
    waypoint: (position) => post('mapWaypoint', { ...position, epoch: menuEpoch }),
    clearWaypoint: () => post('mapWaypoint', { clear: true, epoch: menuEpoch }),
    closeMap: async () => {
      if (!(await save())) return;
      try {
        const result = await post('mapView', { open: false, epoch: menuEpoch });
        if (!result.ok) throw Error(result.error || t('Could not go back.'));
      } catch (error) {
        notice(error.message, 'error');
      }
    },
  });
  controls.init({ animate, motionAllowed, sound: uiSound });
  window.VantaExtras?.init();
  initPersonalisation();
  new ResizeObserver(() => {
    if (settingsOpen) paintPreview();
  }).observe($('settings-preview'));
  fitMenu();
  window.addEventListener('resize', fitMenu);
  async function previewPost(name, data) {
    if (name === 'map3dReady') return { ok: true };
    if (name === 'mapView') {
      receive('mapview', { open: data.open });
      return { ok: true };
    }
    if (name === 'mapWaypoint') {
      if (data.clear) {
        map3d.setRoute({ points: [] });
        render({ ...state, gps: false });
      } else {
        map3d.setRoute({ points: [], partial: true, destination: { x: data.x, y: data.y, z: 0 } });
        render({
          ...state,
          gps: {
            remaining: Math.hypot(data.x - state.world.x, data.y - state.world.y),
            destination: t('Marker'),
            routeId: 'preview:' + data.x + ':' + data.y,
            distanceKind: 'direct',
            direction: 'continue',
            phase: 'calculating',
          },
        });
      }
      return { ok: true };
    }
    if (name === 'action' && data.id === 'map' && settings.map3d) {
      receive('mapview', { open: true });
      return { ok: true, map3d: true };
    }
    if (name === 'layoutEditor') {
      const next = data.open ? { ...settings, ...data.settings } : settings;
      previewLayout(next);
      return { ok: true, settings: next };
    }
    if (name === 'settings') {
      const next = data.reset
        ? { ...defaults }
        : data.preset
          ? { ...settings, ...presets[data.preset], displayMode: data.preset }
          : { ...data.settings };
      previewLayout(next);
      return { ok: true, settings: next };
    }
    if (name === 'close' || name === 'action') {
      toggleMenu(false);
      if (name === 'action' && data.id !== 'resume') notice(t('Browser preview: action available in game.'));
    }
    return { ok: true };
  }
  function previewLayout(value = settings) {
    const h = innerHeight,
      w = innerWidth,
      s = value.scale;
    const u = (h / 1080) * s;
    layout({
      offsetX: value.offsetX,
      offsetY: value.offsetY,
      vehicleOffsetX: value.vehicleOffsetX,
      vehicleOffsetY: value.vehicleOffsetY,
      limits: {
        offsetX: [-0.025, 0.7],
        offsetY: [-0.65, 0.025],
        vehicleOffsetX: [-0.75, 0],
        vehicleOffsetY: [-0.65, 0],
      },
      left: w * (0.025 + value.offsetX) + 8 * u,
      top: h * (0.9 + value.offsetY) - h * 0.188888 * s + 12 * u,
      width: w * 0.15 * s - 16 * u,
      height: h * 0.188888 * s - 32 * u,
      unit: u,
      scale: s,
      right: w * 0.025,
      bottom: h * 0.03,
      safeTop: h * 0.03,
    });
  }
  if (preview) {
    const mode = new URLSearchParams(location.search);
    document.body.classList.add('preview');
    if (mode.has('scene')) document.body.classList.add('preview-scene');
    receive('init', {
      settings: defaults,
      lowThreshold: 20,
      actions: { inventory: true, phone: true, gamesettings: true },
    });
    previewLayout();
    render({
      world: {
        x: 215,
        y: -810,
        z: 31,
        heading: 0,
        hour: 14.5,
        speed: 0,
        vx: 0,
        vy: 0,
        nativeRadar: false,
        supported: true,
      },
      visible: true,
      mapVisible: true,
      statusVisible: true,
      health: 78,
      armour: 65,
      hunger: 36,
      thirst: 61,
      talking: true,
      voice: 2,
      street: 'ALTA STREET',
      zone: 'PILLBOX HILL',
      clock: '14:32',
      heading: 'N',
      vehicle: mode.has('vehicle')
        ? {
            speed: 68,
            gear: '3',
            rpm: 0.32,
            fuel: 56,
            belt: true,
            canBelt: true,
            class: Number(mode.get('class')) || 0,
          }
        : false,
    });
    map3d.setBlips([
      {
        id: 1,
        sprite: 60,
        x: 441,
        y: -981,
        z: 31,
        kind: 4,
        alpha: 255,
        colour: [255, 255, 255],
        full: true,
        mini: true,
        selectable: true,
      },
      {
        id: 2,
        sprite: 61,
        x: 307,
        y: -595,
        z: 43,
        kind: 4,
        alpha: 255,
        colour: [255, 255, 255],
        full: true,
        mini: true,
        selectable: true,
      },
      {
        id: 3,
        sprite: 357,
        x: -341,
        y: -877,
        z: 31,
        kind: 4,
        alpha: 255,
        colour: [255, 255, 255],
        full: true,
        mini: true,
        selectable: true,
      },
      {
        id: 4,
        sprite: 108,
        x: 150,
        y: -1040,
        z: 29,
        kind: 4,
        alpha: 255,
        colour: [255, 255, 255],
        full: true,
        mini: true,
        selectable: true,
      },
    ]);
    if (mode.has('menu') || mode.has('settings')) toggleMenu(true);
    if (mode.has('settings')) {
      showSettings();
      if (mode.has('tab')) switchTab(Number(mode.get('tab')) || 0, false);
    }
    if (mode.has('scene')) document.body.style.backgroundImage = "url('assets/preview-scene.jpg')";
    window.addEventListener('resize', () => {
      baseUnit = innerHeight / 1080;
      previewLayout();
    });
  } else {
    const dimensions = () => ({ width: innerWidth, height: innerHeight });
    let tries = 0;
    const handshake = () =>
      post('ready', dimensions())
        .then((result) => {
          if (!result.ok) throw Error();
          if (/^[a-z]{2}$/.test(result.locale || '') && result.locale !== window.VantaLang)
            location.replace('index.html?lang=' + result.locale);
        })
        .catch(() => {
          if (++tries < 10) setTimeout(handshake, 1000);
          else console.error(t('[vanta_hud] Initialisation failed.'));
        });
    handshake();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => post('viewport', dimensions()).catch(() => {}), 200);
    });
  }
})();
