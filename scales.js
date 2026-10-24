// Сцена «Весы» в блоке «Мой принцип работы». Нарисована языком самого сайта: плашки эмоций как красная плашка
// с именем, гири как белые кнопки, контурное слово на фоне как в заголовках разделов. Без 3D-библиотек — чистый SVG.
// История идёт сама, как только сцена на экране; прокрутка может её ускорить.
const stage = document.getElementById('scales');
if (stage) {
  const ready = document.fonts && document.fonts.load
    ? Promise.race([Promise.all([document.fonts.load('400 20px Oswald', 'НЕПОНИМАНИЕ ПЕРЕВЕС'), document.fonts.load('600 15px "Golos Text"', 'Консультация')]), new Promise((r) => setTimeout(r, 2500))])
    : Promise.resolve();
  ready.catch(() => {}).then(() => { try { boot(); } catch (e) { stage.hidden = true; } });
}

function boot() {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const view = stage.querySelector('.sc-view'), chip = stage.querySelector('.sc-state');

  // ---------- сцена ----------
  const W = 560, H = 400, PX = 280, PY = 92, HALF = 160, DROP = 124;
  const svg = el('svg', { class: 'sc-svg', viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' });
  view.querySelector('canvas')?.remove(); view.prepend(svg);
  const ghost = el('text', { class: 'sc-ghost', x: PX, y: 300, 'text-anchor': 'middle' }, svg);
  el('line', { class: 'sc-floor', x1: 0, x2: W, y1: 357.5, y2: 357.5 }, svg);
  // стойка
  el('rect', { class: 'sc-ink', x: PX - 62, y: 344, width: 124, height: 13, rx: 6.5 }, svg);
  el('rect', { class: 'sc-ink', x: PX - 6, y: PY, width: 12, height: 260, rx: 6 }, svg);
  el('path', { class: 'sc-ink', d: `M${PX - 7} ${PY - 18} L${PX} ${PY - 44} L${PX + 7} ${PY - 18} Z` }, svg);

  // чаша: цепи, сама чаша, группа для груза
  function pan() {
    const g = el('g', {}, svg);
    el('line', { class: 'sc-chain', x1: 0, y1: 0, x2: -88, y2: DROP }, g);
    el('line', { class: 'sc-chain', x1: 0, y1: 0, x2: 88, y2: DROP }, g);
    el('path', { class: 'sc-pan', d: `M-96 ${DROP} Q0 ${DROP + 30} 96 ${DROP}` }, g);
    el('circle', { class: 'sc-ink', cx: 0, cy: 0, r: 5 }, g);
    const load = el('g', {}, g);
    return { g, load, phi: 0, phiV: 0 };
  }
  const pans = [pan(), pan()];
  // коромысло поверх подвесов
  const beam = el('g', {}, svg);
  el('rect', { class: 'sc-ink', x: PX - HALF - 6, y: PY - 6, width: HALF * 2 + 12, height: 12, rx: 6 }, beam);
  el('circle', { class: 'sc-pivot', cx: PX, cy: PY, r: 15 }, svg);
  el('circle', { class: 'sc-hole', cx: PX, cy: PY, r: 4.5 }, svg);

  // ---------- груз: плашки эмоций и гири-кнопки ----------
  function plate(parent, text, kind) {
    const g = el('g', { class: 'sc-item ' + kind }, parent);
    const r = el('rect', { class: 'sc-body', rx: kind === 'pill' ? 17 : 5 }, g);
    const t = el('text', { class: 'sc-lbl', 'text-anchor': kind === 'pill' ? 'start' : 'middle', 'dominant-baseline': 'central' }, g);
    t.textContent = text;
    const tw = t.getComputedTextLength() || text.length * 11, h = 34;
    if (kind === 'pill') {
      const w = tw + 20 + 34; r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('x', -w / 2); r.setAttribute('y', -h);
      t.setAttribute('x', -w / 2 + 16); t.setAttribute('y', -h / 2 + 1);
      el('circle', { class: 'sc-dot', cx: w / 2 - 17, cy: -h / 2, r: 12 }, g);
      el('path', { class: 'sc-plus', d: `M${w / 2 - 22} ${-h / 2}h10M${w / 2 - 17} ${-h / 2 - 5}v10` }, g);
    } else {
      const w = tw + 28; r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('x', -w / 2); r.setAttribute('y', -h);
      t.setAttribute('x', 0); t.setAttribute('y', -h / 2 + 1);
    }
    g.style.opacity = 0;
    return g;
  }
  const GAP = 37, BASE = DROP + 6;
  const bricks = [['Непонимание', 'red', -4, 1.5], ['Неопределённость', 'white', 6, -1.2], ['Страх', 'red', -2, 2]]
    .map(([t, k, dx, rot], i) => ({ g: plate(pans[0].load, t, k), x: dx, y: BASE - i * GAP, rot, landed: false, spin: (Math.random() - 0.5) * 30 }));
  const weights = [['Консультация', 4, -1], ['Договор', -6, 1.2], ['Суд', 2, -1.5]]
    .map(([t, dx, rot], i) => ({ g: plate(pans[1].load, t, 'pill'), x: dx, y: BASE - i * GAP, rot, landed: false, spin: (Math.random() - 0.5) * 24 }));

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
    ghost.textContent = s[5];
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
