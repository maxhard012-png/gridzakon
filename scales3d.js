// Сцена «Весы» (3D) в блоке «Мой принцип работы». Форма — гербовый знак: весы висят на кольце-ромбе.
// Механика: кольцо → стержень → скоба с двумя круглыми щеками → стальная ось → коромысло (волна из прутка с завитками)
// → проушина на конце → кольцо → три цепи (по бокам и сзади) → ушки на ободе чаши. Чаша качается маятником,
// коромысло — на оси; груз стоит пирамидой внутри треугольника цепей и их не пересекает.
// Материалы: вороненая сталь (корпус), полированная сталь (ось, звенья, штифты), красная эмаль (щиток-указатель).
const stage = document.getElementById('scales');
if (stage && window.SC_VARIANT === 'A') {
  const io = new IntersectionObserver((e) => {
    if (!e.some((x) => x.isIntersecting)) return;
    io.disconnect();
    // 3D запускаем после загрузки страницы и в свободную минуту, чтобы не тормозить первый экран
    const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 200));
    const go = () => idle(() => boot().catch((err) => { console.error(err); stage.hidden = true; }));
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  }, { rootMargin: '150px 0px' });
  io.observe(stage);
}

async function boot() {
  const THREE = await import('three');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');
  // кириллица у Google Fonts — отдельный файл: просим шрифт сразу с русскими буквами
  try { await Promise.race([Promise.all([document.fonts.load('400 40px Oswald', 'НЕПОНИМАНИЕ СТРАХ ЁЙ'), document.fonts.load('600 40px "Golos Text"', 'Консультация Договор Суд')]), new Promise((r) => setTimeout(r, 2500))]); } catch (e) {}

  const canvas = stage.querySelector('canvas');
  const chip = stage.querySelector('.sc-state');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  stage.classList.add('v-a');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.NoToneMapping; // фирменные цвета без киношной обработки: красный остаётся #e3262d
  const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  // своя студия для отражений: тёмная комната, софтбокс сверху, световые полосы по бокам и сзади —
  // на тёмном металле они дают чёткие длинные блики вместо ровной серой заливки
  // окружение — фотостудия ferndale_studio_11 (Poly Haven, CC0): софтбоксы и световые трубки дают чистые блики
  try {
    const hdr = await new RGBELoader().loadAsync('assets/3d/studio.hdr');
    scene.environment = pmrem.fromEquirectangular(hdr).texture; hdr.dispose();
  } catch (e) { scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; }
  scene.environmentIntensity = 0.75;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

  // свет студийный: ключ сверху-спереди-слева, заполняющий справа, два контровых сзади — металл читается по краям
  scene.add(new THREE.HemisphereLight(0xffffff, 0x101114, 0.9));
  const key = new THREE.SpotLight(0xffffff, 55, 20, 0.6, 0.9, 1.5); key.position.set(-2.5, 8, 5); key.target.position.set(0, 2.4, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 4; key.shadow.camera.far = 16; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 5; key.shadow.blurSamples = 16; scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.7); fill.position.set(5, 2, 4); scene.add(fill);
  const rimL = new THREE.DirectionalLight(0xffffff, 3.2); rimL.position.set(-4, 5, -6); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xffffff, 2.6); rimR.position.set(5, 4, -5); scene.add(rimR);
  const red = new THREE.PointLight(0xe3262d, 0, 6, 1.8); red.position.set(-2.4, 1.2, 1.4); scene.add(red);

  // ---------- процедурные карты ----------
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
  // тонкая шлифовка одного направления — одна карта на весь корпус, чтобы металл был единым
  function brushed(w, h) {
    const c = cv(w, h), x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 3200; i++) {
      const v = 100 + Math.random() * 70 | 0; x.strokeStyle = `rgba(${v},${v},${v},${0.06 + Math.random() * 0.12})`; x.lineWidth = Math.random() * 1.2 + 0.3;
      const p = Math.random() * h, l = Math.random() * w * 0.6, x0 = Math.random() * w; x.beginPath(); x.moveTo(x0, p); x.lineTo(x0 + l, p); x.stroke();
    }
    return c;
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

  // ---------- материалы ----------
  const loadTex = (url, color) => { const t = new THREE.TextureLoader().load(url, () => wake()); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO; if (color) t.colorSpace = THREE.SRGBColorSpace; return t; };
  // матовый чёрный пластик с фактурой (ambientCG Plastic012A, CC0)
  const PL = { map: loadTex('assets/3d/plastic_color.jpg', true), rough: loadTex('assets/3d/plastic_rough.jpg'), normal: loadTex('assets/3d/plastic_normal.jpg') };
  function triplanar(mat, { map, rough, normal }, scale, nStrength = 1, tint = null) {
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { triMap: { value: map || null }, triRough: { value: rough }, triNormal: { value: normal }, triScale: { value: scale }, triNS: { value: nStrength },
        triTint: { value: tint ? new THREE.Color(tint) : new THREE.Color(1, 1, 1) }, triUseMap: { value: map ? 1 : 0 } });
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vTriP; varying vec3 vTriN; varying vec3 vNM0; varying vec3 vNM1; varying vec3 vNM2;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTriP = position; vTriN = normal; vNM0 = normalMatrix[0]; vNM1 = normalMatrix[1]; vNM2 = normalMatrix[2];');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D triMap; uniform sampler2D triRough; uniform sampler2D triNormal; uniform float triScale; uniform float triNS; uniform vec3 triTint; uniform int triUseMap;
varying vec3 vTriP; varying vec3 vTriN; varying vec3 vNM0; varying vec3 vNM1; varying vec3 vNM2;
vec3 triW() { vec3 w = pow(abs(normalize(vTriN)), vec3(4.0)); return w / (w.x + w.y + w.z); }
vec4 triS(sampler2D t) { vec3 p = vTriP * triScale, w = triW(); return texture2D(t, p.zy) * w.x + texture2D(t, p.xz) * w.y + texture2D(t, p.xy) * w.z; }`)
        .replace('#include <map_fragment>', '#include <map_fragment>\nif (triUseMap == 1) diffuseColor.rgb *= triS(triMap).rgb * triTint;')
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * triS(triRough).g;')
        .replace('#include <normal_fragment_maps>', `{
  vec3 n0 = normalize(vTriN), w = triW(), p = vTriP * triScale;
  vec3 tx = texture2D(triNormal, p.zy).xyz * 2.0 - 1.0, ty = texture2D(triNormal, p.xz).xyz * 2.0 - 1.0, tz = texture2D(triNormal, p.xy).xyz * 2.0 - 1.0;
  tx.xy *= triNS; ty.xy *= triNS; tz.xy *= triNS;
  tx = vec3(tx.xy + n0.zy, abs(tx.z) * n0.x); ty = vec3(ty.xy + n0.xz, abs(ty.z) * n0.y); tz = vec3(tz.xy + n0.xy, abs(tz.z) * n0.z);
  vec3 on = normalize(tx.zyx * w.x + ty.xzy * w.y + tz.xyz * w.z);
  normal = normalize(mat3(vNM0, vNM1, vNM2) * on);
  #ifdef DOUBLE_SIDED
    normal *= faceDirection;
  #endif
}`);
    };
    mat.customProgramCacheKey = () => 'tri' + scale + nStrength + (map ? 1 : 0);
    return mat;
  }
  // ---------- материалы: три и только три ----------
  const brush = brushed(512, 512);
  const smudge = (() => { const c = cv(512, 512), x = c.getContext('2d'); x.drawImage(brush, 0, 0); x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.6;
    x.drawImage(noise(512, 512, 6, 4), 0, 0); return c; })();
  const blued = triplanar(new THREE.MeshStandardMaterial({ color: 0x6a6a6a, metalness: 0, roughness: 1 }), PL, 5, 1); // матовый пластик с фактурой
  const bluedTurned = blued;      // токарные детали: кольцевые риски
  const polished = new THREE.MeshStandardMaterial({ color: 0x8b9097, metalness: 1, roughness: 0.22 }); // гладкая сталь фурнитуры
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0xd8242b, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04 }); // эмаль
  const RED = new THREE.Color(0xd8242b), GREEN = new THREE.Color(0x21b45f);

  // контур из ломаной заданной толщины (стыки срезаны по биссектрисе) → выдавливание с фаской
  function strip(pts, t) {
    const n = pts.length, A = [], B = [];
    const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; };
    for (let i = 0; i < n; i++) {
      let m, k = t / 2;
      if (i === 0) m = nrm(pts[0], pts[1]); else if (i === n - 1) m = nrm(pts[n - 2], pts[n - 1]);
      else { const a = nrm(pts[i - 1], pts[i]), b = nrm(pts[i], pts[i + 1]); m = [a[0] + b[0], a[1] + b[1]]; const l = Math.hypot(m[0], m[1]); m = [m[0] / l, m[1] / l]; k = (t / 2) / (m[0] * a[0] + m[1] * a[1]); }
      A.push([pts[i][0] + m[0] * k, pts[i][1] + m[1] * k]); B.push([pts[i][0] - m[0] * k, pts[i][1] - m[1] * k]);
    }
    const s = new THREE.Shape(); s.moveTo(...A[0]); A.slice(1).forEach((p) => s.lineTo(...p)); B.reverse().forEach((p) => s.lineTo(...p)); s.closePath(); return s;
  }
  function extrude(shape, depth, bevel = 0.018) {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 24 });
    g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g;
  }
  const poly = (pts) => { const s = new THREE.Shape(); s.moveTo(...pts[0]); pts.slice(1).forEach((p) => s.lineTo(...p)); s.closePath(); return s; };

  // ---------- подвес и вилка (неподвижны): всё круглое ----------
  const PIVOT_Y = 3.15, HALF = 1.6, BAIL_H = 1.6, PR = 0.85, HANG = 0.22;
  const top = new THREE.Group(); top.position.y = PIVOT_Y; scene.add(top);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.042, 24, 64), blued); ring.position.y = 0.86; top.add(ring);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.4, 32), bluedTurned); stem.position.y = 0.52; top.add(stem);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 32, 20), polished); knob.position.y = 0.33; top.add(knob);
  // тонкая скоба-дуга над коромыслом, её концы держат ось
  const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.022, 16, 40, Math.PI), blued); yoke.rotation.y = Math.PI / 2; yoke.position.y = 0.17; top.add(yoke);
  [-1, 1].forEach((z) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.17, 20), blued); arm.position.set(0, 0.085, z * 0.135); top.add(arm);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.04, 24, 16), polished); cap.position.z = z * 0.15; top.add(cap); // концы оси в скобе
  });
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.3, 24), polished); axle.rotation.x = Math.PI / 2; top.add(axle);

  // ---------- коромысло-лук: плавная дуга от центра к концам, кончики чуть загнуты вверх; толще у оси, тоньше к краям ----------
  const beam = new THREE.Group(); beam.position.y = PIVOT_Y; scene.add(beam);
  const bow = [[0, 0.06], [0.45, 0.045], [0.9, 0.0], [1.3, -0.06], [1.6, -0.08], [1.74, -0.04], [1.82, 0.04]];
  const path = [...bow.slice(1).reverse().map(([x, y]) => [-x, y]), ...bow].map(([x, y]) => new THREE.Vector3(x, y, 0));
  const rod = new THREE.CatmullRomCurve3(path, false, 'centripetal');
  const SEG = 400, RAD = 24, beamGeo = new THREE.TubeGeometry(rod, SEG, 1, RAD, false), pos = beamGeo.attributes.position, cen = new THREE.Vector3(), v = new THREE.Vector3();
  const thick = (t) => 0.072 - 0.042 * Math.pow(Math.abs(t - 0.5) * 2, 1.2);
  for (let i = 0; i <= SEG; i++) { const t = i / SEG; rod.getPointAt(t, cen); const r = thick(t);
    for (let j = 0; j <= RAD; j++) { const k = i * (RAD + 1) + j; v.fromBufferAttribute(pos, k).sub(cen).multiplyScalar(r).add(cen); pos.setXYZ(k, v.x, v.y, v.z); } }
  pos.needsUpdate = true; beamGeo.computeVertexNormals();
  beam.add(new THREE.Mesh(beamGeo, blued));
  [path[0], path[path.length - 1]].forEach((p) => { const b = new THREE.Mesh(new THREE.SphereGeometry(thick(0) * 1.15, 20, 14), polished); b.position.copy(p); beam.add(b); });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.2, 32), bluedTurned); hub.rotation.x = Math.PI / 2; hub.position.y = 0.055; beam.add(hub);
  // проушины на концах: кольцо продето вокруг прутка
  [-1, 1].forEach((s) => { const eye = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 16, 40), polished); eye.rotation.y = Math.PI / 2; eye.position.set(s * HALF, -0.145, 0); beam.add(eye); });

  // ---------- чаши на цепях: две по бокам и одна сзади, сходятся к кольцу под проушиной ----------
  const panGeo = new THREE.LatheGeometry([[0, 0.025], [0.62, 0.025], [0.78, 0.065], [0.845, 0.12], [0.865, 0.16], [0.85, 0.17], [0.83, 0.14], [0.77, 0.045], [0.6, 0], [0, 0]]
    .map(([x, y]) => new THREE.Vector2(x, y)), 96);
  const linkGeo = new THREE.TorusGeometry(0.03, 0.0095, 10, 20); linkGeo.scale(1, 1.5, 1);
  const TOP = new THREE.Vector3(0, -0.07, 0), rimY = -BAIL_H + 0.16;
  const ANCH = [new THREE.Vector3(-PR + 0.02, rimY, 0), new THREE.Vector3(PR - 0.02, rimY, 0), new THREE.Vector3(0, rimY, -PR + 0.02)];
  const pans = [-1, 1].map((s) => {
    const g = new THREE.Group(); scene.add(g);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.016, 14, 32), polished); hook.position.y = -0.03; g.add(hook);
    const step = 0.066, list = [];
    ANCH.forEach((b) => { const dir = b.clone().sub(TOP), len = dir.length(); dir.normalize(); const n = Math.floor(len / step);
      for (let k = 0; k < n; k++) list.push([TOP.clone().addScaledVector(dir, (k + 0.5) * step), dir, k]); });
    const links = new THREE.InstancedMesh(linkGeo, polished, list.length);
    const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), M = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
    list.forEach(([p, dir, k], i) => { q.setFromUnitVectors(Y, dir); q2.setFromAxisAngle(dir, (k % 2) * Math.PI / 2); M.compose(p, q2.multiply(q), one); links.setMatrixAt(i, M); });
    g.add(links);
    ANCH.forEach((a) => { const lug = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 10, 24), polished); lug.position.copy(a); lug.position.y += 0.03; lug.lookAt(0, a.y + 0.03, 0); g.add(lug); });
    const pan = new THREE.Mesh(panGeo, bluedTurned); pan.position.y = -BAIL_H; g.add(pan);
    return { s, g, phi: 0, phiV: 0 };
  });

  // ---------- эмоции: красные бруски с крупным белым текстом, как обложки рилсов ----------
  function plate(text, w, h, ink) {
    const W = 1024, Hh = Math.round(W * h / w), c = cv(W, Hh), x = c.getContext('2d');
    x.letterSpacing = '4px'; let fs = Math.round(Hh * 0.74);
    do { x.font = `400 ${fs}px Oswald, "Arial Narrow", sans-serif`; } while (x.measureText(text).width > W * 0.9 && --fs > 12);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = ink; x.fillText(text, W / 2, Hh * 0.55);
    return tex(c, true);
  }
  // гиря-кнопка как кнопки сайта: белая пилюля, тёмный текст, чёрный кружок с плюсом справа
  function button(text, w, h) {
    const W = 1024, Hh = Math.round(W * h / w), c = cv(W, Hh), x = c.getContext('2d'), r = Hh * 0.36, cx = W - r - Hh * 0.1;
    let fs = Math.round(Hh * 0.52);
    do { x.font = `600 ${fs}px "Golos Text", system-ui, sans-serif`; } while (x.measureText(text).width > cx - r - Hh * 0.25 && --fs > 12);
    x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#0c0d0f'; x.fillText(text, Hh * 0.08, Hh * 0.54);
    x.fillStyle = '#0c0d0f'; x.beginPath(); x.arc(cx, Hh / 2, r, 0, 7); x.fill();
    x.strokeStyle = '#f1f1ee'; x.lineWidth = Hh * 0.07; x.lineCap = 'round'; x.beginPath();
    x.moveTo(cx - r * 0.42, Hh / 2); x.lineTo(cx + r * 0.42, Hh / 2); x.moveTo(cx, Hh / 2 - r * 0.42); x.lineTo(cx, Hh / 2 + r * 0.42); x.stroke();
    return tex(c, true);
  }
  const FLOOR = -BAIL_H + 0.025, BH = 0.26;
  function contact(w, d, pill) {
    const W = 512, H = Math.round(W * d / w * 1.25), c = cv(W, H), x = c.getContext('2d');
    x.filter = `blur(${Math.round(H * 0.12)}px)`; x.fillStyle = '#000'; const px = W * 0.1, py = H * 0.2;
    x.beginPath(); x.roundRect(px, py, W - px * 2, H - py * 2, pill ? (H - py * 2) / 2 : H * 0.06); x.fill();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.2, d * 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0 }));
    m.rotation.x = -Math.PI / 2; return m;
  }
  // пирамидой: широкий снизу, узкий сверху — бруски помещаются внутри треугольника цепей
  const PROBLEMS = [['НЕОПРЕДЕЛЁННОСТЬ', 1.16, 0.02, -0.04], ['НЕПОНИМАНИЕ', 0.9, -0.02, 0.05], ['СТРАХ', 0.6, 0.01, 0.07]];
  const redMat = triplanar(new THREE.MeshPhysicalMaterial({ color: 0xe3262d, roughness: 0.62, metalness: 0, sheen: 0.4, sheenRoughness: 0.6, sheenColor: 0xff8a8f }), { rough: PL.rough, normal: PL.normal }, 5, 0.45);
  const problems = PROBLEMS.map(([t, w, dx, rot], i) => {
    const d = 0.3, m = new THREE.Group();
    m.add(new THREE.Mesh(new RoundedBoxGeometry(w, BH, d, 4, 0.03), redMat));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.05, BH - 0.05), new THREE.MeshBasicMaterial({ map: plate(t, w - 0.05, BH - 0.05, '#ffffff'), transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }));
    face.position.z = d / 2 + 0.001; m.add(face);
    const cs = contact(w, d); cs.position.y = -BH / 2 + 0.004; m.add(cs);
    m.visible = false; scene.add(m);
    return { m, cs, off: new THREE.Vector3(dx, FLOOR + BH / 2 + i * (BH + 0.008), 0.04), rot, landed: false,
      spin: new THREE.Euler(Math.random() * 1.2 - 0.6, Math.random() * 1.2 - 0.6, Math.random() * 1.2 - 0.6) };
  });

  // ---------- гири: объёмные белые кнопки сайта — главный акцент, пирамидой внутри цепей ----------
  const WH = 0.28, WD = 0.24;
  const whiteMat = triplanar(new THREE.MeshPhysicalMaterial({ color: 0xdedcd7, roughness: 0.55, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.18 }), { rough: PL.rough, normal: PL.normal }, 5, 0.3);
  const weights = [['Консультация', 1.24, 0.0, -0.03], ['Договор', 0.94, 0.02, 0.04], ['Суд', 0.68, -0.01, -0.04]].map(([t, w, dx, rot], i) => {
    const m = new THREE.Group();
    // пилюля: плоский фасад (как у кнопки), скруглённые торцы, мягкая фаска по контуру
    const r = WH / 2, st = new THREE.Shape(); st.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false); st.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false); st.closePath();
    m.add(new THREE.Mesh(extrude(st, WD - 0.06, 0.03), whiteMat));
    const fw = w - WH * 0.55, face = new THREE.Mesh(new THREE.PlaneGeometry(fw, WH * 0.8), new THREE.MeshBasicMaterial({ map: button(t, fw, WH * 0.8), transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }));
    face.position.z = WD / 2 + 0.001; m.add(face);
    const cs = contact(w, WD, true); cs.position.y = -WH / 2 - 0.026; m.add(cs);
    m.rotation.y = rot; m.visible = false; scene.add(m);
    return { m, cs, off: new THREE.Vector3(dx, FLOOR + WH / 2 + 0.03 + i * (WH + 0.075), 0.04), landed: false };
  });

  // ---------- сценарий: эмоции пачкой, пауза, гири пачкой ----------
  const BR = [[0.05, 0.13], [0.09, 0.17], [0.13, 0.21]], WG = [[0.4, 0.49], [0.44, 0.53], [0.48, 0.57]];
  const STAGES = [
    [0, '', 'Как я работаю', 'Смотри на весы.', ''],
    [0.05, '01', 'Перевес', 'Непонимание, неопределённость и страх тянут чашу вниз.', 'tilt'],
    [0.38, '02', 'Подключаюсь я', 'Консультация, договор, суд — на другую чашу.', 'tilt'],
    [0.6, '✓', 'Проблема решена', 'Непонимание, неопределённость и страх больше не тянут вниз.', 'level']];
  const capEl = stage.querySelector('.sc-cap'), cIdx = capEl.querySelector('.sc-idx'), cTitle = capEl.querySelector('.sc-title'), cText = capEl.querySelector('.sc-text');
  const bar = stage.querySelector('.sc-bar i'), gw = stage.querySelector('.sc-gword');
  let shown = -1;
  function caption(p) {
    let k = 0; STAGES.forEach((s, i) => { if (p >= s[0]) k = i; });
    if (k === shown) return; shown = k; const s = STAGES[k];
    capEl.classList.remove('in'); void capEl.offsetWidth;
    cIdx.textContent = s[1]; cTitle.textContent = s[2]; cText.textContent = s[3]; capEl.classList.add('in');
    chip.textContent = s[4] === 'level' ? 'Проблема решена' : k >= 1 ? 'Перевес' : 'Весы';
    if (gw) gw.textContent = s[4] === 'level' ? 'Решено' : k >= 1 ? 'Перевес' : '';
    stage.classList.toggle('is-level', s[4] === 'level'); stage.classList.toggle('is-tilt', s[4] === 'tilt');
  }

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const bounce = (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; };
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const MAX = 0.24, K = 0.08;
  let theta = 0, thetaV = 0, lastV = 0, running = false, visible = true, idle = 0;
  let pTarget = still ? 1 : 0, ps = pTarget, scrollP = pTarget, tProg = 0, autoOn = false, mx = 0, my = 0, smx = 0, smy = 0;
  const Z = new THREE.Vector3(0, 0, 1), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  // точка подвеса чаши: низ проушины на конце коромысла
  function hang(s, out) { const c = Math.cos(theta), n = Math.sin(theta); return out.set(s * HALF * c + HANG * n, PIVOT_Y + s * HALF * n - HANG * c, 0); }
  function panWorld(pan, local, out) { return out.copy(local).applyAxisAngle(Z, pan.phi).add(hang(pan.s, tmp)); }

  function progress() {
    const r = stage.getBoundingClientRect(), pin = stage.querySelector('.sc-pin'), run = r.height - pin.offsetHeight;
    scrollP = still ? 1 : clamp01((parseFloat(getComputedStyle(pin).top) - r.top) / Math.max(1, run));
    if (r.top > innerHeight && autoOn) { autoOn = false; tProg = 0; }
    pTarget = Math.max(scrollP, tProg); wake();
  }

  function drop(o, i, ranges, kick, pan, upright) {
    const t = clamp01((ps - ranges[i][0]) / (ranges[i][1] - ranges[i][0])), land = panWorld(pan, o.off, tmp2);
    o.m.visible = t > 0;
    // груз заносится спереди, под дугой подвеса, и ложится в чашу с отскоком — сквозь дугу ничего не проходит
    const zf = Math.pow(1 - Math.min(1, t * 1.25), 2);
    o.m.position.copy(land); o.m.position.y += (1 - bounce(t)) * 1.1 + zf * 0.5; o.m.position.z += zf * 2.2;
    const k = 1 - inOut(t);
    if (upright) o.m.rotation.z = pan.phi; else o.m.rotation.set(o.spin.x * k, o.rot + o.spin.y * k, o.spin.z * k + pan.phi);
    o.cs.material.opacity = 0.88 * clamp01((t - 0.85) / 0.15);
    const now = t >= 1; if (now && !o.landed) { thetaV += kick; pan.phiV += (Math.random() - 0.5) * 0.8; } o.landed = now; return now ? 1 : 0;
  }

  function step(dt) {
    if (autoOn && tProg < 1) tProg = Math.min(1, tProg + dt / 6);
    pTarget = Math.max(scrollP, tProg);
    ps += (pTarget - ps) * Math.min(1, dt * 7); if (Math.abs(pTarget - ps) < 0.0004) ps = pTarget;
    caption(ps); bar.style.transform = `scaleX(${ps})`;
    let L = 0, R = 0;
    problems.forEach((p, i) => { L += drop(p, i, BR, 0.5, pans[0], false); });
    weights.forEach((w, i) => { R += drop(w, i, WG, -0.45, pans[1], true); });
    // коромысло на оси: момент от разницы грузов, демпфирование в подшипнике
    const target = THREE.MathUtils.clamp(K * (L - R), -MAX, MAX);
    thetaV += ((target - theta) * 26 - thetaV * 4.2) * dt; theta += thetaV * dt;
    if (still) { theta = target; thetaV = 0; }
    const acc = (thetaV - lastV) / Math.max(dt, 1e-3); lastV = thetaV;
    beam.rotation.z = theta;
    // чаши — маятники на звене: гравитация возвращает к вертикали, рывок коромысла раскачивает
    pans.forEach((p) => {
      p.phiV += (-p.phi * 20 - p.phiV * 2.4 - acc * 0.02 * p.s) * dt; p.phi += p.phiV * dt; if (still) p.phi = p.phiV = 0;
      hang(p.s, p.g.position); p.g.rotation.z = p.phi;
    });
    const imb = Math.max(0, L - R) / 3, lv = clamp01((ps - 0.58) / 0.08);
    red.intensity += (imb * 3 - red.intensity) * Math.min(1, dt * 4);
    enamel.color.lerpColors(RED, GREEN, lv);
    key.intensity = 70 + 25 * lv;
    smx += (mx - smx) * Math.min(1, dt * 3); smy += (my - smy) * Math.min(1, dt * 3);
    frameCam();
    const moving = Math.abs(thetaV) + Math.abs(target - theta) + pans.reduce((a, p) => a + Math.abs(p.phiV) + Math.abs(p.phi), 0) > 0.002
      || ps !== pTarget || (autoOn && tProg < 1) || Math.abs(red.intensity - imb * 3) > 0.05 || Math.abs(smx - mx) + Math.abs(smy - my) > 0.003;
    idle = moving ? 0 : idle + dt;
  }

  let fit = 10, prev = 0, narrow = false;
  function frameCam() {
    camera.position.set(smx * 0.4, 3.3 + smy * 0.22, fit);
    camera.lookAt(0, 2.6, 0);
  }
  function frame(t) {
    const dt = Math.min(0.05, (t - (prev || t)) / 1000); prev = t;
    step(dt);
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    if (visible && idle < 0.6) requestAnimationFrame(frame); else { running = false; prev = 0; }
  }
  function wake() { idle = 0; if (!running && visible) { running = true; requestAnimationFrame(frame); } }

  const view = stage.querySelector('.sc-view');
  function resize() {
    const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; narrow = w < 560;
    const tan = 2 * Math.tan(THREE.MathUtils.degToRad(15));
    fit = Math.max(4.1 / tan, (narrow ? 5.6 : 5.3) / (tan * camera.aspect));
    camera.updateProjectionMatrix(); frameCam(); renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); progress();
  }
  new ResizeObserver(resize).observe(view);
  addEventListener('scroll', progress, { passive: true });
  if (matchMedia('(hover: hover)').matches) view.addEventListener('pointermove', (e) => {
    const r = view.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width - 0.5) * 2; my = ((e.clientY - r.top) / r.height - 0.5) * 2; wake();
  });
  view.addEventListener('pointerleave', () => { mx = my = 0; wake(); });
  new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) { progress(); wake(); } }, { threshold: 0 }).observe(stage);
  new IntersectionObserver((e) => { if (e[e.length - 1].isIntersecting && !autoOn) { autoOn = true; wake(); } }, { threshold: 0.6 }).observe(view);

  scene.traverse((o) => { if (o.isMesh && !o.material.isMeshBasicMaterial) { o.castShadow = true; o.receiveShadow = true; } });
  pans.forEach((p) => hang(p.s, p.g.position));
  stage.classList.add('is-ready');
  resize(); progress(); caption(ps); wake();
}
