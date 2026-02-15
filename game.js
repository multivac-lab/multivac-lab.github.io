(() => {
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');

  const ui = {
    biome: document.getElementById('biomeLabel'),
    law: document.getElementById('lawLabel'),
    relics: document.getElementById('relics'),
    discoveries: document.getElementById('discoveries'),
    coords: document.getElementById('coords'),
    toast: document.getElementById('toast')
  };

  const state = {
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    baseSpeed: 2.1,
    relics: 0,
    seed: 1337,
    interactQueued: false,
    lastInteract: 0,
    discovered: new Set(),
    lastBiome: -1
  };

  const tile = 32;
  const biomeNames = ['Iridescent Shoals', 'Thornfields', 'Clockwork Dunes', 'Lumen Forest'];
  const biomeLaws = [
    'Gravity softens near water-like light.',
    'Thorns bend trajectories slightly inward.',
    'Time ticks in stutters on metal sands.',
    'Light diffuses; sound carries farther.'
  ];
  const biomeSpeed = [1.05, 0.92, 1.15, 0.98];
  const biomePalette = [
    ['#16324c', '#1d476a', '#2d6a89', '#52a3c0'],
    ['#1a1430', '#2e1a44', '#4f245c', '#7a3a6d'],
    ['#2a1f0f', '#3b2c14', '#5b4417', '#9a7b2e'],
    ['#102417', '#16361f', '#21522f', '#3d8c56']
  ];

  const relicTypes = [
    { name: 'Spiral Kernel', color: '#9bd3ff' },
    { name: 'Temporal Prism', color: '#b9a7ff' },
    { name: 'Echo Lichen', color: '#7ce6d8' },
    { name: 'Quartz Moth', color: '#ffd27b' }
  ];

  const creatureTypes = [
    { name: 'Velvet Tortoise', color: '#ff8fb1' },
    { name: 'Glass Antenna', color: '#7cc8ff' },
    { name: 'Ink Orchard', color: '#a98bff' },
    { name: 'Ribbon Wisp', color: '#ffd27b' }
  ];

  const keys = new Set();
  window.addEventListener('keydown', (e) => {
    keys.add(e.key.toLowerCase());
    if (e.key === ' ') state.interactQueued = true;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  let joystick = null;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.clientX < window.innerWidth * 0.5) {
      joystick = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY };
    } else {
      state.interactQueued = true;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (joystick && e.pointerId === joystick.id) {
      joystick.x = e.clientX;
      joystick.y = e.clientY;
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (joystick && e.pointerId === joystick.id) joystick = null;
  });

  function resize(){
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function hash(x, y){
    let n = x * 374761393 + y * 668265263 + state.seed * 1447;
    n = (n ^ (n >> 13)) * 1274126177;
    n = n ^ (n >> 16);
    return (n >>> 0) / 4294967295;
  }

  function biomeAt(tx, ty){
    const bx = Math.floor(tx / 16);
    const by = Math.floor(ty / 16);
    return Math.floor(hash(bx, by) * biomeNames.length);
  }

  function tileNoise(tx, ty){
    return hash(tx, ty);
  }

  function relicAt(tx, ty){
    const h = hash(tx * 3.13, ty * 1.91);
    if (h > 0.987) {
      const idx = Math.floor(hash(tx * 7.77, ty * 9.99) * relicTypes.length);
      return relicTypes[idx];
    }
    return null;
  }

  function creatureAt(tx, ty){
    const h = hash(tx * 5.11, ty * 2.71);
    if (h > 0.985) {
      const idx = Math.floor(hash(tx * 9.17, ty * 4.33) * creatureTypes.length);
      return creatureTypes[idx];
    }
    return null;
  }

  function showToast(text){
    ui.toast.textContent = text;
    ui.toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => ui.toast.classList.remove('show'), 1200);
  }

  function updateControls(){
    let dx = 0, dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;

    if (joystick) {
      const jdx = joystick.x - joystick.sx;
      const jdy = joystick.y - joystick.sy;
      const mag = Math.hypot(jdx, jdy);
      if (mag > 6) {
        dx += jdx / Math.max(mag, 1);
        dy += jdy / Math.max(mag, 1);
      }
    }

    const mag = Math.hypot(dx, dy) || 1;
    const b = biomeAt(Math.floor(state.px / tile), Math.floor(state.py / tile));
    const speed = state.baseSpeed * biomeSpeed[b];
    state.vx = (dx / mag) * speed;
    state.vy = (dy / mag) * speed;
  }

  function update(){
    updateControls();
    state.px += state.vx;
    state.py += state.vy;

    const tx = Math.round(state.px / tile);
    const ty = Math.round(state.py / tile);
    const b = biomeAt(Math.floor(state.px / tile), Math.floor(state.py / tile));

    if (b !== state.lastBiome) {
      state.lastBiome = b;
      ui.biome.textContent = biomeNames[b];
      ui.law.textContent = biomeLaws[b];
      showToast(`Law: ${biomeLaws[b]}`);
    }

    if (state.interactQueued && performance.now() - state.lastInteract > 200) {
      state.lastInteract = performance.now();
      state.interactQueued = false;

      const creature = creatureAt(tx, ty);
      if (creature) {
        state.discovered.add(creature.name);
        showToast(`Discovered ${creature.name}`);
      } else {
        const relic = relicAt(tx, ty);
        if (relic) {
          state.relics += 1;
          showToast(`Collected ${relic.name}`);
        } else {
          showToast('Nothing here…');
        }
      }
    }

    ui.relics.textContent = String(state.relics);
    ui.discoveries.textContent = String(state.discovered.size);
    ui.coords.textContent = `${Math.round(state.px / tile)},${Math.round(state.py / tile)}`;
  }

  function draw(){
    const w = canvas.width / devicePixelRatio;
    const h = canvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    const cols = Math.ceil(w / tile) + 2;
    const rows = Math.ceil(h / tile) + 2;

    const cx = Math.floor(state.px / tile);
    const cy = Math.floor(state.py / tile);

    for (let y = -rows; y <= rows; y++) {
      for (let x = -cols; x <= cols; x++) {
        const tx = cx + x;
        const ty = cy + y;
        const b = biomeAt(tx, ty);
        const p = biomePalette[b];
        const n = tileNoise(tx, ty);
        const color = n < 0.33 ? p[0] : n < 0.66 ? p[1] : n < 0.85 ? p[2] : p[3];

        const px = x * tile + (w / 2 - (state.px % tile));
        const py = y * tile + (h / 2 - (state.py % tile));
        ctx.fillStyle = color;
        ctx.fillRect(px, py, tile, tile);

        if (n > 0.92) {
          ctx.fillStyle = 'rgba(255,255,255,.05)';
          ctx.fillRect(px + 6, py + 6, 4, 4);
        }

        const relic = relicAt(tx, ty);
        if (relic) {
          ctx.fillStyle = relic.color;
          ctx.beginPath();
          ctx.arc(px + tile / 2, py + tile / 2, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        const creature = creatureAt(tx, ty);
        if (creature) {
          ctx.fillStyle = creature.color;
          ctx.beginPath();
          ctx.moveTo(px + tile / 2, py + 6);
          ctx.lineTo(px + tile - 6, py + tile / 2);
          ctx.lineTo(px + tile / 2, py + tile - 6);
          ctx.lineTo(px + 6, py + tile / 2);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // player
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.stroke();

    // joystick hint
    if (joystick) {
      ctx.strokeStyle = 'rgba(255,255,255,.18)';
      ctx.beginPath();
      ctx.arc(joystick.sx, joystick.sy, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath();
      ctx.arc(joystick.x, joystick.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
