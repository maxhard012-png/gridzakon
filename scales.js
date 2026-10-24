// Сцена «Весы» в блоке «Мой принцип работы»: проблемы падают на левую чашу,
// гири (консультация, договор, суд) выравнивают весы. Three.js грузится, только когда блок рядом.
const stage = document.getElementById('scales');
if (stage) {
  const io = new IntersectionObserver((e) => {
    if (!e.some((x) => x.isIntersecting)) return;
    io.disconnect();
    // 3D запускаем только после загрузки страницы и в свободную минуту, чтобы не тормозить первый экран
    const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 200));
    const go = () => idle(() => boot().catch(() => { stage.hidden = true; }));
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  }, { rootMargin: '150px 0px' });
  io.observe(stage);
}

async function boot() {
  const THREE = await import('three');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  // кириллица у Google Fonts — отдельный файл: просим шрифт сразу с русскими буквами
  try { await Promise.race([document.fonts.load('400 40px Oswald', 'НЕПОНИМАНИЕ СТРАХ ЁЙ'), new Promise((r) => setTimeout(r, 2500))]); } catch (e) {}

  const canvas = stage.querySelector('canvas');
  const chip = stage.querySelector('.sc-state');
  const fact = stage.querySelector('.sc-fact');
  const btns = [...stage.querySelectorAll('[data-w]')];
  const again = stage.querySelector('.sc-again');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

  // свет: мягкий ключ сверху-спереди, два контровых, красная подсветка перевеса
  scene.add(new THREE.HemisphereLight(0xb8bec8, 0x0c0d0f, 0.2));
  const spot = new THREE.SpotLight(0xffffff, 70, 18, 0.55, 0.9, 1.6);
  spot.position.set(0.6, 9, 3.2); spot.target.position.set(0, 1.5, 0);
  scene.add(spot, spot.target);
  const rim = new THREE.DirectionalLight(0xdfe6ff, 2.4); rim.position.set(-3, 5, -6); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xffffff, 1.3); rim2.position.set(4, 3, -5); scene.add(rim2);
  const red = new THREE.PointLight(0xe3262d, 0, 7, 1.8); red.position.set(-2.5, 0.7, 1.6); scene.add(red);

  // ---------- процедурные фактуры: шум, шлифовка, мрамор, рельеф ----------
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function noise(w, h, cells, oct, base = 128) {
    const c = cv(w, h), x = c.getContext('2d'); x.fillStyle = `rgb(${base},${base},${base})`; x.fillRect(0, 0, w, h);
    x.imageSmoothingQuality = 'high';
    for (let o = 0; o < oct; o++) {
      const n = cells << o, m = Math.max(1, Math.round(n * h / w)), s = cv(n, m), sx = s.getContext('2d'), d = sx.createImageData(n, m);
      for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      sx.putImageData(d, 0, 0); x.globalAlpha = 0.55 / (o + 1); x.drawImage(s, 0, 0, w, h);
    }
    x.globalAlpha = 1; return c;
  }
  function brushed(w, h, vertical, radial) {
    const c = cv(w, h), x = c.getContext('2d'); x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = 90 + Math.random() * 90 | 0; x.strokeStyle = `rgba(${v},${v},${v},${0.08 + Math.random() * 0.16})`; x.lineWidth = Math.random() * 1.6 + 0.3;
      x.beginPath();
      if (radial) { const r = Math.random() * w / 2; x.arc(w / 2, h / 2, r, 0, Math.PI * 2); }
      else if (vertical) { const p = Math.random() * w, l = Math.random() * h; const y0 = Math.random() * h; x.moveTo(p, y0); x.lineTo(p, y0 + l); }
      else { const p = Math.random() * h, l = Math.random() * w; const x0 = Math.random() * w; x.moveTo(x0, p); x.lineTo(x0 + l, p); }
      x.stroke();
    }
    x.globalAlpha = 0.25; x.drawImage(noise(w, h, 16, 3), 0, 0); x.globalAlpha = 1; return c;
  }
  function marble(w, h) {
    const c = cv(w, h), x = c.getContext('2d'); x.fillStyle = '#121316'; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.18; x.drawImage(noise(w, h, 6, 5, 40), 0, 0);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    const vein = (blur, a, lw) => { x.filter = `blur(${blur}px)`;
      for (let i = 0; i < 9; i++) { x.strokeStyle = `rgba(190,196,206,${a * (0.4 + Math.random() * 0.6)})`; x.lineWidth = lw * (0.5 + Math.random());
        x.beginPath(); let px = Math.random() * w, py = -10; x.moveTo(px, py);
        while (py < h + 10) { const nx = px + (Math.random() - 0.45) * 90, ny = py + 30 + Math.random() * 60; x.quadraticCurveTo(px + (Math.random() - 0.5) * 80, (py + ny) / 2, nx, ny); px = nx; py = ny; }
        x.stroke(); } x.filter = 'none'; };
    vein(6, 0.18, 6); vein(1, 0.35, 1.2); return c;
  }
  function normalFrom(src, strength) {
    const w = src.width, h = src.height, s = src.getContext('2d').getImageData(0, 0, w, h).data, c = cv(w, h), x = c.getContext('2d'), img = x.createImageData(w, h), d = img.data;
    const H = (i, j) => s[(((j + h) % h) * w + ((i + w) % w)) * 4] / 255;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const dx = (H(i + 1, j) - H(i - 1, j)) * strength, dy = (H(i, j + 1) - H(i, j - 1)) * strength, l = Math.hypot(dx, dy, 1), k = (j * w + i) * 4;
      d[k] = (-dx / l * 0.5 + 0.5) * 255; d[k + 1] = (dy / l * 0.5 + 0.5) * 255; d[k + 2] = (1 / l * 0.5 + 0.5) * 255; d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0); return c;
  }
  const tex = (c, color, rep = [1, 1]) => { const t = new THREE.CanvasTexture(c); if (color) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = ANISO; return t; };

  const brV = brushed(256, 512, true), brH = brushed(512, 256, false);
  const grain = noise(256, 256, 32, 3);
  const steelMat = (b, rep) => new THREE.MeshStandardMaterial({ color: 0xc3c8cf, metalness: 1, roughness: 0.55, roughnessMap: tex(b, false, rep), bumpMap: tex(b, false, rep), bumpScale: 0.6 });
  const steelV = steelMat(brV, [3, 1]);                      // стойка, коромысло: шлифовка вдоль
  const steelH = steelMat(brH, [1, 1]);                      // гири: шлифовка по кругу
  const steelR = steelMat(brH, [1, 1]); steelR.side = THREE.DoubleSide; // чаши: концентрическая шлифовка
  const polished = new THREE.MeshStandardMaterial({ color: 0xd4d8de, metalness: 1, roughness: 0.14 });
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, metalness: 0.1, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.08,
    roughnessMap: tex(grain, false, [2, 4]) });
  const mTex = marble(512, 256);
  const stone = new THREE.MeshPhysicalMaterial({ map: tex(mTex, true), roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.12,
    normalMap: tex(normalFrom(mTex, 2)), normalScale: new THREE.Vector2(0.25, 0.25) });
  const redLac = new THREE.MeshPhysicalMaterial({ color: 0xd8242b, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });

  // мягкие контактные тени: без краёв на фоне страницы
  const blob = (() => { const c = cv(128, 128), x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(0.55, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const shadow = (w, d, o) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, opacity: o }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.002; scene.add(m); return m; };
  shadow(2.8, 1.6, 0.95);
  const cast = (m) => m;

  // ---------- стойка: мраморное основание, лаковая колонна, стальная фурнитура ----------
  const PIVOT_Y = 3.0, HALF = 2.0, CHAIN = 1.8, PAN_R = 0.9;
  const base = new THREE.Group(); scene.add(base);
  const slab = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.14, 1.05, 4, 0.04), stone); slab.position.y = 0.07; base.add(slab);
  const slab2 = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.1, 0.62, 4, 0.03), stone); slab2.position.y = 0.19; base.add(slab2);
  const lathe = (pts, seg, mat) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg), mat);
  const foot = lathe([[0, 0], [0.3, 0], [0.3, 0.03], [0.24, 0.07], [0.13, 0.12], [0.1, 0.2], [0, 0.2]], 48, steelH); foot.position.y = 0.24; base.add(foot);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, PIVOT_Y - 0.52, 32), lacquer); col.position.y = 0.44 + (PIVOT_Y - 0.52) / 2; base.add(col);
  [0.62, 1.6, 2.35].forEach((y, i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(i ? 0.074 : 0.095, i ? 0.014 : 0.02, 12, 40), polished); r.rotation.x = Math.PI / 2; r.position.y = y; base.add(r); });
  const cap = lathe([[0, 0], [0.065, 0], [0.11, 0.1], [0.12, 0.14], [0, 0.14]], 40, steelH); cap.position.y = PIVOT_Y - 0.22; base.add(cap);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.3, 24), redLac); tip.position.y = PIVOT_Y + 0.3; base.add(tip);
  const tipBall = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 16), polished); tipBall.position.y = PIVOT_Y + 0.15; base.add(tipBall);

  // ---------- коромысло: сужается к концам, ушки на концах ----------
  const beam = new THREE.Group(); beam.position.y = PIVOT_Y; scene.add(beam);
  [-1, 1].forEach((s) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.05, HALF, 28), steelV); arm.rotation.z = s * Math.PI / 2; arm.position.x = s * HALF / 2; beam.add(arm);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.011, 10, 28), polished); eye.position.set(s * HALF, -0.03, 0); beam.add(eye);
  });
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.085, 32, 20), polished); beam.add(hub);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 20), polished); axle.rotation.x = Math.PI / 2; beam.add(axle);
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.5, 12), polished); needle.rotation.z = Math.PI; needle.position.set(0, -0.32, 0.09); beam.add(needle);

  // ---------- чаши: радиальная шлифовка, цепи из звеньев только сзади, чтобы груз их не пересекал ----------
  const bowlGeo = new THREE.LatheGeometry([[0, 0], [0.55, 0.012], [0.74, 0.05], [0.86, 0.12], [PAN_R, 0.16]].map(([x, y]) => new THREE.Vector2(x, y)), 72);
  const linkGeo = new THREE.TorusGeometry(0.02, 0.0055, 6, 14); linkGeo.scale(1, 1.6, 1);
  const TOP = new THREE.Vector3(0, -0.16, 0);
  const ANCH = [200, 270, 340].map((a) => new THREE.Vector3(Math.cos(a * Math.PI / 180) * (PAN_R - 0.03), -CHAIN + 0.15, Math.sin(a * Math.PI / 180) * (PAN_R - 0.03)));
  const pans = [-1, 1].map((s) => {
    const g = new THREE.Group(); scene.add(g);
    const bowl = new THREE.Mesh(bowlGeo, steelR); bowl.position.y = -CHAIN; g.add(bowl);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(PAN_R, 0.02, 10, 72), polished); lip.rotation.x = Math.PI / 2; lip.position.y = -CHAIN + 0.16; g.add(lip);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 8, 24), polished); ring.position.y = -0.08; g.add(ring);
    const sHook = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 20), polished); sHook.rotation.y = Math.PI / 2; sHook.position.y = -0.13; g.add(sHook);
    // звенья цепей одним InstancedMesh
    const step = 0.052, list = [];
    ANCH.forEach((b) => { const dir = b.clone().sub(TOP), len = dir.length(); dir.normalize(); const n = Math.floor(len / step);
      for (let k = 0; k < n; k++) list.push([TOP.clone().addScaledVector(dir, (k + 0.5) * step), dir, k]); });
    const links = new THREE.InstancedMesh(linkGeo, polished, list.length);
    const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), M = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
    list.forEach(([p, dir, k], i) => { q.setFromUnitVectors(Y, dir); q2.setFromAxisAngle(dir, (k % 2) * Math.PI / 2); M.compose(p, q2.multiply(q), one); links.setMatrixAt(i, M); });
    g.add(links);
    return { s, g, phi: 0, phiV: 0, load: [], sh: shadow(2.0, 1.1, 0.5) };
  });

  // ---------- эмоции: окрашенные бруски с зерном краски и выдавленной надписью ----------
  function label(text, w, h, ink) {
    const W = 768, Hh = Math.round(W * h / w), c = cv(W, Hh), x = c.getContext('2d');
    x.letterSpacing = '5px'; let fs = Math.round(Hh * 0.56);
    do { x.font = `400 ${fs}px Oswald, "Arial Narrow", sans-serif`; } while (x.measureText(text).width > W * 0.86 && --fs > 12);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = ink; x.fillText(text, W / 2, Hh * 0.54);
    // потёртости краски
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 600; i++) { x.globalAlpha = Math.random() * 0.5; x.beginPath(); x.arc(Math.random() * W, Math.random() * Hh, Math.random() * 2.2, 0, 7); x.fill(); }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    // карта высот: буквы вдавлены в краску
    const hgt = cv(W, Hh), hx = hgt.getContext('2d'); hx.fillStyle = '#fff'; hx.fillRect(0, 0, W, Hh); hx.filter = 'blur(1.5px)';
    hx.letterSpacing = '5px'; hx.font = x.font; hx.textAlign = 'center'; hx.textBaseline = 'middle'; hx.fillStyle = '#000'; hx.fillText(text, W / 2, Hh * 0.54);
    return { map: tex(c, true), normal: tex(normalFrom(hgt, 4)) };
  }
  function paint(hex) {
    const c = cv(256, 256), x = c.getContext('2d'); x.fillStyle = hex; x.fillRect(0, 0, 256, 256);
    x.globalCompositeOperation = 'soft-light'; x.globalAlpha = 0.5; x.drawImage(noise(256, 256, 8, 5), 0, 0); return c;
  }
  const pGrain = noise(256, 256, 64, 2), pNormal = tex(normalFrom(pGrain, 1.6), false, [2, 1]), pRough = tex(pGrain, false, [2, 1]);
  const PROBLEMS = [['НЕПОНИМАНИЕ', 1.28, 0.3, 0.34, '#c8232a', '#f2ede4', [-0.02, 0.21, 0.12], 0.05],
                    ['НЕОПРЕДЕЛЁННОСТЬ', 1.42, 0.3, 0.34, '#e8e3d8', '#17181c', [0.03, 0.52, 0.12], -0.05],
                    ['СТРАХ', 0.82, 0.3, 0.34, '#c8232a', '#f2ede4', [-0.04, 0.83, 0.12], 0.08]];
  const problems = PROBLEMS.map(([t, w, h, d, col, ink, off, rot]) => {
    const m = new THREE.Group();
    m.add(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, 0.035), new THREE.MeshPhysicalMaterial({
      map: tex(paint(col), true), roughness: 0.62, roughnessMap: pRough, normalMap: pNormal, normalScale: new THREE.Vector2(0.35, 0.35),
      clearcoat: 0.35, clearcoatRoughness: 0.45 })));
    const L = label(t, w - 0.06, h - 0.06, ink);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), new THREE.MeshStandardMaterial({ map: L.map, normalMap: L.normal,
      transparent: true, roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -2 }));
    face.position.z = d / 2 + 0.001; m.add(face);
    m.visible = false; scene.add(m);
    return { m, off: new THREE.Vector3(off[0], off[1] - CHAIN, off[2]), rot, state: 'wait' };
  });

  // ---------- гири: шлифованная сталь, полированная головка ----------
  const wGeo = new THREE.LatheGeometry([[0, 0], [0.27, 0], [0.29, 0.02], [0.29, 0.24], [0.27, 0.27], [0.2, 0.29], [0.1, 0.31], [0.085, 0.36],
    [0.11, 0.39], [0.12, 0.43], [0.1, 0.46], [0.05, 0.48], [0, 0.48]].map(([x, y]) => new THREE.Vector2(x * 0.82, y * 0.82)), 64);
  const SHELF = [new THREE.Vector3(1.6, 0, 1.35), new THREE.Vector3(2.12, 0, 1.25), new THREE.Vector3(2.64, 0, 1.15)];
  const SLOT = [[-0.27, 0.14], [0.27, 0.14], [0, -0.18]];
  const weights = SHELF.map((p, i) => {
    const m = new THREE.Mesh(wGeo, steelH); m.position.copy(p); m.rotation.y = i * 1.7; scene.add(m);
    const sh = shadow(0.75, 0.5, 0.75); sh.position.set(p.x, 0.003, p.z);
    return { m, i, state: 'shelf', home: p.clone(), sh };
  });

  // физика коромысла
  const MASS = 1, K = 0.095, MAX = 0.3;
  let theta = 0, thetaV = 0, lastV = 0, running = false, visible = true, idle = 0, done = false;
  const onL = () => problems.filter((p) => p.state === 'rest').length * MASS;
  const onR = () => weights.filter((w) => w.state === 'rest').length * MASS;
  const tmp = new THREE.Vector3();
  function hang(s, out) { return out.set(s * HALF * Math.cos(theta), PIVOT_Y + s * HALF * Math.sin(theta), 0); }
  function panWorld(pan, local, out) { return out.copy(local).applyAxisAngle(new THREE.Vector3(0, 0, 1), pan.phi).add(hang(pan.s, tmp.set(0, 0, 0)).clone()); }

  function setUI() {
    const l = onL(), r = onR(), level = l > 0 && r >= l;
    chip.textContent = l === 0 ? 'Весы' : level ? 'Проблема решена' : 'Перевес';
    stage.classList.toggle('is-level', level); stage.classList.toggle('is-tilt', l > 0 && !level);
    fact.textContent = l === 0 ? 'Проблема приходит без предупреждения'
      : level ? 'Непонимание, неопределённость и страх больше не тянут вниз'
      : r === 0 ? 'Непонимание, неопределённость и страх тянут чашу вниз. Положи гирю' : 'Ещё ' + (l - r) + ' — и весы выровняются';
    btns.forEach((b, i) => { b.disabled = weights[i].state !== 'shelf' || l === 0; });
    again.hidden = !level;
  }

  const ease = (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; };
  function land(obj, pan, extraKick) {
    obj.state = 'rest';
    pan.g.attach(obj.m);
    thetaV += extraKick; pan.phiV += (Math.random() - 0.5) * 0.9;
    setUI(); wake();
  }
  function drop(p, instant) {
    p.m.visible = true;
    p.from = new THREE.Vector3(p.off.x - 0.3, PIVOT_Y + 3.2, 0.6); p.t = 0; p.state = 'fall';
    p.m.rotation.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    if (instant) { p.t = 1; }
    wake();
  }
  function place(w) {
    if (w.state !== 'shelf' || onL() === 0) return;
    const slot = SLOT[weights.filter((x) => x.state !== 'shelf').length];
    w.state = 'fly'; w.t = still ? 1 : 0; w.from = w.m.position.clone();
    w.off = new THREE.Vector3(slot[0], -CHAIN + 0.03, slot[1]);
    setUI(); wake();
  }
  function reset() {
    done = false;
    weights.forEach((w) => { scene.attach(w.m); w.m.position.copy(w.home); w.m.rotation.set(0, 0, 0); w.state = 'shelf'; });
    problems.forEach((p) => { scene.attach(p.m); p.m.visible = false; p.state = 'wait'; });
    setUI(); start();
  }
  function start() {
    problems.forEach((p, i) => setTimeout(() => drop(p, still), still ? 0 : 250 + i * 420));
  }

  function step(dt) {
    // проблемы падают в левую чашу с отскоком
    problems.forEach((p) => {
      if (p.state !== 'fall') return;
      p.t = Math.min(1, p.t + dt / 0.85);
      const target = panWorld(pans[0], p.off, new THREE.Vector3());
      p.m.position.lerpVectors(p.from, target, ease(p.t));
      p.m.rotation.x *= 0.9; p.m.rotation.y += (p.rot - p.m.rotation.y) * 0.12; p.m.rotation.z *= 0.9;
      if (p.t >= 1) { p.m.position.copy(target); p.m.rotation.set(0, p.rot, 0); land(p, pans[0], 0.5); }
    });
    // гири летят дугой в правую чашу
    weights.forEach((w) => {
      if (w.state !== 'fly') return;
      w.t = Math.min(1, w.t + dt / 0.62);
      const target = panWorld(pans[1], w.off, new THREE.Vector3()), e = 1 - Math.pow(1 - w.t, 3);
      w.m.position.lerpVectors(w.from, target, e); w.m.position.y += Math.sin(Math.PI * w.t) * 1.1;
      if (w.t >= 1) { w.m.position.copy(target); land(w, pans[1], -0.45); }
    });
    // коромысло — затухающая пружина к положению по массам
    const target = THREE.MathUtils.clamp(K * (onL() - onR()), -MAX, MAX);
    thetaV += ((target - theta) * 26 - thetaV * 4.2) * dt; theta += thetaV * dt;
    const acc = (thetaV - lastV) / Math.max(dt, 1e-3); lastV = thetaV;
    beam.rotation.z = theta;
    pans.forEach((p) => {
      p.phiV += (-p.phi * 22 - p.phiV * 2.6 - acc * 0.02 * p.s) * dt; p.phi += p.phiV * dt;
      hang(p.s, p.g.position); p.g.rotation.z = p.phi;
      const hy = p.g.position.y - CHAIN; p.sh.position.x = p.g.position.x; p.sh.material.opacity = THREE.MathUtils.clamp(0.75 - hy * 0.38, 0.12, 0.6); p.sh.scale.setScalar(0.8 + hy * 0.25);
    });
    weights.forEach((w) => { w.sh.visible = w.state === 'shelf'; });
    const imb = Math.max(0, onL() - onR()) / 3;
    red.intensity += (imb * 9 - red.intensity) * Math.min(1, dt * 4);
    const moving = Math.abs(thetaV) + Math.abs(target - theta) + pans.reduce((a, p) => a + Math.abs(p.phiV) + Math.abs(p.phi), 0) > 0.002
      || problems.some((p) => p.state === 'fall') || weights.some((w) => w.state === 'fly') || Math.abs(red.intensity - imb * 9) > 0.05;
    idle = moving ? 0 : idle + dt;
  }

  let prev = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - (prev || t)) / 1000); prev = t;
    step(dt);
    if (still) { theta = THREE.MathUtils.clamp(K * (onL() - onR()), -MAX, MAX); thetaV = 0; beam.rotation.z = theta; pans.forEach((p) => { p.phi = p.phiV = 0; p.g.rotation.z = 0; hang(p.s, p.g.position); }); }
    renderer.render(scene, camera);
    if (visible && idle < 0.6) requestAnimationFrame(frame); else { running = false; prev = 0; }
  }
  function wake() { idle = 0; if (!running && visible) { running = true; requestAnimationFrame(frame); } }

  function resize() {
    const w = stage.querySelector('.sc-view').clientWidth, h = stage.querySelector('.sc-view').clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const need = 6.7, fit = Math.max(10.2, need / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * camera.aspect));
    camera.position.set(0.1, 2.7, fit); camera.lookAt(0.1, 1.75, 0); camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  new ResizeObserver(resize).observe(stage);

  // тап по гире прямо в сцене
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(weights.filter((w) => w.state === 'shelf').map((w) => w.m))[0];
    if (hit) place(weights.find((w) => w.m === hit.object));
  });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    canvas.style.cursor = onL() && ray.intersectObjects(weights.filter((w) => w.state === 'shelf').map((w) => w.m)).length ? 'pointer' : '';
  });
  btns.forEach((b, i) => b.addEventListener('click', () => place(weights[i])));
  again.addEventListener('click', reset);

  new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) wake(); }, { threshold: 0 }).observe(stage);
  // проблемы падают, когда сцена показалась на экране
  const startIO = new IntersectionObserver((e) => { if (e[e.length - 1].isIntersecting) { startIO.disconnect(); visible = true; start(); } }, { threshold: 0.45 });
  startIO.observe(stage);

  pans.forEach((p) => hang(p.s, p.g.position));
  stage.classList.add('is-ready');
  setUI(); resize(); wake();
}
