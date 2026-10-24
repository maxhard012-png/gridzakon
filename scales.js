// Сцена «Весы» в блоке «Мой принцип работы»: проблемы падают на левую чашу,
// гири (консультация, договор, суд) выравнивают весы. Three.js грузится, только когда блок рядом.
const stage = document.getElementById('scales');
if (stage) {
  const io = new IntersectionObserver((e) => {
    if (e.some((x) => x.isIntersecting)) { io.disconnect(); boot().catch(() => { stage.hidden = true; }); }
  }, { rootMargin: '300px 0px' });
  io.observe(stage);
}

async function boot() {
  const THREE = await import('three');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  try { await document.fonts.load('400 40px Oswald'); } catch (e) {}

  const canvas = stage.querySelector('canvas');
  const chip = stage.querySelector('.sc-state');
  const fact = stage.querySelector('.sc-fact');
  const btns = [...stage.querySelectorAll('[data-w]')];
  const again = stage.querySelector('.sc-again');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  // свет: конус сверху, как прожектор, и красная подсветка перевеса
  scene.add(new THREE.HemisphereLight(0x9aa0aa, 0x0c0d0f, 0.25));
  const spot = new THREE.SpotLight(0xfff1dc, 60, 16, 0.42, 0.75, 1.6);
  spot.position.set(0.3, 9, 1.4); spot.target.position.set(0, 1.4, 0);
  spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0004; spot.shadow.radius = 4;
  scene.add(spot, spot.target);
  const red = new THREE.PointLight(0xe3262d, 0, 7, 1.8); red.position.set(-2.4, 0.6, 1.6); scene.add(red);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), new THREE.ShadowMaterial({ opacity: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a46a, metalness: 1, roughness: 0.32 });
  const darkBrass = new THREE.MeshStandardMaterial({ color: 0x8c6c3e, metalness: 1, roughness: 0.42 });
  const lacquer = new THREE.MeshStandardMaterial({ color: 0x111215, metalness: 0.2, roughness: 0.28 });
  const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

  // стойка
  const PIVOT_Y = 2.75, HALF = 1.9, CHAIN = 1.45, PAN_R = 0.62;
  const base = new THREE.Group(); scene.add(base);
  base.add(cast(new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.16, 0.9, 3, 0.05), lacquer))).position.y = 0.08;
  const plinth = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.14, 40), brass)); plinth.position.y = 0.23; base.add(plinth);
  const col = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, PIVOT_Y - 0.3, 24), lacquer)); col.position.y = 0.3 + (PIVOT_Y - 0.3) / 2; base.add(col);
  [0.9, 1.9].forEach((y) => { const r = cast(new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.022, 10, 32), brass)); r.rotation.x = Math.PI / 2; r.position.y = y; base.add(r); });
  const knob = cast(new THREE.Mesh(new THREE.SphereGeometry(0.13, 28, 18), brass)); knob.position.y = PIVOT_Y + 0.02; base.add(knob);
  const tip = cast(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 20), brass)); tip.position.y = PIVOT_Y + 0.26; base.add(tip);

  // коромысло
  const beam = new THREE.Group(); beam.position.y = PIVOT_Y; scene.add(beam);
  beam.add(cast(new THREE.Mesh(new RoundedBoxGeometry(HALF * 2 + 0.1, 0.07, 0.07, 2, 0.025), brass)));
  const needle = cast(new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.55, 0.025), darkBrass)); needle.position.y = -0.3; beam.add(needle);
  [-1, 1].forEach((s) => { const e = cast(new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), brass)); e.position.x = s * HALF; beam.add(e); });

  // чаши на трёх цепях
  const bowlGeo = new THREE.LatheGeometry([[0, 0], [0.42, 0.015], [0.56, 0.06], [PAN_R, 0.13], [PAN_R + 0.02, 0.14]].map(([x, y]) => new THREE.Vector2(x, y)), 48);
  const pans = [-1, 1].map((s) => {
    const g = new THREE.Group(); scene.add(g);
    const bowl = cast(new THREE.Mesh(bowlGeo, brass)); bowl.material = brass.clone(); bowl.material.side = THREE.DoubleSide; bowl.position.y = -CHAIN; g.add(bowl);
    const rim = cast(new THREE.Mesh(new THREE.TorusGeometry(PAN_R + 0.02, 0.016, 8, 48), brass)); rim.rotation.x = Math.PI / 2; rim.position.y = -CHAIN + 0.14; g.add(rim);
    [0, 2.094, 4.189].forEach((a) => {
      const top = new THREE.Vector3(0, -0.04, 0), bot = new THREE.Vector3(Math.cos(a + 1.57) * (PAN_R - 0.02), -CHAIN + 0.14, Math.sin(a + 1.57) * (PAN_R - 0.02));
      const len = top.distanceTo(bot), c = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 6), darkBrass));
      c.position.copy(top).add(bot).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bot.clone().sub(top).normalize()); g.add(c);
    });
    const hook = cast(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20), brass)); g.add(hook);
    return { s, g, phi: 0, phiV: 0, load: [] };
  });

  // проблемы: красные «дела» с подписью
  function tag(text, w, h, bg, fg) {
    const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
    const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = fg; x.letterSpacing = '3px'; let fs = Math.round(c.height * 0.6);
    do { x.font = `400 ${fs}px Oswald, "Arial Narrow", sans-serif`; } while (x.measureText(text).width > c.width * 0.88 && --fs > 10);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height * 0.54);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  const PROBLEMS = [['НЕПОНИМАНИЕ', 1.36, 0.36, 0.5, 0xe3262d, '#e3262d', '#fff', [-0.02, 0.2, 0.02], 0.04],
                    ['НЕОПРЕДЕЛЁННОСТЬ', 1.5, 0.36, 0.46, 0xf1efe9, '#f1efe9', '#0c0d0f', [0.03, 0.58, -0.02], -0.06],
                    ['СТРАХ', 0.9, 0.36, 0.44, 0xe3262d, '#e3262d', '#fff', [-0.04, 0.96, 0.03], 0.1]];
  const problems = PROBLEMS.map(([t, w, h, d, col, bg, fg, off, rot]) => {
    const m = new THREE.Group();
    m.add(cast(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.04), new THREE.MeshStandardMaterial({ color: col, roughness: 0.55, metalness: 0.05 }))));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, h - 0.08), new THREE.MeshStandardMaterial({ map: tag(t, w, h, bg, fg), roughness: 0.6 }));
    face.position.z = d / 2 + 0.002; m.add(face);
    m.visible = false; scene.add(m);
    return { m, off: new THREE.Vector3(off[0], off[1] - CHAIN + 0.02, off[2]), rot, state: 'wait' };
  });

  // гири
  const wGeo = new THREE.LatheGeometry([[0, 0], [0.3, 0], [0.32, 0.03], [0.32, 0.3], [0.27, 0.36], [0.12, 0.4], [0.1, 0.46], [0.14, 0.5], [0.14, 0.56], [0.08, 0.6], [0, 0.61]].map(([x, y]) => new THREE.Vector2(x * 0.7, y * 0.7)), 40);
  const SHELF = [new THREE.Vector3(1.55, 0, 1.15), new THREE.Vector3(2.05, 0, 1.05), new THREE.Vector3(2.55, 0, 0.95)];
  const SLOT = [[-0.2, 0.06], [0.2, 0.06], [0, -0.22]];
  const weights = SHELF.map((p, i) => {
    const m = cast(new THREE.Mesh(wGeo, i === 1 ? darkBrass : brass)); m.position.copy(p); scene.add(m);
    return { m, i, state: 'shelf', home: p.clone() };
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
    });
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
    const need = 5.95, fit = Math.max(9.6, need / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * camera.aspect));
    camera.position.set(0.25, 2.3, fit); camera.lookAt(0.25, 1.45, 0); camera.updateProjectionMatrix();
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
