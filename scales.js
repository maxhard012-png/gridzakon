// Сцена «Весы» в блоке «Мой принцип работы», варианты B и C (A — 3D, см. scales3d.js).
// B — графика с объёмом: металл, тени, плашки-бруски, гири-кнопки, луч света.
// C — типографика: слова шрифтом заголовков сайта вместо плашек, красное коромысло.
// История идёт сама, как только сцена на экране; прокрутка может её ускорить.
const stage = document.getElementById('scales');
const VARIANT = window.SC_VARIANT || 'B';
if (stage && VARIANT !== 'A') {
  const ready = document.fonts && document.fonts.load
    ? Promise.race([Promise.all([document.fonts.load('400 20px Oswald', 'НЕПОНИМАНИЕ ПЕРЕВЕС'), document.fonts.load('200 20px Oswald', 'НЕОПРЕДЕЛЁННОСТЬ'),
      document.fonts.load('600 15px "Golos Text"', 'Консультация')]), new Promise((r) => setTimeout(r, 2500))])
    : Promise.resolve();
  ready.catch(() => {}).then(() => { try { boot(); } catch (e) { console.error(e); stage.hidden = true; } });
}

function boot() {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const view = stage.querySelector('.sc-view'), chip = stage.querySelector('.sc-state'), gword = stage.querySelector('.sc-gword');
  const RICH = VARIANT === 'B';
  stage.classList.add('v-' + VARIANT.toLowerCase());

  // ---------- сцена ----------
  const W = 560, H = 400, PX = 280, PY = 92, HALF = 160, DROP = 124;
  const svg = el('svg', { class: 'sc-svg', viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' });
  view.querySelector('canvas')?.remove(); view.prepend(svg);
  const defs = el('defs', {}, svg);
  const grad = (id, kind, attrs, stops) => { const g = el(kind, { id, ...attrs }, defs); stops.forEach(([o, c, a = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)); return `url(#${id})`; };
  let metalV, metalH, rimG, redG, greenG, shadowF, beamF;
  if (RICH) {
    metalV = grad('scMV', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#ffffff'], [0.32, '#dcdcd8'], [0.55, '#8f9195'], [0.78, '#e8e8e3'], [1, '#a9aaa7']]);
    metalH = grad('scMH', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, '#7d7f83'], [0.3, '#f6f6f2'], [0.55, '#c3c4c0'], [1, '#6c6e72']]);
    rimG = grad('scRim', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#2a2c30'], [1, '#6e7074']]);
    redG = grad('scRed', 'radialGradient', { cx: 0.38, cy: 0.32, r: 0.75 }, [[0, '#ff7a7e'], [0.45, '#e3262d'], [1, '#8a1015']]);
    greenG = grad('scGreen', 'radialGradient', { cx: 0.38, cy: 0.32, r: 0.75 }, [[0, '#7cf0a8'], [0.45, '#21b45f'], [1, '#0d6a35']]);
    grad('scCone', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#ffffff', 0.11], [1, '#ffffff', 0]]);
    grad('scFloor', 'radialGradient', { cx: 0.5, cy: 0.5, r: 0.5 }, [[0, '#ffffff', 0.09], [1, '#ffffff', 0]]);
    const f = el('filter', { id: 'scSh', x: '-30%', y: '-30%', width: '160%', height: '190%' }, defs);
    el('feDropShadow', { dx: 0, dy: 9, stdDeviation: 8, 'flood-color': '#000', 'flood-opacity': 0.65 }, f);
    const f2 = el('filter', { id: 'scBeam', x: '-10%', y: '-200%', width: '120%', height: '600%' }, defs);
    el('feDropShadow', { dx: 0, dy: 12, stdDeviation: 10, 'flood-color': '#000', 'flood-opacity': 0.7 }, f2);
    const f3 = el('filter', { id: 'scBlur', x: '-50%', y: '-200%', width: '200%', height: '500%' }, defs);
    el('feGaussianBlur', { stdDeviation: 7 }, f3);
    shadowF = 'url(#scSh)'; beamF = 'url(#scBeam)';
    // луч света сверху и пятно на полу
    const f4 = el('filter', { id: 'scSoft', x: '-40%', y: '-20%', width: '180%', height: '140%' }, defs); el('feGaussianBlur', { stdDeviation: 18 }, f4);
    el('path', { d: `M${PX - 30} -80 L${PX + 30} -80 L${PX + 230} 357 L${PX - 230} 357 Z`, fill: 'url(#scCone)', filter: 'url(#scSoft)', opacity: 0.8 }, svg);
    el('ellipse', { cx: PX, cy: 357, rx: 250, ry: 26, fill: 'url(#scFloor)' }, svg);
    el('ellipse', { cx: PX, cy: 358, rx: 92, ry: 9, fill: '#000', opacity: 0.75, filter: 'url(#scBlur)' }, svg);
  }
  el('line', { class: 'sc-floor', x1: 0, x2: W, y1: 357.5, y2: 357.5 }, svg);

  // стойка
  if (RICH) {
    el('path', { d: `M${PX - 78} 357 Q${PX - 74} 340 ${PX - 50} 338 L${PX + 50} 338 Q${PX + 74} 340 ${PX + 78} 357 Z`, fill: metalV, filter: shadowF }, svg);
    el('rect', { x: PX - 8, y: PY, width: 16, height: 250, rx: 8, fill: metalH }, svg);
    [150, 326].forEach((y) => el('rect', { x: PX - 14, y, width: 28, height: 9, rx: 4.5, fill: metalV }, svg));
    el('path', { d: `M${PX - 9} ${PY - 20} L${PX} ${PY - 52} L${PX + 9} ${PY - 20} Z`, fill: metalH }, svg);
  } else {
    el('rect', { class: 'sc-ink', x: PX - 60, y: 352, width: 120, height: 4, rx: 2 }, svg);
    el('rect', { class: 'sc-ink', x: PX - 1.5, y: PY, width: 3, height: 262 }, svg);
    el('path', { class: 'sc-ink', d: `M${PX - 5} ${PY - 16} L${PX} ${PY - 40} L${PX + 5} ${PY - 16} Z` }, svg);
  }

  // чаша: подвесы, чаша, группа для груза
  function pan() {
    const g = el('g', {}, svg);
    if (RICH) {
      [-1, 1].forEach((s) => el('line', { x1: 0, y1: 0, x2: s * 92, y2: DROP, stroke: '#cfd0cc', 'stroke-width': 2.6, 'stroke-dasharray': '5 3', 'stroke-linecap': 'round' }, g));
      el('line', { x1: 0, y1: 0, x2: 0, y2: DROP - 8, stroke: '#cfd0cc', 'stroke-width': 2.6, 'stroke-dasharray': '5 3', 'stroke-linecap': 'round', opacity: 0.55 }, g);
      el('path', { d: `M-102 ${DROP} C-74 ${DROP + 38} 74 ${DROP + 38} 102 ${DROP} Z`, fill: metalV, filter: shadowF }, g);
      el('ellipse', { cx: 0, cy: DROP, rx: 102, ry: 8, fill: rimG, stroke: '#f6f6f2', 'stroke-width': 1.4 }, g);
      el('circle', { cx: 0, cy: 0, r: 7, fill: metalV }, g);
    } else {
      [-1, 1].forEach((s) => el('line', { class: 'sc-chain', x1: 0, y1: 0, x2: s * 92, y2: DROP }, g));
      el('path', { class: 'sc-pan thin', d: `M-100 ${DROP} Q0 ${DROP + 24} 100 ${DROP}` }, g);
      el('circle', { class: 'sc-ink', cx: 0, cy: 0, r: 4 }, g);
    }
    const load = el('g', {}, g);
    return { g, load, phi: 0, phiV: 0 };
  }
  const pans = [pan(), pan()];
  // коромысло
  const beam = el('g', {}, svg);
  if (RICH) {
    el('rect', { x: PX - HALF - 8, y: PY - 8, width: HALF * 2 + 16, height: 16, rx: 8, fill: metalV, filter: beamF }, beam);
    el('rect', { x: PX - HALF, y: PY - 6, width: HALF * 2, height: 2, rx: 1, fill: '#fff', opacity: 0.7 }, beam);
    [-1, 1].forEach((s) => el('circle', { cx: PX + s * HALF, cy: PY, r: 11, fill: metalV }, beam));
  } else {
    el('rect', { class: 'sc-redbar', x: PX - HALF - 6, y: PY - 6, width: HALF * 2 + 12, height: 12, rx: 6 }, beam);
  }
  const pivot = el('circle', { class: 'sc-pivot', cx: PX, cy: PY, r: RICH ? 19 : 11 }, svg);
  if (RICH) { pivot.setAttribute('fill', redG); pivot.setAttribute('filter', shadowF); el('circle', { cx: PX, cy: PY, r: 19, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.35 }, svg); }
  el('circle', { class: 'sc-hole', cx: PX, cy: PY, r: RICH ? 5.5 : 3.5 }, svg);

  // ---------- груз ----------
  // B: брусок с торцом и бликом или гиря-кнопка с объёмом; C: просто слово шрифтом заголовков
  function item(parent, text, kind) {
    const g = el('g', { class: 'sc-item ' + kind }, parent);
    if (!RICH) {
      const big = kind.includes('big');
      const t = el('text', { class: 'sc-word' + (kind.includes('thin') ? ' thin' : '') + (kind.includes('red') ? ' red' : ''), 'text-anchor': 'middle', y: -4 }, g);
      t.style.fontSize = big ? '46px' : '27px';
      t.textContent = text; g.style.opacity = 0; return { g, h: big ? 44 : 29 };
    }
    const pill = kind === 'pill', h = 32, side = 6;
    const sideR = el('rect', { rx: pill ? 16 : 5, class: 'sc-side' }, g);
    const face = el('rect', { rx: pill ? 16 : 5, class: 'sc-body' }, g);
    const t = el('text', { class: 'sc-lbl', 'text-anchor': pill ? 'start' : 'middle', 'dominant-baseline': 'central' }, g);
    t.textContent = text;
    const tw = t.getComputedTextLength() || text.length * 11, w = pill ? tw + 56 : tw + 30;
    [[sideR, side], [face, 0]].forEach(([r, dy]) => { r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('x', -w / 2); r.setAttribute('y', -h - side + dy); });
    el('rect', { x: -w / 2 + (pill ? 14 : 4), y: -h - side + 1.5, width: w - (pill ? 28 : 8), height: 1.5, rx: 0.75, fill: '#fff', opacity: 0.45 }, g);
    if (pill) {
      t.setAttribute('x', -w / 2 + 17); t.setAttribute('y', -h / 2 - side + 1);
      el('circle', { class: 'sc-dot', cx: w / 2 - 18, cy: -h / 2 - side, r: 12 }, g);
      el('path', { class: 'sc-plus', d: `M${w / 2 - 23} ${-h / 2 - side}h10M${w / 2 - 18} ${-h / 2 - side - 5}v10` }, g);
    } else { t.setAttribute('x', 0); t.setAttribute('y', -h / 2 - side + 1); }
    g.setAttribute('filter', shadowF);
    g.style.opacity = 0;
    return { g, h: h + side + 1 };
  }
  function stack(list, panObj) {
    let y = DROP + (RICH ? 2 : 0);
    return list.map(([text, kind, dx, rot]) => { const it = item(panObj.load, text, kind), o = { g: it.g, x: dx, y, rot, landed: false, spin: (Math.random() - 0.5) * 30 }; y -= it.h + (RICH ? 3 : 4); return o; });
  }
  const bricks = stack(RICH
    ? [['Непонимание', 'red', -4, 1.5], ['Неопределённость', 'white', 6, -1.2], ['Страх', 'red', -2, 2]]
    : [['Непонимание', 'word', -2, 0], ['Неопределённость', 'word thin', 4, 0], ['Страх', 'word big red', 0, 0]], pans[0]);
  const weights = stack(RICH
    ? [['Консультация', 'pill', 4, -1], ['Договор', 'pill', -6, 1.2], ['Суд', 'pill', 2, -1.5]]
    : [['Консультация', 'word', 2, 0], ['Договор', 'word thin', -3, 0], ['Суд', 'word big', 0, 0]], pans[1]);

  // ---------- сценарий: эмоции пачкой, пауза, гири пачкой ----------
  const BR = [[0.05, 0.13], [0.09, 0.17], [0.13, 0.21]], WG = [[0.4, 0.49], [0.44, 0.53], [0.48, 0.57]];
  const STAGES = [
    [0, '', 'Как я работаю', 'Смотри на весы.', '', ''],
    [0.05, '01', 'Перевес', 'Непонимание, неопределённость и страх тянут чашу вниз.', 'tilt', 'Перевес'],
    [0.38, '02', 'Подключаюсь я', 'Консультация, договор, суд — на другую чашу.', 'tilt', 'Перевес'],
    [0.6, '✓', 'Проблема решена', 'Непонимание, неопределённость и страх больше не тянут вниз.', 'level', 'Решено']];
  const capEl = stage.querySelector('.sc-cap'), cIdx = capEl.querySelector('.sc-idx'), cTitle = capEl.querySelector('.sc-title'), cText = capEl.querySelector('.sc-text');
  const bar = stage.querySelector('.sc-bar i');
  let shown = -1;
  function caption(p) {
    let k = 0; STAGES.forEach((s, i) => { if (p >= s[0]) k = i; });
    if (k === shown) return; shown = k; const s = STAGES[k];
    capEl.classList.remove('in'); void capEl.offsetWidth;
    cIdx.textContent = s[1]; cTitle.textContent = s[2]; cText.textContent = s[3]; capEl.classList.add('in');
    chip.textContent = s[4] === 'level' ? 'Проблема решена' : k >= 1 ? 'Перевес' : 'Весы';
    if (gword) gword.textContent = s[5];
    if (RICH) pivot.setAttribute('fill', s[4] === 'level' ? greenG : redG);
    stage.classList.toggle('is-level', s[4] === 'level'); stage.classList.toggle('is-tilt', s[4] === 'tilt');
  }

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const bounce = (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; };
  const MAX = 0.2, K = 0.066;
  let theta = 0, thetaV = 0, lastV = 0, running = false, visible = true, idle = 0;
  let pTarget = still ? 1 : 0, ps = pTarget, scrollP = pTarget, tProg = 0, autoOn = false;

  function progress() {
    const r = stage.getBoundingClientRect(), pin = stage.querySelector('.sc-pin'), run = r.height - pin.offsetHeight;
    scrollP = still ? 1 : clamp01((parseFloat(getComputedStyle(pin).top) - r.top) / Math.max(1, run));
    if (r.top > innerHeight && autoOn) { autoOn = false; tProg = 0; }
    pTarget = Math.max(scrollP, tProg); wake();
  }
  function place(list, ranges, kick, panObj) {
    let n = 0;
    list.forEach((o, i) => {
      const t = clamp01((ps - ranges[i][0]) / (ranges[i][1] - ranges[i][0]));
      const y = o.y - (1 - bounce(t)) * 260, rot = o.rot + o.spin * (1 - t);
      o.g.style.opacity = t > 0 ? 1 : 0;
      o.g.setAttribute('transform', `translate(${o.x} ${y}) rotate(${rot})`);
      const now = t >= 1; if (now && !o.landed) { thetaV += kick; panObj.phiV += (Math.random() - 0.5) * 40; } o.landed = now; if (now) n++;
    });
    return n;
  }
  function step(dt) {
    if (autoOn && tProg < 1) tProg = Math.min(1, tProg + dt / 6);
    pTarget = Math.max(scrollP, tProg);
    ps += (pTarget - ps) * Math.min(1, dt * 7); if (Math.abs(pTarget - ps) < 0.0004) ps = pTarget;
    caption(ps); bar.style.transform = `scaleX(${ps})`;
    const L = place(bricks, BR, 0.5, pans[0]), R = place(weights, WG, -0.45, pans[1]);
    const target = Math.max(-MAX, Math.min(MAX, K * (L - R)));
    thetaV += ((target - theta) * 30 - thetaV * 4.6) * dt; theta += thetaV * dt;
    if (still) { theta = target; thetaV = 0; }
    const acc = (thetaV - lastV) / Math.max(dt, 1e-3); lastV = thetaV;
    beam.setAttribute('transform', `rotate(${-theta * 57.2958} ${PX} ${PY})`);
    pans.forEach((p, i) => {
      const s = i ? 1 : -1;
      p.phiV += (-p.phi * 26 - p.phiV * 3 + acc * 0.9 * s) * dt; p.phi += p.phiV * dt; if (still) p.phi = p.phiV = 0;
      const hx = PX + s * HALF * Math.cos(theta), hy = PY - s * HALF * Math.sin(theta);
      p.g.setAttribute('transform', `translate(${hx} ${hy}) rotate(${p.phi})`);
    });
    const moving = Math.abs(thetaV) + Math.abs(target - theta) + pans.reduce((a, p) => a + Math.abs(p.phiV) * 0.02 + Math.abs(p.phi) * 0.02, 0) > 0.0015
      || ps !== pTarget || (autoOn && tProg < 1);
    idle = moving ? 0 : idle + dt;
  }
  let prev = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - (prev || t)) / 1000); prev = t;
    step(dt);
    if (visible && idle < 0.4) requestAnimationFrame(frame); else { running = false; prev = 0; }
  }
  function wake() { idle = 0; if (!running && visible) { running = true; requestAnimationFrame(frame); } }

  addEventListener('scroll', progress, { passive: true });
  addEventListener('resize', progress);
  new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) { progress(); wake(); } }, { threshold: 0 }).observe(stage);
  new IntersectionObserver((e) => { if (e[e.length - 1].isIntersecting && !autoOn) { autoOn = true; wake(); } }, { threshold: 0.6 }).observe(view);
  stage.classList.add('is-ready');
  progress(); caption(ps); step(0.016); wake();
}
